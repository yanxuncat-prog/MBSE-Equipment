from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.document import DocumentRequest
from app.services import document_svc

router = APIRouter(prefix="/documents", tags=["documents"])

GENERATORS = {
    ("equipment_list", "pdf"): document_svc.generate_equipment_list_pdf,
    ("equipment_list", "xlsx"): document_svc.generate_equipment_list_xlsx,
    ("equipment_list", "docx"): document_svc.generate_equipment_list_docx,
    ("weight_report", "pdf"): document_svc.generate_weight_report_pdf,
    ("eload_report", "pdf"): document_svc.generate_eload_report_pdf,
    ("installation_report", "docx"): document_svc.generate_installation_report_docx,
}

CONTENT_TYPES = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

EXTENSIONS = {"pdf": ".pdf", "xlsx": ".xlsx", "docx": ".docx"}


@router.post("/generate")
async def generate_document(
    body: DocumentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    key = (body.doc_type, body.format)
    generator = GENERATORS.get(key)
    if not generator:
        raise HTTPException(status_code=400, detail=f"Unsupported: {body.doc_type} in {body.format} format")

    if body.doc_type == "eload_report":
        content = await generator(db, body.config_id, phase=body.phase)
    else:
        content = await generator(db, body.config_id)

    filename = f"{body.doc_type}{EXTENSIONS[body.format]}"
    return Response(
        content=content,
        media_type=CONTENT_TYPES[body.format],
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
