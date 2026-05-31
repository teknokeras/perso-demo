/**
 * perso WASM bridge
 *
 * Implements the ABI described in the perso README:
 *   alloc(len)                         → ptr
 *   dealloc(ptr, len)
 *   init(policyPtr, policyLen)         → responsePtr   [length-prefixed JSON]
 *   evaluate(tPtr,tLen, aPtr,aLen, cPtr,cLen) → responsePtr
 *
 * All responses are length-prefixed buffers:
 *   [u32 LE length (4 bytes)][UTF-8 JSON body]
 *
 * The host (this module) calls alloc before every write, and dealloc after
 * reading every response.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PersoInitResponse, PersoEvalResponse } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── WASM export types ─────────────────────────────────────────────────────────

interface PersoExports {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  dealloc: (ptr: number, len: number) => void;
  init: (ptr: number, len: number) => number;
  evaluate: (
    tPtr: number, tLen: number,
    aPtr: number, aLen: number,
    cPtr: number, cLen: number,
  ) => number;
}

// ── Module state ──────────────────────────────────────────────────────────────

let exports_: PersoExports | null = null;
let initialised = false;

// ── ABI helpers ───────────────────────────────────────────────────────────────

function getExports(): PersoExports {
  if (!exports_) throw new Error('perso WASM not loaded — call loadPerso() first');
  return exports_;
}

/** Write a JS string into WASM linear memory; return [ptr, len]. */
function writeString(str: string): [number, number] {
  const { memory, alloc } = getExports();
  const bytes = new TextEncoder().encode(str);
  const ptr = alloc(bytes.length);
  new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
  return [ptr, bytes.length];
}

/** Read a length-prefixed response buffer, dealloc it, return parsed value. */
function readResponse<T>(ptr: number): T {
  const { memory, dealloc } = getExports();
  const view = new DataView(memory.buffer);
  const len = view.getUint32(ptr, /* littleEndian */ true);
  const body = new Uint8Array(memory.buffer, ptr + 4, len);
  const json = new TextDecoder().decode(body);
  dealloc(ptr, 4 + len);
  return JSON.parse(json) as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load the WASM binary from disk and initialise it with the policy JSON.
 * Safe to call multiple times — subsequent calls hot-reload the policy.
 */
export async function loadPerso(
  wasmPath?: string,
  policyPath?: string,
): Promise<void> {
  const resolvedWasm   = wasmPath   ?? resolve(__dirname, '../wasm/perso.wasm');
  const resolvedPolicy = policyPath ?? resolve(__dirname, '../wasm/policy.json');

  const wasmBytes  = readFileSync(resolvedWasm);
  const policyJson = readFileSync(resolvedPolicy, 'utf8');

  const { instance } = await WebAssembly.instantiate(wasmBytes);
  exports_ = instance.exports as unknown as PersoExports;

  const [ptr, len] = writeString(policyJson);
  const resp = readResponse<PersoInitResponse>(exports_.init(ptr, len));

  if ('error' in resp) {
    throw new Error(`perso init failed: ${resp.error}`);
  }

  initialised = true;
  console.log('[perso] WASM loaded and policy initialised');
}

/** True once loadPerso() has completed successfully. */
export function isPersoReady(): boolean {
  return initialised;
}

/**
 * Evaluate a tool call against the loaded policy.
 *
 * @param toolName       The MCP tool being called
 * @param args           The LLM-supplied arguments
 * @param role           The caller's role (from session/JWT)
 * @param agentAttrs     Optional session attributes (user_id, env, mfa_verified…)
 * @param resourceAttrs  Optional resource attributes (owner_id…)
 */
export function persoEvaluate(
  toolName: string,
  args: Record<string, unknown>,
  role: string,
  agentAttrs: Record<string, unknown> = {},
  resourceAttrs: Record<string, unknown> = {},
): PersoEvalResponse {
  if (!initialised) {
    throw new Error('perso WASM not initialised');
  }

  const context = { role, agent_attrs: agentAttrs, resource_attrs: resourceAttrs };

  const [tPtr, tLen] = writeString(toolName);
  const [aPtr, aLen] = writeString(JSON.stringify(args));
  const [cPtr, cLen] = writeString(JSON.stringify(context));

  return readResponse<PersoEvalResponse>(
    getExports().evaluate(tPtr, tLen, aPtr, aLen, cPtr, cLen),
  );
}

/**
 * Hot-reload the policy without restarting the server.
 * Passes new policy JSON to init() inside the already-loaded WASM instance.
 */
export function persoReloadPolicy(policyJson: string): PersoInitResponse {
  if (!exports_) throw new Error('perso WASM not loaded');
  const [ptr, len] = writeString(policyJson);
  return readResponse<PersoInitResponse>(exports_.init(ptr, len));
}
