// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  features: {
    wasm: boolean;
    llm: boolean;
  };
}

// ── Shared domain types ───────────────────────────────────────────────────────

export type Role = 'agent' | 'manager' | 'admin';
export type ToolName =
  | 'view_customer'
  | 'update_customer'
  | 'delete_customer'
  | 'process_refund'
  | 'access_pii'
  | 'export_data'
  | 'bulk_update';
export type Decision = 'Allow' | 'Deny';

// ── /evaluate ─────────────────────────────────────────────────────────────────

export interface EvaluateRequest {
  toolName: ToolName;
  args: Record<string, unknown>;
  role: Role;
  agentAttributes?: Record<string, unknown>;
  resourceAttributes?: Record<string, unknown>;
}

export interface EvaluateResponse {
  decision: Decision;
  reason: string;
  toolName: ToolName;
  role: Role;
  result?: string;
}

// ── /chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PersoTrace {
  toolName: ToolName;
  args: Record<string, unknown>;
  role: Role;
  decision: Decision;
  reason: string;
  result?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  role: Role;
}

export interface ChatResponse {
  reply: string;
  trace?: PersoTrace;
}
