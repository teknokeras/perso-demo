/**
 * Groq tool definitions for the seven CRM mock tools.
 * Groq uses the OpenAI-compatible ChatCompletionTool format.
 */

import type { ChatCompletionTool } from 'groq-sdk/resources/chat/completions.js';

export const GROQ_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'view_customer',
      description: 'Look up a customer record by ID. Returns name, email, phone, plan, and status.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            description: 'Customer ID, e.g. C-1042',
          },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_customer',
      description: 'Update a single field on a customer record. Allowed fields: email, phone, plan, status.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            description: 'Customer ID, e.g. C-1042',
          },
          field: {
            type: 'string',
            enum: ['email', 'phone', 'plan', 'status'],
            description: 'The field to update.',
          },
          value: {
            type: 'string',
            description: 'New value for the field.',
          },
        },
        required: ['customer_id', 'field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_customer',
      description: 'Permanently delete a customer record. Managers can only delete records they own.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            description: 'Customer ID, e.g. C-1042',
          },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'process_refund',
      description: 'Issue a refund for a customer order. Agents can refund up to $500, managers up to $2,000.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'Order ID to refund, e.g. ORD-8821',
          },
          amount: {
            type: 'number',
            description: 'Refund amount in USD.',
          },
          reason: {
            type: 'string',
            description: 'Reason for the refund. Optional.',
          },
        },
        required: ['order_id', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'access_pii',
      description: 'Retrieve full PII for a customer: SSN, card number, email, phone. Requires MFA verification.',
      parameters: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            description: 'Customer ID, e.g. C-1042',
          },
        },
        required: ['customer_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_data',
      description: 'Export a customer data report as CSV. Only permitted in production environment.',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            description: 'Type of report, e.g. "Q2 customers", "inactive accounts"',
          },
          date_range: {
            type: 'string',
            description: 'Optional date range, e.g. "2024-Q2" or "last 90 days"',
          },
        },
        required: ['report_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update',
      description: 'Apply a field update to all records matching a filter. Admin only. Requires MFA and production env.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Filter expression, e.g. "status = inactive" or "plan = Starter"',
          },
          field: {
            type: 'string',
            description: 'Field to update on all matched records.',
          },
          value: {
            type: 'string',
            description: 'New value to set.',
          },
        },
        required: ['filter', 'field', 'value'],
      },
    },
  },
];