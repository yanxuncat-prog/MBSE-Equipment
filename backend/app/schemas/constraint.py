from __future__ import annotations
from pydantic import BaseModel


class ValidationRequest(BaseModel):
    config_id: str
    hypothetical_adds: list[str] | None = None
    hypothetical_removes: list[str] | None = None
    phase: str = "normal"


class EngineResult(BaseModel):
    engine_name: str
    status: str  # "pass" | "warning" | "blocked"
    summary: str
    details: dict


class ValidationReport(BaseModel):
    config_id: str
    overall_status: str
    engines: list[EngineResult]
