"""
Fake CRM implementations + resource attribute resolver.

Mirrors backend/src/lib/mockTools.ts in the Node backend. No real
database — every tool here returns canned data matching the scenario
documented in the perso-demo README.
"""

from __future__ import annotations

from typing import Any

CUSTOMERS: dict[str, dict[str, Any]] = {
    "C-1042": {"id": "C-1042", "name": "Alice Hartwell", "plan": "Pro", "owner_id": "mgr-001"},
    "C-2038": {"id": "C-2038", "name": "Daniel Osei", "plan": "Starter", "owner_id": "mgr-001"},
    "C-9001": {"id": "C-9001", "name": "Priya Menon", "plan": "Enterprise", "owner_id": "mgr-002"},
}

ORDERS: dict[str, dict[str, Any]] = {
    "ORD-8821": {"id": "ORD-8821", "customer_id": "C-1042", "amount": 249.99},
    "ORD-9910": {"id": "ORD-9910", "customer_id": "C-2038", "amount": 1899.00},
    "ORD-5533": {"id": "ORD-5533", "customer_id": "C-9001", "amount": 89.50},
}


def resolve_resource_attributes(tool: str, args: dict[str, Any]) -> dict[str, Any]:
    """
    Build the ResourceAttributes bag perso needs for a given tool call,
    e.g. looking up a customer's owner_id so FieldEquals can check
    ownership. This is the Python equivalent of the resource attribute
    resolver described in the Node backend's mockTools.ts.
    """
    customer_id = args.get("id") or args.get("customer_id")
    if customer_id and customer_id in CUSTOMERS:
        return {"owner_id": CUSTOMERS[customer_id]["owner_id"]}
    return {}


def view_customer(args: dict[str, Any]) -> dict[str, Any]:
    customer = CUSTOMERS.get(args.get("id", ""))
    if not customer:
        return {"error": f"customer {args.get('id')} not found"}
    return customer


def update_customer(args: dict[str, Any]) -> dict[str, Any]:
    customer = CUSTOMERS.get(args.get("id", ""))
    if not customer:
        return {"error": f"customer {args.get('id')} not found"}
    return {**customer, "updated": True, "fields": args.get("fields", {})}


def delete_customer(args: dict[str, Any]) -> dict[str, Any]:
    customer_id = args.get("id", "")
    if customer_id not in CUSTOMERS:
        return {"error": f"customer {customer_id} not found"}
    return {"deleted": True, "id": customer_id}


def process_refund(args: dict[str, Any]) -> dict[str, Any]:
    order_id = args.get("order_id", "")
    order = ORDERS.get(order_id)
    if not order:
        return {"error": f"order {order_id} not found"}
    return {"refunded": True, "order_id": order_id, "amount": args.get("amount", order["amount"])}


def access_pii(args: dict[str, Any]) -> dict[str, Any]:
    customer = CUSTOMERS.get(args.get("id", ""))
    if not customer:
        return {"error": f"customer {args.get('id')} not found"}
    return {**customer, "ssn_last4": "4821", "email": f"{customer['name'].split()[0].lower()}@example.com"}


def export_data(args: dict[str, Any]) -> dict[str, Any]:
    return {"exported": True, "rows": len(CUSTOMERS), "format": args.get("format", "csv")}


def bulk_update(args: dict[str, Any]) -> dict[str, Any]:
    return {"updated_count": len(CUSTOMERS), "operation": args.get("operation", "mark_inactive")}


TOOL_IMPLEMENTATIONS = {
    "view_customer": view_customer,
    "update_customer": update_customer,
    "delete_customer": delete_customer,
    "process_refund": process_refund,
    "access_pii": access_pii,
    "export_data": export_data,
    "bulk_update": bulk_update,
}


def execute_tool(tool: str, args: dict[str, Any]) -> dict[str, Any]:
    impl = TOOL_IMPLEMENTATIONS.get(tool)
    if impl is None:
        return {"error": f"unknown tool: {tool}"}
    return impl(args)