from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.equipment import router as equipment_router
from app.api.programs import router as programs_router
from app.api.configurations import router as configurations_router
from app.api.constraints import router as constraints_router
from app.api.imports import router as imports_router
from app.api.documents import router as documents_router
from app.api.zones import router as zones_router
from app.api.buses import router as buses_router
from app.api.dashboard import router as dashboard_router
from app.ws.constraint_ws import router as ws_router

app = FastAPI(title="AeroEquip", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(equipment_router, prefix="/api")
app.include_router(programs_router, prefix="/api")
app.include_router(configurations_router, prefix="/api")
app.include_router(constraints_router, prefix="/api")
app.include_router(imports_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(zones_router, prefix="/api")
app.include_router(buses_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
