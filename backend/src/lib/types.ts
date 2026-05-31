// ── Roles ─────────────────────────────────────────────────────────────────────

export type Role = 'viewer' | 'supervisor' | 'admin';

export const ROLES: Role[] = ['viewer', 'supervisor', 'admin'];

// ── Tool names ────────────────────────────────────────────────────────────────

export type ToolName = 'read_file' | 'create_file' | 'update_file' | 'delete_file';

export const TOOL_NAMES: ToolName[] = [
  'read_file',
  'create_file',
  'update_file',
  'delete_file',
];

// ── perso WASM response shapes ────────────────────────────────────────────────

export type Decision = 'Allow' | 'Deny';

export interface PersoInitOk {
  ok: true;
}

export interface PersoInitError {
  error: string;
}

export type PersoInitResponse = PersoInitOk | PersoInitError;

export interface PersoEvalResponse {
  decision: Decision;
  reason: string;
}

// ── /evaluate endpoint ────────────────────────────────────────────────────────

export interface EvaluateRequestBody {
  toolName: ToolName;
  args: Record<string, unknown>;
  role: Role;
  agentAttributes?: Record<string, unknown>;
  resourceAttributes?: Record<string, unknown>;
}

export interface EvaluateResponseBody {
  decision: Decision;
  reason: string;
  /** Echoed back so the frontend can display what was evaluated */
  toolName: ToolName;
  role: Role;
  /** Result of executing the mock tool — only present when decision is Allow */
  result?: string;
}

// ── Mock tool argument shapes ─────────────────────────────────────────────────

export interface ReadFileArgs {
  path: string;
}

export interface CreateFileArgs {
  path: string;
  content?: string;
}

export interface UpdateFileArgs {
  path: string;
  content: string;
}

export interface DeleteFileArgs {
  path: string;
}

// ── /chat endpoint ────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** A perso enforcement trace attached to a chat turn */
export interface PersoTrace {
  toolName: ToolName;
  args: Record<string, unknown>;
  role: Role;
  decision: Decision;
  reason: string;
  /** Result of mock tool execution — only present when decision is Allow */
  result?: string;
}

export interface ChatRequestBody {
  /** Full conversation history including the new user message at the end */
  messages: ChatMessage[];
  role: Role;
}

export interface ChatResponseBody {
  /** Gemini's final natural-language reply */
  reply: string;
  /** perso trace — present when Gemini attempted a tool call */
  trace?: PersoTrace;
}
