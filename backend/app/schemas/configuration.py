from __future__ import annotations
from pydantic import BaseModel


class ConfigCreate(BaseModel):
    series_id: str
    version: str
    description: str | None = None


class ConfigResponse(BaseModel):
    id: str
    series_id: str
    version: str
    status: str
    description: str | None = None
    created_by: str | None = None
    locked_at: str | None = None
    created_at: str
    equipment_count: int = 0

    class Config:
        from_attributes = True


class DiffItem(BaseModel):
    equipment_id: str
    part_number: str
    name: str
    change_type: str  # "added" | "removed" | "modified"
    changes: dict | None = None  # field-level diff for modified items


class ConfigDiffResponse(BaseModel):
    config_a_id: str
    config_a_version: str
    config_b_id: str
    config_b_version: str
    added: list[DiffItem]
    removed: list[DiffItem]
    modified: list[DiffItem]
    impact_summary: dict  # net weight/CG/bus changes
