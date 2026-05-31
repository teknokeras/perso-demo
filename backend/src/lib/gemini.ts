/**
 * Gemini client — @google/genai v2
 *
 * Two-step function calling flow with perso interception:
 *   1. Send messages → Gemini returns functionCalls
 *   2. perso evaluates → Allow or Deny
 *   3a. Allow → execute mock tool, send functionResponse → Gemini replies
 *   3b. Deny  → short-circuit, return denial, no second Gemini call
 */

import { GoogleGenAI, type Content } from '@google/genai';
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

let ai: GoogleGenAI | null = null;

export function initGemini(): void {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in environment');
  ai = new GoogleGenAI({ apiKey });
  console.log('[gemini] client initialised');
}

export function isGeminiReady(): boolean {
  return ai !== null;
}

// ── History conversion ────────────────────────────────────────────────────────
// v2 uses Content[] with role 'user' | 'model'
// Our ChatMessage uses role 'user' | 'assistant'

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  // All messages except the last — the last is sent as the new user message
  return messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
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
  if (!ai) throw new Error('Gemini client not initialised — call initGemini() first');

  const history = toGeminiHistory(messages);
  const userText = getLatestUserMessage(messages);

  // ── Step 1: Send user message ─────────────────────────────────────────────
  const chatSession = ai.chats.create({
    model: 'gemini-2.0-flash',
    history,
    config: {
      systemInstruction: buildSystemPrompt(role),
      tools: GEMINI_TOOLS,
    },
  });

  const firstResponse = await chatSession.sendMessage({ message: userText });

  // ── Check if Gemini wants to call a tool ─────────────────────────────────
  const functionCalls = firstResponse.functionCalls;
  const functionCall = functionCalls?.[0];

  if (!functionCall) {
    return { reply: firstResponse.text ?? '' };
  }

  // ── Step 2: perso evaluates the tool call intent ──────────────────────────
  const toolName = functionCall.name as ToolName;
  const toolArgs = (functionCall.args ?? {}) as Record<string, unknown>;

  const persoResult = persoEvaluate(toolName, toolArgs, role);

  const trace: PersoTrace = {
    toolName,
    args: toolArgs,
    role,
    decision: persoResult.decision,
    reason: persoResult.reason,
  };

  // ── Step 3a: Deny — short circuit ─────────────────────────────────────────
  if (persoResult.decision === 'Deny') {
    return {
      reply: `I wanted to call \`${toolName}\` but your current role (**${role}**) is not permitted to do that.\n\n> ${persoResult.reason}`,
      trace,
    };
  }

  // ── Step 3b: Allow — execute mock tool, send result back to Gemini ────────
  const toolResult = executeMockTool(toolName, toolArgs);
  trace.result = toolResult;

  const secondResponse = await chatSession.sendMessage({
    message: [
      {
        functionResponse: {
          id: functionCall.id ?? toolName,
          name: toolName,
          response: { output: toolResult },
        },
      },
    ],
  });

  return {
    reply: secondResponse.text ?? '',
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

Available files include: /etc/config.json, /var/log/app.log, /home/user/notes.txt, /app/secrets.env.
Be concise and helpful.`;
}
