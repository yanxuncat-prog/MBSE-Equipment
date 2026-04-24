# Phase 3: Access Control & Collaboration (P2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add role-based user management (6 roles), in-app notification center, Word report export, and equipment layout constraint relationships.

**Architecture:** Extend existing User model with defined roles. Add Notification and EquipmentConstraint models. Word export uses python-docx. Notifications triggered on data changes via AuditLog post-commit hook pattern. Equipment constraints are M:N self-referencing through ConfigEquipment.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite, python-docx, React 18, TypeScript, ShadCN/UI

---

### Task 1: Enhanced user model + management API + migration

**Files:**
- Modify: `backend/app/models/user.py` — add role enum, specialty, ata_chapters fields
- Create: `backend/app/api/users.py` — user management CRUD (list, create, update roles)
- Create: `backend/scripts/migrate_p2_entities.py` — migration for new tables + user fields
- Modify: `backend/app/main.py` — register router

User model additions:
- `role` (String, constrained to: pmo, system_integrator, config_admin, discipline_lead, discipline_engineer, readonly)
- `specialty` (String, nullable: weight, electrical, environment, layout, procurement)
- `ata_chapters` (JSON, nullable: list of ATA chapters user is responsible for)

Defined roles (from requirements 8.7):
- PMO: only manages user permissions, no data editing
- system_integrator (系统集成): full data access
- config_admin (构型管理员): equipment add/delete + master attributes
- discipline_lead (专业负责人): manages own specialty fields, can delegate
- discipline_engineer (专业人员): edits own specialty fields
- readonly (只读用户): view only

API endpoints:
- `GET /api/users` — list all users (admin only)
- `POST /api/users` — create user
- `PATCH /api/users/{id}` — update role, specialty, ata_chapters
- `GET /api/users/me/role` — get current user's role details

### Task 2: Notification model + API

**Files:**
- Create: `backend/app/models/notification.py`
- Create: `backend/app/api/notifications.py`
- Modify: `backend/app/main.py`

Notification model:
- id, user_id (FK), title, message, entity_type, entity_id, is_read (bool), created_at
- Triggered when equipment data changes (from PATCH endpoint audit log)

API endpoints:
- `GET /api/notifications?unread_only=true&limit=50` — list for current user
- `POST /api/notifications/{id}/read` — mark as read
- `POST /api/notifications/read-all` — mark all as read
- `GET /api/notifications/count` — unread count

### Task 3: Equipment constraint model + API

**Files:**
- Create: `backend/app/models/equipment_constraint.py`
- Create: `backend/app/api/equipment_constraints.py`
- Modify: `backend/app/main.py`

EquipmentConstraint model (M:N between equipment):
- id, config_id, equipment_a_id, equipment_b_id
- constraint_type (spatial_dependency, spatial_conflict, power_dependency, thermal_adjacency)
- description, created_by, created_at

API endpoints:
- `GET /api/equipment-constraints?config_id=...&equipment_id=...`
- `POST /api/equipment-constraints`
- `DELETE /api/equipment-constraints/{id}`

### Task 4: Word report export

**Files:**
- Modify: `backend/app/services/document_svc.py` or create `backend/app/services/word_export.py`
- Modify: `backend/app/api/documents.py` — add docx format

Generate Word installation report:
- Title page with config name, date, equipment count
- Equipment summary table (name, part_number, ATA, weight, location)
- Per-equipment detail sections: basic info, weight/CG, MICD summary, DO-160 status
- Use python-docx library

### Task 5: Frontend — user management page + role display

**Files:**
- Create: `frontend/src/pages/UserManagementPage.tsx`
- Create: `frontend/src/api/users.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

Simple user management page (for PMO/admin):
- Table: username, display_name, role (Badge), specialty, ATA chapters
- Edit dialog: change role, specialty, ata_chapters
- Role displayed in sidebar footer

### Task 6: Frontend — notification center

**Files:**
- Create: `frontend/src/components/layout/NotificationCenter.tsx`
- Create: `frontend/src/api/notifications.ts`
- Modify: `frontend/src/components/layout/GlobalNav.tsx`

Notification bell icon in GlobalNav:
- Badge with unread count
- Dropdown panel showing recent notifications
- Click notification → navigate to relevant entity
- "Mark all read" button

### Task 7: Frontend — equipment constraints in layout tab

**Files:**
- Create: `frontend/src/api/equipment-constraints.ts`
- Modify: `frontend/src/components/workstation/tabs/LayoutTab.tsx`

Add constraint visualization to layout tab:
- List of constraints for selected equipment
- "Add constraint" button → dialog to select two equipment + constraint type
- Visual indicators on the scatter plot for constrained equipment pairs

### Task 8: Frontend — Word export button

**Files:**
- Modify: `frontend/src/components/workstation/shared/ProfessionalTable.tsx` or relevant toolbar

Add "导出Word" button alongside existing Excel export. Downloads .docx file from `/api/generate` endpoint with format=docx.
