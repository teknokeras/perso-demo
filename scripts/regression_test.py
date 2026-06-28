#!/usr/bin/env python3
"""
Cross-backend regression test for perso-demo.

Sends 10 scenarios (5 Allow + 5 Deny) directly to /evaluate on either the
Node or Python backend and asserts the expected decision. The LLM is not
involved — this tests the authorization layer in isolation.

Why this exists:
  A real bug previously went undetected because there was no automated test
  for these denial scenarios. This script is the concrete fix for that gap.

Usage:
    # Start the backend you want to test (see README for commands), then:

    python3 scripts/regression_test.py --backend node
    python3 scripts/regression_test.py --backend python

Both backends share port :3001, so run them one at a time.

Options:
    --backend   node|python   which backend label to show in the summary
    --url       base URL      override if you're not using localhost:3001
                              (default: http://localhost:3001)
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import urllib.error
from typing import Any


# ── Scenario definitions ──────────────────────────────────────────────────────
# Each entry maps to one POST /evaluate call.
# resource_attributes is omitted for delete_customer — both backends auto-resolve
# it from the customer_id in args using their mock data store.

SCENARIOS: list[dict[str, Any]] = [
    # ── ALLOW cases ───────────────────────────────────────────────────────────

    {
        "name": "Agent view customer C-1042",
        "body": {
            "toolName": "view_customer",
            "args": {"customer_id": "C-1042"},
            "role": "agent",
            "agentAttributes": {"user_id": "agt-099"},
        },
        "expected": "Allow",
    },
    {
        "name": "Agent process_refund $200 (within $500 cap)",
        "body": {
            "toolName": "process_refund",
            "args": {"order_id": "ORD-8821", "amount": 200},
            "role": "agent",
            "agentAttributes": {"user_id": "agt-099", "env": "production"},
        },
        "expected": "Allow",
    },
    {
        "name": "Manager delete C-2038 (owns it, user_id==owner_id)",
        "body": {
            "toolName": "delete_customer",
            "args": {"customer_id": "C-2038"},
            "role": "manager",
            "agentAttributes": {"user_id": "mgr-001"},
            # resourceAttributes auto-resolved: C-2038.owner_id == "mgr-001" → Allow
        },
        "expected": "Allow",
    },
    {
        "name": "Manager access_pii WITH mfa_verified present",
        "body": {
            "toolName": "access_pii",
            "args": {"customer_id": "C-1042"},
            "role": "manager",
            "agentAttributes": {"user_id": "mgr-001", "mfa_verified": True},
        },
        "expected": "Allow",
    },
    {
        "name": "Admin bulk_update WITH mfa_verified + env=production",
        "body": {
            "toolName": "bulk_update",
            "args": {"filter": "status:inactive", "field": "status", "value": "archived"},
            "role": "admin",
            "agentAttributes": {
                "user_id": "adm-001",
                "env": "production",
                "mfa_verified": True,
            },
        },
        "expected": "Allow",
    },

    # ── DENY cases ────────────────────────────────────────────────────────────

    {
        "name": "Agent process_refund $800 → NumericCheck deny (>$500 cap)",
        "body": {
            "toolName": "process_refund",
            "args": {"order_id": "ORD-8821", "amount": 800},
            "role": "agent",
            "agentAttributes": {"user_id": "agt-099", "env": "production"},
        },
        "expected": "Deny",
    },
    {
        "name": "Manager delete C-9001 → FieldEquals deny (wrong owner)",
        "body": {
            "toolName": "delete_customer",
            "args": {"customer_id": "C-9001"},
            "role": "manager",
            "agentAttributes": {"user_id": "mgr-001"},
            # resourceAttributes auto-resolved: C-9001.owner_id == "mgr-002" ≠ "mgr-001" → Deny
        },
        "expected": "Deny",
    },
    {
        "name": "Manager access_pii WITHOUT mfa_verified → FieldPresent deny",
        "body": {
            "toolName": "access_pii",
            "args": {"customer_id": "C-1042"},
            "role": "manager",
            "agentAttributes": {"user_id": "mgr-001"},
        },
        "expected": "Deny",
    },
    {
        "name": "Manager export_data env=staging → StringCheck deny",
        "body": {
            "toolName": "export_data",
            "args": {"report_type": "Q2 sales"},
            "role": "manager",
            "agentAttributes": {"user_id": "mgr-001", "env": "staging"},
        },
        "expected": "Deny",
    },
    {
        "name": "Admin bulk_update WITHOUT mfa_verified → All-condition deny",
        "body": {
            "toolName": "bulk_update",
            "args": {"filter": "status:inactive", "field": "status", "value": "archived"},
            "role": "admin",
            "agentAttributes": {"user_id": "adm-001", "env": "production"},
        },
        "expected": "Deny",
    },
]


# ── HTTP helper ───────────────────────────────────────────────────────────────

def post_evaluate(base_url: str, body: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/evaluate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


# ── Runner ────────────────────────────────────────────────────────────────────

def run(base_url: str, backend_label: str) -> int:
    """Returns the number of failures (0 = all passed)."""
    print(f"\nRegression test — backend: {backend_label}  ({base_url})")
    print("=" * 72)

    # Verify the backend is reachable before running scenarios
    try:
        health_req = urllib.request.Request(f"{base_url}/health", method="GET")
        with urllib.request.urlopen(health_req, timeout=5):
            pass
    except (urllib.error.URLError, ConnectionRefusedError) as exc:
        print(f"ERROR: Cannot reach {base_url}/health — is the backend running?")
        print(f"       {exc}")
        print()
        print("Start the Node backend:")
        print("  cd backend && npx tsx src/index.ts")
        print()
        print("Or start the Python backend:")
        print("  cd backend-python && uvicorn app.main:app --port 3001")
        return 1

    col_w = max(len(s["name"]) for s in SCENARIOS)
    header = f"  {'Scenario':<{col_w}}  {'Expected':<8}  {'Actual':<8}  Result"
    print(header)
    print(f"  {'-'*col_w}  {'-'*8}  {'-'*8}  {'-'*6}")

    failures = 0
    for scenario in SCENARIOS:
        name = scenario["name"]
        expected = scenario["expected"]
        try:
            resp = post_evaluate(base_url, scenario["body"])
            actual = resp.get("decision", "ERROR")
        except Exception as exc:
            actual = "ERROR"
            reason = str(exc)
        else:
            reason = resp.get("reason", "")

        passed = actual == expected
        if not passed:
            failures += 1

        status = "PASS" if passed else "FAIL"
        mark = "" if passed else " ← DISCREPANCY"
        print(f"  {name:<{col_w}}  {expected:<8}  {actual:<8}  {status}{mark}")
        if not passed:
            print(f"    reason: {reason}")

    print()
    if failures == 0:
        print(f"All {len(SCENARIOS)} scenarios passed.")
    else:
        print(f"{failures}/{len(SCENARIOS)} scenario(s) FAILED — see above.")

    return failures


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Cross-backend regression test for perso-demo /evaluate endpoint.",
    )
    parser.add_argument(
        "--backend",
        choices=["node", "python"],
        default="node",
        help="Which backend to label in the output (both use :3001). Default: node",
    )
    parser.add_argument(
        "--url",
        default="http://localhost:3001",
        help="Base URL of the backend (default: http://localhost:3001)",
    )
    args = parser.parse_args()

    failures = run(args.url, args.backend)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
