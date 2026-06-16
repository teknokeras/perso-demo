/**
 * Mock CRM tool implementations.
 * No real database — returns plausible fake responses so the demo
 * shows end-to-end flow without any side effects.
 *
 * owner_id maps to mock manager user IDs:
 *   mgr-001 → the logged-in manager in the demo
 *   mgr-002 → a different manager (triggers FieldEquals deny for delete_customer)
 */

import type {
  ToolName,
  Customer,
  ViewCustomerArgs,
  UpdateCustomerArgs,
  DeleteCustomerArgs,
  ProcessRefundArgs,
  AccessPiiArgs,
  ExportDataArgs,
  BulkUpdateArgs,
} from './types.js';

// ── Mock data store ───────────────────────────────────────────────────────────

const CUSTOMERS: Record<string, Customer> = {
  'C-1042': {
    id: 'C-1042',
    name: 'Alice Hartwell',
    email: 'alice.hartwell@example.com',
    phone: '+1-555-0192',
    plan: 'Pro',
    status: 'active',
    owner_id: 'mgr-001',   // owned by the demo manager
    created_at: '2023-08-14',
    ssn: '***-**-4821',
    card_last4: '4242',
    card_type: 'Visa',
  },
  'C-2038': {
    id: 'C-2038',
    name: 'Daniel Osei',
    email: 'daniel.osei@example.com',
    phone: '+1-555-0374',
    plan: 'Starter',
    status: 'active',
    owner_id: 'mgr-001',   // also owned by demo manager
    created_at: '2024-01-03',
    ssn: '***-**-7705',
    card_last4: '8833',
    card_type: 'Mastercard',
  },
  'C-9001': {
    id: 'C-9001',
    name: 'Priya Menon',
    email: 'priya.menon@example.com',
    phone: '+1-555-0581',
    plan: 'Enterprise',
    status: 'active',
    owner_id: 'mgr-002',   // owned by a DIFFERENT manager — triggers deny on delete
    created_at: '2022-11-29',
    ssn: '***-**-3390',
    card_last4: '1177',
    card_type: 'Amex',
  },
};

const ORDERS: Record<string, { customer_id: string; amount: number; status: string }> = {
  'ORD-8821': { customer_id: 'C-1042', amount: 249.99, status: 'delivered' },
  'ORD-9910': { customer_id: 'C-2038', amount: 1899.00, status: 'delivered' },
  'ORD-5533': { customer_id: 'C-9001', amount: 89.50, status: 'delivered' },
};

// ── Tool implementations ──────────────────────────────────────────────────────

function viewCustomer(args: ViewCustomerArgs): string {
  const c = CUSTOMERS[args.customer_id];
  if (!c) return `Customer not found: ${args.customer_id}`;

  return [
    `Customer: ${c.id}`,
    `Name:     ${c.name}`,
    `Email:    ${c.email}`,
    `Phone:    ${c.phone}`,
    `Plan:     ${c.plan}`,
    `Status:   ${c.status}`,
    `Created:  ${c.created_at}`,
  ].join('\n');
}

function updateCustomer(args: UpdateCustomerArgs): string {
  const c = CUSTOMERS[args.customer_id];
  if (!c) return `Customer not found: ${args.customer_id}`;

  const allowed = ['email', 'phone', 'plan', 'status'] as const;
  type Field = typeof allowed[number];

  if (!allowed.includes(args.field as Field)) {
    return `Field "${args.field}" is not updatable. Allowed: ${allowed.join(', ')}`;
  }

  const record = c as unknown as Record<string, unknown>;
  const old = record[args.field];
  record[args.field] = args.value;

  return `Updated ${args.customer_id}.${args.field}: "${old}" → "${args.value}"`;
}

function deleteCustomer(args: DeleteCustomerArgs): string {
  const c = CUSTOMERS[args.customer_id];
  if (!c) return `Customer not found: ${args.customer_id}`;

  const name = c.name;
  delete CUSTOMERS[args.customer_id];
  return `Deleted customer ${args.customer_id} (${name}). Record permanently removed.`;
}

function processRefund(args: ProcessRefundArgs): string {
  const order = ORDERS[args.order_id];
  if (!order) return `Order not found: ${args.order_id}`;

  const customer = CUSTOMERS[order.customer_id];
  const customerName = customer?.name ?? order.customer_id;

  return [
    `Refund processed`,
    `Order:    ${args.order_id}`,
    `Customer: ${customerName}`,
    `Amount:   $${args.amount.toFixed(2)}`,
    `Reason:   ${args.reason ?? 'Not specified'}`,
    `Status:   Refund queued — expected 3–5 business days`,
  ].join('\n');
}

function accessPii(args: AccessPiiArgs): string {
  const c = CUSTOMERS[args.customer_id];
  if (!c) return `Customer not found: ${args.customer_id}`;

  return [
    `PII for ${c.id} — ${c.name}`,
    `SSN:          ${c.ssn}`,
    `Card:         ${c.card_type} ending ${c.card_last4}`,
    `Email:        ${c.email}`,
    `Phone:        ${c.phone}`,
    `⚠ This access has been logged for compliance audit.`,
  ].join('\n');
}

function exportData(args: ExportDataArgs): string {
  const count = Math.floor(Math.random() * 900) + 100;
  return [
    `Export ready`,
    `Report:     ${args.report_type}`,
    `Date range: ${args.date_range ?? 'all time'}`,
    `Records:    ${count}`,
    `Format:     CSV`,
    `Download:   /exports/${args.report_type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`,
  ].join('\n');
}

function bulkUpdate(args: BulkUpdateArgs): string {
  const affected = Math.floor(Math.random() * 200) + 10;
  return [
    `Bulk update complete`,
    `Filter:   ${args.filter}`,
    `Field:    ${args.field}`,
    `Value:    ${args.value}`,
    `Affected: ${affected} records`,
    `⚠ Change logged to audit trail.`,
  ].join('\n');
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function executeMockTool(
  toolName: ToolName,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case 'view_customer':
      return viewCustomer(args as unknown as ViewCustomerArgs);
    case 'update_customer':
      return updateCustomer(args as unknown as UpdateCustomerArgs);
    case 'delete_customer':
      return deleteCustomer(args as unknown as DeleteCustomerArgs);
    case 'process_refund':
      return processRefund(args as unknown as ProcessRefundArgs);
    case 'access_pii':
      return accessPii(args as unknown as AccessPiiArgs);
    case 'export_data':
      return exportData(args as unknown as ExportDataArgs);
    case 'bulk_update':
      return bulkUpdate(args as unknown as BulkUpdateArgs);
    default:
      throw new Error(`Unknown tool: ${toolName as string}`);
  }
}

// ── Resource attribute resolver ───────────────────────────────────────────────
// Called by groq.ts before perso.evaluate() to populate resourceAttributes
// for tools that need them (currently just delete_customer).

export function getResourceAttributes(
  toolName: ToolName,
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (toolName === 'delete_customer') {
    const customerId = args['customer_id'] as string | undefined;
    const customer = customerId ? CUSTOMERS[customerId] : undefined;
    return customer ? { owner_id: customer.owner_id } : {};
  }
  return {};
}