# Phase 4: Advanced Features (P3-P4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI report generation, image attachments for MICD, MICD workload statistics page, report reverse parsing (Word/PDF→data), configuration platform interface stubs, and EICD integration documentation.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite, OpenAI API (or Anthropic), python-docx, PyMuPDF/pdfplumber, React 18, TypeScript, ShadCN/UI

---

### Task 1: Image attachment upload for MICD

**Backend:**
- Create: `backend/app/api/attachments.py` — file upload endpoint
  - `POST /api/attachments/upload` — accepts multipart file, saves to `backend/data/attachments/` directory, returns `{url: "/api/attachments/{filename}", filename, size}`
  - `GET /api/attachments/{filename}` — serve file (StaticFiles or FileResponse)
  - Limit: images only (jpg/png/gif/bmp), max 10MB
- Modify: `backend/app/main.py` — register router
- Create directory: `backend/data/attachments/`

**Frontend:**
- Modify: MICD edit dialog in `MICDTab.tsx` — add file upload input for tolerance_drawing_url field
  - When file selected, upload via POST /api/attachments/upload
  - On success, set tolerance_drawing_url to returned URL
  - Show thumbnail preview if URL is set
  - "查看" link to open image in new tab

### Task 2: AI report generation

**Backend:**
- Create: `backend/app/api/ai_reports.py` — AI report generation endpoint
  - `POST /api/ai-reports/generate` — body: {config_id, template_text, report_title}
  - Loads equipment data for config, builds context prompt
  - Calls LLM API (configurable: OpenAI or Anthropic) with template + data
  - Returns generated report as {title, content (markdown), generated_at}
  - `GET /api/ai-reports?config_id=...` — list previously generated reports
  - `GET /api/ai-reports/{id}` — get specific report
- Create: `backend/app/models/ai_report.py` — AIReport model (id, config_id, title, template, content, generated_at)
- Config: `AI_API_KEY` and `AI_MODEL` in backend/app/config.py (env vars, optional — if not set, return error)

**Frontend:**
- Create: `frontend/src/pages/AIReportPage.tsx` — AI report generation page
  - Template textarea (user enters template with keywords like {{设备总数}}, {{总重量}})
  - "生成报告" button
  - Generated report display (markdown rendered)
  - History list of previously generated reports
  - Download as Word button
- Create: `frontend/src/api/ai-reports.ts` — API client
- Add route + sidebar menu item

### Task 3: MICD workload statistics page

**Frontend:**
- Create: `frontend/src/pages/MICDStatsPage.tsx` — MICD workload statistics
  - Date range picker (start_date, end_date)
  - KPI cards: total MICD records, confirmed in period, unconfirmed, confirmation rate
  - Confirmation trend chart: confirmed count by month (bar chart)
  - Confirmer breakdown: who confirmed how many (horizontal bar chart)
  - Table: per-equipment MICD confirmation status overview
- Create: `frontend/src/api/micd-stats.ts` or reuse existing getMICDStats
- Add route + sidebar menu item (under a "报告统计" group or standalone)

### Task 4: Report reverse parsing (Word/PDF → data backfill)

**Backend:**
- Create: `backend/app/api/report_parsing.py` — report upload and parsing endpoint
  - `POST /api/report-parsing/upload` — accepts Word (.docx) or PDF file
  - Uses python-docx for Word files, pdfplumber for PDF
  - Extracts text, uses regex or LLM to identify equipment fields (name, part_number, weight, etc.)
  - Returns: {parsed_fields: [{field_name, field_value, confidence}], raw_text_preview}
  - `POST /api/report-parsing/apply` — body: {config_id, equipment_id, fields: [{field_name, value}]}
  - Applies parsed values to equipment record
- Install: `pip install pdfplumber`

**Frontend:**
- Create: `frontend/src/pages/ReportParsingPage.tsx`
  - File upload area (drag-drop or click)
  - Parsed results preview table: field name, parsed value, confidence indicator
  - Equipment selector to target the backfill
  - "应用" button to write parsed data to equipment
  - Status indicators for success/failure
- Add route + sidebar menu item

### Task 5: Configuration platform interface stubs

**Backend:**
- Create: `backend/app/api/config_platform.py` — stub endpoints for future CAD integration
  - `GET /api/config-platform/status` — returns {connected: false, message: "待内网部署后对接配置平台"}
  - `POST /api/config-platform/fetch-models` — body: {equipment_ids: [...]}
  - Returns: {status: "not_available", message: "外网环境无法连接配置平台，请在内网环境使用此功能"}

**Frontend:**
- Create: `frontend/src/pages/ConfigPlatformPage.tsx` — placeholder page
  - "配置平台对接" title
  - Status card showing connection status (currently disconnected)
  - Equipment multi-select with "获取数模" button (shows "内网后可用" toast)
  - Info card explaining: "此功能需要在内网环境下连接CATIA配置平台"
- Add route + sidebar menu item

### Task 6: EICD integration documentation + stub

**Backend:**
- Create: `backend/app/api/eicd.py` — minimal stub
  - `GET /api/eicd/status` — returns {status: "independent", message: "EICD平台独立运行，暂未建立数据同步"}

**Frontend:**
- The EWIS tab already shows "EICD 暂时单独维护" placeholder
- Update to show more detail: "EICD平台独立管理连接器和针孔关系。当前与设备管理平台断开联动，后续考虑数据同步机制。"

### Task 7: Register all new routers + models + migration

**Backend:**
- Update `backend/app/models/__init__.py` — add AIReport
- Update `backend/app/main.py` — register all new routers
- Create `backend/scripts/migrate_p3p4_entities.py` — migration for ai_reports table, ensure attachments directory exists

**Frontend:**
- Update `frontend/src/App.tsx` — add all new routes
- Update `frontend/src/components/layout/AppLayout.tsx` — add sidebar items
