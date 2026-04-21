from pydantic import BaseModel


class DocumentRequest(BaseModel):
    config_id: str
    doc_type: str  # "equipment_list" | "weight_report" | "eload_report"
    format: str = "pdf"  # "pdf" | "xlsx"
    phase: str = "normal"  # for eload_report
