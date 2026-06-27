"""FastAPI entry point — mirrors backend/src/index.ts in the Node backend."""

from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .lib.groq_client import run_chat_turn
from .lib.mock_tools import execute_tool, resolve_resource_attributes
from .lib.models import (
    ChatRequest,
    ChatResponse,
    EvaluateRequest,
    EvaluateResponseBody,
    HealthFeatures,
    HealthResponse,
)
from .lib.perso_instance import get_perso, init_perso, is_perso_ready


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_perso()
        print("[perso] WASM loaded and policy initialised")
    except Exception as err:
        print(f"[perso] WASM not loaded: {err}")
        print("[perso] Drop perso.wasm into backend/wasm/ and restart")

    if not os.environ.get("GROQ_API_KEY"):
        print("[groq] GROQ_API_KEY not set — set it in .env and restart")

    yield


app = FastAPI(lifespan=lifespan)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        features=HealthFeatures(
            wasm=is_perso_ready(),
            llm=bool(os.environ.get("GROQ_API_KEY")),
        ),
    )


# ── Evaluate ──────────────────────────────────────────────────────────────────

@app.post("/evaluate", response_model=EvaluateResponseBody)
def evaluate(body: EvaluateRequest) -> EvaluateResponseBody:
    if not is_perso_ready():
        raise HTTPException(
            status_code=503,
            detail="Policy engine not loaded — drop perso.wasm into backend/wasm/ and restart",
        )

    resource_attrs = body.resourceAttributes or resolve_resource_attributes(body.toolName, body.args)
    perso = get_perso()
    decision = perso.evaluate(
        tool=body.toolName,
        args=body.args,
        role=body.role,
        agent_attributes=body.agentAttributes,
        resource_attributes=resource_attrs,
    )
    result = execute_tool(body.toolName, body.args) if decision.decision == "Allow" else None
    return EvaluateResponseBody(
        decision=decision.decision,
        reason=decision.reason,
        toolName=body.toolName,
        role=body.role,
        result=json.dumps(result) if result is not None else None,
    )


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest) -> ChatResponse:
    if not bool(os.environ.get("GROQ_API_KEY")):
        raise HTTPException(
            status_code=503,
            detail="Groq not initialised — set GROQ_API_KEY and restart",
        )
    if not is_perso_ready():
        raise HTTPException(
            status_code=503,
            detail="Policy engine not loaded — drop perso.wasm into backend/wasm/ and restart",
        )
    reply, trace = run_chat_turn(body)
    return ChatResponse(reply=reply, trace=trace)


# ── 404 ───────────────────────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found(request, _exc):
    return JSONResponse(
        status_code=404,
        content={"error": f"Route {request.method} {request.url.path} not found"},
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
