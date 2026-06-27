"""
perso-sdk singleton, shared across routes — mirrors
backend/src/lib/persoInstance.ts in the Node backend.

Loaded once at startup via the lifespan handler in app/main.py.
"""

from __future__ import annotations

from pathlib import Path

from perso_sdk import AuditConfig, Perso, console_transport

# backend/wasm/ is shared between the Node and Python backends
WASM_PATH = Path(__file__).resolve().parent.parent.parent.parent / "backend" / "wasm" / "perso.wasm"
POLICY_PATH = Path(__file__).resolve().parent.parent.parent.parent / "backend" / "wasm" / "policy.json"

_perso_instance: Perso | None = None


def init_perso() -> Perso:
    """Load the perso WASM engine once. Call from the app startup hook."""
    global _perso_instance
    if _perso_instance is None:
        _perso_instance = Perso.load(
            WASM_PATH,
            POLICY_PATH,
            audit=AuditConfig(transport=console_transport()),
        )
    return _perso_instance


def get_perso() -> Perso | None:
    return _perso_instance


def is_perso_ready() -> bool:
    return _perso_instance is not None
