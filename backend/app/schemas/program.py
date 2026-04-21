from pydantic import BaseModel


class ProgramCreate(BaseModel):
    name: str
    aircraft_type: str
    description: str | None = None


class ProgramResponse(BaseModel):
    id: str
    name: str
    aircraft_type: str
    description: str | None = None

    class Config:
        from_attributes = True


class SeriesCreate(BaseModel):
    program_id: str
    variant_name: str
    description: str | None = None


class SeriesResponse(BaseModel):
    id: str
    program_id: str
    variant_name: str
    description: str | None = None

    class Config:
        from_attributes = True
