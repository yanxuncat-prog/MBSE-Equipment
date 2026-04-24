from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ProgramCreate(BaseModel):
    name: str
    aircraft_type: str
    description: str | None = None


class ProgramResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    aircraft_type: str
    description: str | None = None
