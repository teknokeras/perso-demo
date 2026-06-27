/**
 * Groq LLM client
 *
 * Implements the two-step function calling flow with perso interception:
 *   1. Send messages → Groq returns tool_calls
 *   2. perso evaluates → Allow or Deny
 *   3a. Allow → execute mock tool, send tool result → Groq replies
 *   3b. Deny  → short-circuit, return denial, no second Groq call
 *
 * agentAttributes are built per-request based on role:
 *   - user_id:      mock user ID (used for FieldEquals on delete_customer)
 *   - env:          always "production" in demo (controls export_data / bulk_update)
 *   - mfa_verified: present only when user says "MFA verified" (controls access_pii / bulk_update)
 *
 * resourceAttributes are resolved from mock data per tool:
 *   - delete_customer: { owner_id } looked up from CUSTOMERS store
 */

import Groq from 'groq-sdk';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'groq-sdk/resources/chat/completions.js';
import { executeMockTool, getResourceAttributes } from './mockTools.js';
import { GROQ_TOOLS } from './groqTools.js';
import type {
  ChatMessage,
  ChatResponseBody,
  PersoTrace,
  Role,
  ToolName,
} from './types.js';
import { getPerso } from './persoInstance.js';

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

// ── Agent attribute builder ───────────────────────────────────────────────────
// Determines what perso sees as the caller's session context.
// In a real app these would come from a JWT / session store.
// In the demo we derive them from role + the conversation text.

const MOCK_USER_IDS: Record<Role, string> = {
  agent: 'agt-099',
  manager: 'mgr-001',   // matches owner_id on C-1042 and C-2038 in mock data
  admin: 'adm-001',
};

const MOCK_ENV: Record<Role, string> = {
  agent: 'staging',
  manager: 'staging',
  admin: 'production',
}

function buildAgentAttributes(
  role: Role,
  conversationText: string,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {
    user_id: MOCK_USER_IDS[role] ?? 'unknown',
    env: MOCK_ENV[role] ?? 'staging',
  }

  // MFA: the user can claim it in their message — in a real app this
  // would come from a verified session flag, not the message text.
  // For the demo this is intentional: it shows that perso enforces
  // the attribute the host passes in, and the host controls that truth.
  const mfaMentioned = /mfa.*(verif|done|complet|passed)/i.test(conversationText)
    || /verif.*mfa/i.test(conversationText)
    || /i have mfa/i.test(conversationText);

  if (mfaMentioned) {
    attrs['mfa_verified'] = true;
  }

  return attrs;
}

// ── History conversion ────────────────────────────────────────────────────────

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

  // Build conversation text for MFA detection (last few turns)
  const conversationText = messages
    .slice(-4)
    .map((m) => m.content)
    .join(' ');

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

  const agentAttributes = buildAgentAttributes(role, conversationText);
  const resourceAttributes = getResourceAttributes(toolName, toolArgs);

  const persoResult = await getPerso()!.evaluate({
    tool: toolName,
    args: toolArgs,
    role,
    agentAttributes,
    resourceAttributes,
  });

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
  const roleContext: Record<Role, string> = {
    agent: 'view and update customer records, and process refunds up to $500',
    manager: 'view and update customers, delete own records, process refunds up to $2,000, access PII (with MFA), and export data',
    admin: 'perform all operations including bulk updates (requires MFA)',
  };

  return `You are a CRM assistant for a B2B SaaS company. The current user has the role: "${role}".

Your role allows you to: ${roleContext[role]}.

Available tools: view_customer, update_customer, delete_customer, process_refund, access_pii, export_data, bulk_update.

When a user asks you to perform an operation, call the appropriate tool with the correct arguments.
A policy engine (perso) will enforce whether the operation is permitted based on the user's role and attributes.
If a tool call is denied, explain clearly what happened and what the user's role allows instead.

Mock customer IDs: C-1042 (Alice Hartwell), C-2038 (Daniel Osei), C-9001 (Priya Menon — owned by another manager).
Mock order IDs: ORD-8821 ($249.99), ORD-9910 ($1,899.00), ORD-5533 ($89.50).

Be concise and professional.`;
}