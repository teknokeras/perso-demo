"""Shared domain types — mirrors backend/src/lib/types.ts in the Node backend."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

Role = Literal["agent", "manager", "admin"]


# ── /evaluate ─────────────────────────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    toolName: str
    args: dict[str, Any] = {}
    role: Role
    agentAttributes: dict[str, Any] = {}
    resourceAttributes: dict[str, Any] = {}


class EvaluateResponseBody(BaseModel):
    decision: Literal["Allow", "Deny"]
    reason: str
    toolName: str
    role: Role
    result: str | None = None


# ── /chat ─────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    role: Role


class PersoTrace(BaseModel):
    toolName: str
    args: dict[str, Any]
    role: Role
    decision: Literal["Allow", "Deny"]
    reason: str
    result: str | None = None


class ChatResponse(BaseModel):
    reply: str
    trace: PersoTrace | None = None


# ── /health ───────────────────────────────────────────────────────────────────

class HealthFeatures(BaseModel):
    wasm: bool
    llm: bool


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str = "perso-demo-backend-python"
    version: str = "0.1.0"
    timestamp: str
    features: HealthFeatures
