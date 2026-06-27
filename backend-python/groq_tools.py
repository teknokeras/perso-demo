"""Groq tool/function-calling definitions for the 7 CRM tools — mirrors groqTools.ts."""

GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "view_customer",
            "description": "View a customer's record by ID.",
            "parameters": {
                "type": "object",
                "properties": {"id": {"type": "string", "description": "Customer ID, e.g. C-1042"}},
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_customer",
            "description": "Update fields on a customer's record.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "fields": {"type": "object", "description": "Fields to update"},
                },
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_customer",
            "description": "Delete a customer's record permanently.",
            "parameters": {
                "type": "object",
                "properties": {"id": {"type": "string"}},
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_refund",
            "description": "Process a refund against an order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "amount": {"type": "number"},
                },
                "required": ["order_id", "amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "access_pii",
            "description": "Access a customer's personally identifiable information.",
            "parameters": {
                "type": "object",
                "properties": {"id": {"type": "string"}},
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "export_data",
            "description": "Export a customer data report.",
            "parameters": {
                "type": "object",
                "properties": {"format": {"type": "string", "enum": ["csv", "json"]}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "bulk_update",
            "description": "Run a bulk update operation across all customer records.",
            "parameters": {
                "type": "object",
                "properties": {"operation": {"type": "string"}},
            },
        },
    },
]