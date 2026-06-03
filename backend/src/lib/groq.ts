/**
 * Groq LLM client
 *
 * Implements the two-step function calling flow with perso interception:
 *   1. Send messages → Groq returns tool_calls
 *   2. perso evaluates → Allow or Deny
 *   3a. Allow → execute mock tool, send tool result → Groq replies
 *   3b. Deny  → short-circuit, return denial, no second Groq call
 *
 * Groq uses the OpenAI-compatible chat completions API, so the message
 * format is: { role, content } with tool messages as { role: 'tool', ... }
 */

import Groq from 'groq-sdk';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'groq-sdk/resources/chat/completions.js';
import { persoEvaluate } from './perso.js';
import { executeMockTool } from './mockTools.js';
import { GROQ_TOOLS } from './groqTools.js';
import type {
  ChatMessage,
  ChatResponseBody,
  PersoTrace,
  Role,
  ToolName,
} from './types.js';

// ── Singleton ─────────────────────────────────────────────────────────────────

let groq: Groq | null = null;

function getModel(): string {
  const model = process.env.GROQ_MODEL;
  if (!model) throw new Error('GROQ_MODEL is not set in environment');
  return model;
}

export function initGroq(): void {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment');
  groq = new Groq({ apiKey });
  console.log(`[groq] client initialised (${process.env.GROQ_MODEL ?? '(GROQ_MODEL not set)'})`);
}

export function isGroqReady(): boolean {
  return groq !== null;
}

// ── History conversion ────────────────────────────────────────────────────────
// Groq uses OpenAI format: { role: 'user' | 'assistant' | 'system' | 'tool', content }
// Our ChatMessage uses: { role: 'user' | 'assistant', content }

function toGroqHistory(messages: ChatMessage[], role: Role): ChatCompletionMessageParam[] {
  const system: ChatCompletionMessageParam = {
    role: 'system',
    content: buildSystemPrompt(role),
  };
  const history: ChatCompletionMessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  return [system, ...history];
}

// ── Main chat function ────────────────────────────────────────────────────────

export async function chat(
  messages: ChatMessage[],
  role: Role,
): Promise<ChatResponseBody> {
  if (!groq) throw new Error('Groq client not initialised — call initGroq() first');

  const groqMessages = toGroqHistory(messages, role);

  // ── Step 1: Send messages, get Groq's response ────────────────────────────
  const firstCompletion = await groq.chat.completions.create({
    model: getModel(),
    messages: groqMessages,
    tools: GROQ_TOOLS,
    tool_choice: 'auto',
    parallel_tool_calls: false,
  });

  const firstChoice = firstCompletion.choices[0];
  const firstMessage = firstChoice?.message;
  const toolCalls = firstMessage?.tool_calls;

  // ── No tool call — return text directly ───────────────────────────────────
  if (!toolCalls || toolCalls.length === 0) {
    return { reply: firstMessage?.content ?? '' };
  }

  // ── Step 2: perso evaluates the first tool call ───────────────────────────
  const toolCall = toolCalls[0];
  const toolName = toolCall.function.name as ToolName;
  const toolArgs = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

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

  // ── Step 3b: Allow — execute mock tool, send result back to Groq ──────────
  const toolResult = executeMockTool(toolName, toolArgs);
  trace.result = toolResult;

  // Build the follow-up message history:
  // original history + assistant message with tool_calls + tool result
  const assistantMsg: ChatCompletionMessageParam = {
    role: 'assistant',
    content: firstMessage.content ?? null,
    tool_calls: toolCalls,
  };

  const toolResultMsg: ChatCompletionToolMessageParam = {
    role: 'tool',
    tool_call_id: toolCall.id,
    content: toolResult,
  };

  const secondCompletion = await groq.chat.completions.create({
    model: getModel(),
    messages: [...groqMessages, assistantMsg, toolResultMsg],
    tools: GROQ_TOOLS,
  });

  const reply = secondCompletion.choices[0]?.message?.content ?? '';

  return { reply, trace };
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
