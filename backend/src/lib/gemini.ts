/**
 * Gemini client
 *
 * Wraps @google/generative-ai and implements the two-step function calling
 * flow with perso interception between the two Gemini calls:
 *
 *   1. Send messages → Gemini returns function_call intent
 *   2. perso evaluates the intent → Allow or Deny
 *   3a. Allow → execute mock tool, send function_response → Gemini replies
 *   3b. Deny  → short-circuit, return denial without a second Gemini call
 */

import {
  GoogleGenerativeAI,
  Content,
  Part,
} from '@google/generative-ai';
import { persoEvaluate } from './perso.js';
import { executeMockTool } from './mockTools.js';
import { GEMINI_TOOLS } from './geminiTools.js';
import type {
  ChatMessage,
  ChatResponseBody,
  PersoTrace,
  Role,
  ToolName,
} from './types.js';

// ── Singleton ─────────────────────────────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

export function initGemini(): void {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in environment');
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('[gemini] client initialised');
}

export function isGeminiReady(): boolean {
  return genAI !== null;
}

// ── History conversion ────────────────────────────────────────────────────────
// Gemini uses { role: 'user' | 'model', parts: Part[] }
// Our ChatMessage uses { role: 'user' | 'assistant', content: string }

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  // All messages except the last — the last is the new user prompt
  return messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }] as Part[],
  }));
}

function getLatestUserMessage(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') {
    throw new Error('Last message in history must be a user message');
  }
  return last.content;
}

// ── Main chat function ────────────────────────────────────────────────────────

export async function chat(
  messages: ChatMessage[],
  role: Role,
): Promise<ChatResponseBody> {
  if (!genAI) throw new Error('Gemini client not initialised — call initGemini() first');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: GEMINI_TOOLS,
    systemInstruction: buildSystemPrompt(role),
  });

  const history  = toGeminiHistory(messages);
  const userText = getLatestUserMessage(messages);

  // ── Step 1: Send user message, get Gemini's response ─────────────────────
  const chatSession = model.startChat({ history });
  const firstResult = await chatSession.sendMessage(userText);
  const firstResponse = firstResult.response;

  // ── Check if Gemini wants to call a tool ─────────────────────────────────
  const functionCall = firstResponse.candidates?.[0]?.content?.parts
    ?.find((p) => p.functionCall != null)?.functionCall;

  if (!functionCall) {
    // No tool call — return the text response directly
    return { reply: firstResponse.text() };
  }

  // ── Step 2: perso evaluates the tool call intent ──────────────────────────
  const toolName = functionCall.name as ToolName;
  const toolArgs = (functionCall.args ?? {}) as Record<string, unknown>;

  const persoResult = persoEvaluate(toolName, toolArgs, role);

  const trace: PersoTrace = {
    toolName,
    args:     toolArgs,
    role,
    decision: persoResult.decision,
    reason:   persoResult.reason,
  };

  // ── Step 3a: Deny — short circuit, no tool execution ─────────────────────
  if (persoResult.decision === 'Deny') {
    return {
      reply: `I wanted to call \`${toolName}\` but your current role (**${role}**) is not permitted to do that.\n\n> ${persoResult.reason}`,
      trace,
    };
  }

  // ── Step 3b: Allow — execute mock tool, send result back to Gemini ────────
  const toolResult = executeMockTool(toolName, toolArgs);
  trace.result = toolResult;

  const secondResult = await chatSession.sendMessage([
    {
      functionResponse: {
        name: toolName,
        response: { output: toolResult },
      },
    },
  ]);

  return {
    reply: secondResult.response.text(),
    trace,
  };
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(role: Role): string {
  return `You are a helpful file system assistant. The current user has the role: "${role}".

You have access to file tools (read_file, create_file, update_file, delete_file).
When a user asks you to perform a file operation, call the appropriate tool.
A policy engine will decide whether the operation is permitted based on the user's role.
If a tool call is denied, explain clearly what happened and what the user's role allows.

Available files in the system include paths like /etc/config.json, /var/log/app.log, /home/user/notes.txt, and /app/secrets.env.
Be concise and helpful.`;
}
