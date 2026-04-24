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
from app.api.procurement import router as procurement_router
from app.api.electrical_details import router as electrical_details_router
from app.api.data_governance import router as data_governance_router
from app.api.excel_export import router as excel_export_router
from app.api.excel_import import router as excel_import_router
from app.api.audit_logs import router as audit_logs_router
from app.api.equipment_library import router as equipment_library_router
from app.api.micd import router as micd_router
from app.api.do160 import router as do160_router
from app.api.weight_reduction import router as weight_reduction_router
from app.api.users import router as users_router
from app.api.notifications import router as notifications_router
from app.api.equipment_constraints import router as equipment_constraints_router
from app.api.attachments import router as attachments_router
from app.api.config_platform import router as config_platform_router
from app.api.eicd import router as eicd_router
from app.api.ai_reports import router as ai_reports_router
from app.api.report_parsing import router as report_parsing_router
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
app.include_router(procurement_router, prefix="/api")
app.include_router(electrical_details_router, prefix="/api")
app.include_router(data_governance_router, prefix="/api")
app.include_router(excel_export_router, prefix="/api")
app.include_router(excel_import_router, prefix="/api")
app.include_router(audit_logs_router, prefix="/api")
app.include_router(equipment_library_router, prefix="/api")
app.include_router(micd_router, prefix="/api")
app.include_router(do160_router, prefix="/api")
app.include_router(weight_reduction_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(equipment_constraints_router, prefix="/api")
app.include_router(attachments_router, prefix="/api")
app.include_router(config_platform_router, prefix="/api")
app.include_router(eicd_router, prefix="/api")
app.include_router(ai_reports_router, prefix="/api")
app.include_router(report_parsing_router, prefix="/api")
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
