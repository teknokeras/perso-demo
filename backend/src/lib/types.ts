// ── Roles ─────────────────────────────────────────────────────────────────────

export type Role = 'agent' | 'manager' | 'admin';

export const ROLES: Role[] = ['agent', 'manager', 'admin'];

// ── Tool names ────────────────────────────────────────────────────────────────

export type ToolName =
  | 'view_customer'
  | 'update_customer'
  | 'delete_customer'
  | 'process_refund'
  | 'access_pii'
  | 'export_data'
  | 'bulk_update';

export const TOOL_NAMES: ToolName[] = [
  'view_customer',
  'update_customer',
  'delete_customer',
  'process_refund',
  'access_pii',
  'export_data',
  'bulk_update',
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
  toolName: ToolName;
  role: Role;
  result?: string;
}

// ── Mock tool argument shapes ─────────────────────────────────────────────────

export interface ViewCustomerArgs {
  customer_id: string;
}

export interface UpdateCustomerArgs {
  customer_id: string;
  field: string;
  value: string;
}

export interface DeleteCustomerArgs {
  customer_id: string;
}

export interface ProcessRefundArgs {
  order_id: string;
  amount: number;
  reason?: string;
}

export interface AccessPiiArgs {
  customer_id: string;
}

export interface ExportDataArgs {
  report_type: string;
  date_range?: string;
}

export interface BulkUpdateArgs {
  filter: string;
  field: string;
  value: string;
}

// ── /chat endpoint ────────────────────────────────────────────────────────────

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

export interface ChatRequestBody {
  messages: ChatMessage[];
  role: Role;
}

export interface ChatResponseBody {
  reply: string;
  trace?: PersoTrace;
}

// ── Mock CRM data ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  owner_id: string; // manager user_id who owns this record
  created_at: string;
  // PII — only returned by access_pii
  ssn?: string;
  card_last4?: string;
  card_type?: string;
}