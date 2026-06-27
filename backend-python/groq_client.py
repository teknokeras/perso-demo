"""
Groq client + two-step function-calling flow + agent attributes builder.

Mirrors backend/src/lib/groq.ts in the Node backend. The flow is:

  1. Send the user message + conversation history + tool definitions
     to Groq.
  2. If Groq's response includes tool calls, run each one through
     perso.evaluate() BEFORE execution. Allow -> execute the mock tool
     and capture the real result. Deny -> don't execute; feed the
     denial reason back as the tool's result instead.
  3. Send the tool results back to Groq for a final natural-language
     reply.

This is the actual enforcement point: perso sits between "the LLM
decided to call a tool" and "the tool actually runs," for every single
call, regardless of how convincing the LLM's reasoning was.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from groq import Groq

from groq_tools import GROQ_TOOLS
from mock_tools import execute_tool, resolve_resource_attributes
from models import ChatRequest, PersoTrace
from perso_instance import get_perso

SYSTEM_PROMPT = """You are a support assistant for a B2B CRM. You can look up customers, \
update records, process refunds, and perform admin operations using the available tools. \
Call tools when the user's request requires it. Be concise in your replies."""

MOCK_USER_IDS: dict[str, str] = {
    "agent": "agt-099",
    "manager": "mgr-001",
    "admin": "adm-001",
}

_client: Groq | None = None


def get_groq_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = Groq(api_key=api_key)
    return _client


def build_agent_attributes(role: str, messages: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Builds the AgentAttributes bag perso evaluates against — session
    data the host knows about the caller, never supplied by the LLM.
    Mirrors the agentAttributes builder in groq.ts.
    """
    recent_text = " ".join(
        m.get("content", "") for m in messages[-4:]
        if isinstance(m.get("content"), str)
    )
    attrs: dict[str, Any] = {
        "user_id": MOCK_USER_IDS.get(role, "unknown"),
        "env": "production",
    }
    mfa_mentioned = bool(
        re.search(r"mfa.*(verif|done|complet|passed)", recent_text, re.IGNORECASE)
        or re.search(r"verif.*mfa", recent_text, re.IGNORECASE)
        or re.search(r"i have mfa", recent_text, re.IGNORECASE)
    )
    if mfa_mentioned:
        attrs["mfa_verified"] = True
    return attrs


def run_chat_turn(request: ChatRequest) -> tuple[str, PersoTrace | None]:
    client = get_groq_client()
    perso = get_perso()
    model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")

    groq_messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    groq_messages.extend(m.model_dump() for m in request.messages)

    agent_attributes = build_agent_attributes(request.role, groq_messages)

    # -- Step 1: ask Groq what it wants to do ---------------------------
    first_response = client.chat.completions.create(
        model=model,
        messages=groq_messages,
        tools=GROQ_TOOLS,
        tool_choice="auto",
    )
    assistant_message = first_response.choices[0].message
    tool_calls = assistant_message.tool_calls or []

    if not tool_calls:
        return assistant_message.content or "", None

    groq_messages.append({
        "role": "assistant",
        "content": assistant_message.content,
        "tool_calls": [tc.model_dump() for tc in tool_calls],
    })

    # -- Step 2: gate every tool call through perso before executing ----
    tool_messages: list[dict[str, Any]] = []
    trace: PersoTrace | None = None

    for call in tool_calls:
        tool_name = call.function.name
        try:
            args = json.loads(call.function.arguments or "{}")
        except json.JSONDecodeError:
            args = {}

        resource_attributes = resolve_resource_attributes(tool_name, args)

        decision = perso.evaluate(
            tool=tool_name,
            args=args,
            role=request.role,
            agent_attributes=agent_attributes,
            resource_attributes=resource_attributes,
        )

        if decision.decision == "Allow":
            result = execute_tool(tool_name, args)
        else:
            result = {"denied": True, "reason": decision.reason}

        result_str = json.dumps(result)

        if trace is None:
            trace = PersoTrace(
                toolName=tool_name,
                args=args,
                role=request.role,
                decision=decision.decision,
                reason=decision.reason,
                result=result_str,
            )

        tool_messages.append({
            "role": "tool",
            "tool_call_id": call.id,
            "content": result_str,
        })

    # -- Step 3: ask Groq for the final natural-language reply ----------
    final_response = client.chat.completions.create(
        model=model,
        messages=[*groq_messages, *tool_messages],
    )
    reply = final_response.choices[0].message.content or ""

    return reply, trace
