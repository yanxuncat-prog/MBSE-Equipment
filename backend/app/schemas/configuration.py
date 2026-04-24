from __future__ import annotations
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any


class ConfigCreate(BaseModel):
    program_id: str
    version: str
    description: str | None = None


class ConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    program_id: UUID
    version: str
    status: str
    description: str | None = None
    created_by: UUID | None = None
    frozen_at: datetime | None = None
    created_at: datetime
    equipment_count: int = 0


class DiffItem(BaseModel):
    equipment_id: str
    part_number: str
    name: str
    ata_chapter: str = ""
    change_type: str
    changes: dict[str, Any] | None = None


class ConfigDiffResponse(BaseModel):
    config_a_id: str
    config_a_version: str
    config_b_id: str
    config_b_version: str
    added: list[DiffItem]
    removed: list[DiffItem]
    modified: list[DiffItem]
    unchanged: list[DiffItem]
    impact_summary: dict[str, Any]
