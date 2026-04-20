# AeroEquip MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP of AeroEquip — an aircraft equipment management platform with engineer workstation, 2D spatial view, weight/CG and electrical load constraint engines, configuration management, and basic document generation.

**Architecture:** Python FastAPI backend with SQLAlchemy ORM on PostgreSQL. React + TypeScript + Ant Design frontend with SVG-based 2D visualization. WebSocket for real-time constraint push. Docker Compose for all services. The backend exposes a REST API + WebSocket endpoint; the frontend is an SPA served by Nginx.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL 15, Redis, Celery, React 18, TypeScript, Ant Design 5, Vite, SVG, Docker Compose, openpyxl, weasyprint.

**Spec:** `docs/superpowers/specs/2026-04-20-aeroequip-platform-design.md`

---

## File Structure

```
aeroequip/
├── docker-compose.yml                    # All services orchestration
├── .env.example                          # Environment variable template
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml                    # Dependencies (FastAPI, SQLAlchemy, etc.)
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                     # Migration files
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                       # FastAPI app factory + router mounting
│   │   ├── config.py                     # Settings from env vars
│   │   ├── database.py                   # Engine, session factory, Base
│   │   ├── models/
│   │   │   ├── __init__.py               # Re-export all models
│   │   │   ├── program.py                # Program + Series
│   │   │   ├── equipment.py              # Equipment (core entity)
│   │   │   ├── configuration.py          # Configuration + config_equipment M:N
│   │   │   ├── installation.py           # Installation (STA/WL/BL/Zone)
│   │   │   ├── weight_balance.py         # WeightBalance sub-table
│   │   │   ├── electrical_load.py        # ElectricalLoad sub-table
│   │   │   ├── zone.py                   # Zone definition
│   │   │   ├── bus.py                    # BusDefinition
│   │   │   ├── supplier.py               # Supplier
│   │   │   ├── user.py                   # User + Role
│   │   │   ├── change_request.py         # ChangeRequest
│   │   │   └── audit_log.py              # AuditLog
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── equipment.py              # Pydantic schemas for Equipment + sub-tables
│   │   │   ├── configuration.py          # Config CRUD + diff schemas
│   │   │   ├── constraint.py             # ValidationReport, ConstraintResult
│   │   │   ├── program.py                # Program/Series schemas
│   │   │   ├── auth.py                   # Login/Token schemas
│   │   │   └── document.py               # Document generation request/response
│   │   ├── api/
│   │   │   ├── __init__.py               # Main router aggregation
│   │   │   ├── deps.py                   # Dependency injection (db session, current user)
│   │   │   ├── auth.py                   # POST /auth/login, GET /auth/me
│   │   │   ├── programs.py               # CRUD /programs, /series
│   │   │   ├── equipment.py              # CRUD /equipment + sub-table endpoints
│   │   │   ├── configurations.py         # CRUD /configurations + diff + lock
│   │   │   ├── constraints.py            # POST /constraints/validate, WS /constraints/ws
│   │   │   ├── zones.py                  # CRUD /zones
│   │   │   ├── buses.py                  # CRUD /buses
│   │   │   └── documents.py              # POST /documents/generate
│   │   ├── engines/
│   │   │   ├── __init__.py               # Engine registry + parallel runner
│   │   │   ├── base.py                   # Abstract ConstraintEngine interface
│   │   │   ├── weight_balance.py         # W&B calculation: mass sum, moment, CG%MAC
│   │   │   └── electrical_load.py        # Bus load sum, capacity ratio, phase switching
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── equipment_svc.py          # Equipment business logic + audit
│   │   │   ├── configuration_svc.py      # Config versioning, diff, lock, baseline
│   │   │   ├── constraint_svc.py         # Orchestrate engines, build ValidationReport
│   │   │   ├── document_svc.py           # PDF/Excel generation
│   │   │   └── import_svc.py             # Excel import parsing
│   │   └── ws/
│   │       └── constraint_ws.py          # WebSocket manager for real-time constraint push
│   └── tests/
│       ├── conftest.py                   # Test DB fixture, test client, sample data factory
│       ├── factories.py                  # Factory functions for test data
│       ├── test_models/
│       │   └── test_equipment.py         # Model creation and relationship tests
│       ├── test_engines/
│       │   ├── test_weight_balance.py    # W&B engine unit tests
│       │   └── test_electrical_load.py   # E-Load engine unit tests
│       ├── test_api/
│       │   ├── test_auth.py
│       │   ├── test_equipment_api.py
│       │   ├── test_configuration_api.py
│       │   └── test_constraints_api.py
│       └── test_services/
│           ├── test_configuration_svc.py
│           └── test_document_svc.py
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf                        # Nginx config for SPA + API proxy
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                      # React entry point
│   │   ├── App.tsx                       # Router + Layout
│   │   ├── vite-env.d.ts
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios instance + interceptors
│   │   │   ├── equipment.ts              # Equipment API calls
│   │   │   ├── configurations.ts         # Configuration API calls
│   │   │   └── constraints.ts            # Constraint API calls
│   │   ├── types/
│   │   │   └── index.ts                  # All TypeScript interfaces
│   │   ├── hooks/
│   │   │   ├── useConstraintWS.ts        # WebSocket hook for real-time constraints
│   │   │   └── useEquipment.ts           # Equipment data fetching hook
│   │   ├── store/
│   │   │   └── configStore.ts            # Zustand store for active configuration
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx         # Ant Design Layout shell
│   │   │   │   └── GlobalNav.tsx         # Top nav with config selector
│   │   │   ├── equipment/
│   │   │   │   ├── EquipmentTable.tsx    # Ant Table with filters/sort/pagination
│   │   │   │   ├── EquipmentForm.tsx     # Create/Edit form (Ant Form)
│   │   │   │   └── EquipmentDetail.tsx   # Detail drawer with all sub-table data
│   │   │   ├── constraints/
│   │   │   │   ├── ConstraintPanel.tsx   # Right-side panel aggregating all gauges
│   │   │   │   ├── CGIndicator.tsx       # CG position on envelope bar
│   │   │   │   ├── BusLoadBar.tsx        # Single bus load progress bar
│   │   │   │   └── TrendSparkline.tsx    # SVG mini trend line (5 data points)
│   │   │   ├── spatial/
│   │   │   │   ├── SpatialView.tsx       # Container with view-mode tabs
│   │   │   │   ├── AircraftSideView.tsx  # SVG side profile + equipment markers
│   │   │   │   ├── AircraftTopView.tsx   # SVG top-down view
│   │   │   │   ├── SectionView.tsx       # SVG cross-section at selectable STA
│   │   │   │   ├── EquipmentMarker.tsx   # SVG circle/rect for a single equipment
│   │   │   │   └── ZoneOverlay.tsx       # SVG rect overlay with zone colors
│   │   │   └── configuration/
│   │   │       ├── ConfigSelector.tsx    # Dropdown to switch active config
│   │   │       ├── ConfigDiff.tsx        # Side-by-side diff view (red/green/orange)
│   │   │       └── ConfigTimeline.tsx    # Horizontal timeline of versions
│   │   └── pages/
│   │       ├── WorkstationPage.tsx       # Equipment table + constraint panel layout
│   │       ├── SpatialViewPage.tsx       # 2D aircraft views page
│   │       ├── ConfigPage.tsx            # Configuration management page
│   │       └── LoginPage.tsx             # Login form
│   └── __tests__/
│       ├── components/
│       │   └── ConstraintPanel.test.tsx  # Component tests
│       └── engines/
│           └── constraint.test.ts        # Frontend constraint display logic tests
└── data/
    └── sample/
        ├── ce25a_equipment.xlsx          # Sample equipment data for seeding
        └── ce25a_fuselage_side.svg       # Sample aircraft side-view outline
```

---

## Task 1: Project Scaffolding & Docker Infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/pyproject.toml`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aeroequip
      POSTGRES_USER: aeroequip
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aeroequip"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      DATABASE_URL: postgresql+asyncpg://aeroequip:${DB_PASSWORD:-devpassword}@db:5432/aeroequip
      DATABASE_URL_SYNC: postgresql://aeroequip:${DB_PASSWORD:-devpassword}@db:5432/aeroequip
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY:-dev-secret-key-change-in-production}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

volumes:
  pgdata:
```

- [ ] **Step 2: Create .env.example**

```bash
DB_PASSWORD=devpassword
SECRET_KEY=dev-secret-key-change-in-production
```

- [ ] **Step 3: Create backend/Dockerfile**

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml

COPY . .

FROM base AS dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 4: Create backend/pyproject.toml**

```toml
[project]
name = "aeroequip-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "psycopg2-binary>=2.9.10",
    "alembic>=1.14.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "redis>=5.2.0",
    "celery>=5.4.0",
    "openpyxl>=3.1.5",
    "weasyprint>=62.0",
    "jinja2>=3.1.4",
    "numpy>=2.1.0",
    "httpx>=0.28.0",
    "websockets>=14.0",
]

[project.optional-dependencies]
test = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
    "factory-boy>=3.3.0",
    "pytest-cov>=6.0.0",
]
```

- [ ] **Step 5: Create frontend scaffolding**

Create `frontend/package.json`:
```json
{
  "name": "aeroequip-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "antd": "^5.22.0",
    "@ant-design/icons": "^5.5.0",
    "axios": "^1.7.0",
    "zustand": "^5.0.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.1.0"
  }
}
```

Create `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
  },
});
```

Create `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

Create `frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AeroEquip - 设备管理平台</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://backend:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 6: Verify Docker Compose builds**

Run: `docker compose build`
Expected: All services build successfully.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: project scaffolding with Docker Compose, FastAPI backend, React frontend"
```

---

## Task 2: Backend Foundation — Database, Config, Auth

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/auth.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Test: `backend/tests/conftest.py`
- Test: `backend/tests/test_api/test_auth.py`

- [ ] **Step 1: Create backend/app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://aeroequip:devpassword@localhost:5432/aeroequip"
    DATABASE_URL_SYNC: str = "postgresql://aeroequip:devpassword@localhost:5432/aeroequip"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 2: Create backend/app/database.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        yield session
```

- [ ] **Step 3: Create User model in backend/app/models/user.py**

```python
import uuid
from datetime import datetime

from sqlalchemy import String, Enum as SAEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(SAEnum("admin", "engineer", "reviewer", "viewer", name="user_role"), default="engineer")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 4: Create backend/app/models/__init__.py**

```python
from app.models.user import User

__all__ = ["User"]
```

- [ ] **Step 5: Create auth schemas in backend/app/schemas/auth.py**

```python
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    role: str

    class Config:
        from_attributes = True
```

- [ ] **Step 6: Create deps.py with auth dependency**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 7: Create auth API in backend/app/api/auth.py**

```python
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if user is None or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode({"sub": str(user.id), "exp": expire}, settings.SECRET_KEY, algorithm="HS256")
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
```

- [ ] **Step 8: Create main.py with router mounting**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router

app = FastAPI(title="AeroEquip", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 9: Set up Alembic**

Create `backend/alembic.ini` with `sqlalchemy.url` pointing to env var.

Create `backend/alembic/env.py` that imports `Base.metadata` from `app.database` and all models from `app.models`.

Run: `cd backend && alembic revision --autogenerate -m "initial_user_model"`
Run: `alembic upgrade head`

- [ ] **Step 10: Create test fixtures in backend/tests/conftest.py**

```python
import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from passlib.context import CryptContext

from app.database import Base, get_db
from app.main import app
from app.models.user import User

TEST_DB_URL = "postgresql+asyncpg://aeroequip:devpassword@localhost:5432/aeroequip_test"
engine_test = create_async_engine(TEST_DB_URL, echo=False)
async_session_test = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_test() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        username="testeng",
        hashed_password=pwd_context.hash("testpass"),
        display_name="Test Engineer",
        role="engineer",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, test_user: User) -> dict:
    resp = await client.post("/api/auth/login", json={"username": "testeng", "password": "testpass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 11: Write auth tests**

Create `backend/tests/test_api/test_auth.py`:
```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    resp = await client.post("/api/auth/login", json={"username": "testeng", "password": "testpass"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    resp = await client.post("/api/auth/login", json={"username": "testeng", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, auth_headers):
    resp = await client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "testeng"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
```

- [ ] **Step 12: Run tests**

Run: `cd backend && pytest tests/test_api/test_auth.py -v`
Expected: All 4 tests PASS.

- [ ] **Step 13: Commit**

```bash
git add backend/
git commit -m "feat: backend foundation with database, auth, Alembic migrations"
```

---

## Task 3: Core Data Models — Program, Equipment, Configuration

**Files:**
- Create: `backend/app/models/program.py`
- Create: `backend/app/models/equipment.py`
- Create: `backend/app/models/configuration.py`
- Create: `backend/app/models/installation.py`
- Create: `backend/app/models/weight_balance.py`
- Create: `backend/app/models/electrical_load.py`
- Create: `backend/app/models/zone.py`
- Create: `backend/app/models/bus.py`
- Create: `backend/app/models/supplier.py`
- Create: `backend/app/models/audit_log.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_models/test_equipment.py`

- [ ] **Step 1: Create Program + Series models**

```python
# backend/app/models/program.py
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    aircraft_type: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    series: Mapped[list["Series"]] = relationship(back_populates="program", cascade="all, delete-orphan")


class Series(Base):
    __tablename__ = "series"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("programs.id"))
    variant_name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    program: Mapped["Program"] = relationship(back_populates="series")
    configurations: Mapped[list["Configuration"]] = relationship(back_populates="series")
```

- [ ] **Step 2: Create Equipment model**

```python
# backend/app/models/equipment.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

EQUIPMENT_TYPES = ("LRU", "SRU", "structural", "cable")
EQUIPMENT_STATUS = ("in_development", "qualifying", "approved", "discontinued")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    ata_chapter: Mapped[str] = mapped_column(String(20), index=True)
    equipment_type: Mapped[str] = mapped_column(SAEnum(*EQUIPMENT_TYPES, name="equipment_type_enum"))
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("suppliers.id"))
    status: Mapped[str] = mapped_column(SAEnum(*EQUIPMENT_STATUS, name="equipment_status_enum"), default="in_development")
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    supplier: Mapped["Supplier | None"] = relationship(back_populates="equipment_list")
    installation: Mapped["Installation | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
    weight_balance: Mapped["WeightBalance | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
    electrical_load: Mapped["ElectricalLoad | None"] = relationship(back_populates="equipment", uselist=False, cascade="all, delete-orphan")
```

- [ ] **Step 3: Create Configuration + M:N association**

```python
# backend/app/models/configuration.py
import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, Table, Column, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

CONFIG_STATUS = ("draft", "baseline", "frozen", "archived")

config_equipment = Table(
    "config_equipment",
    Base.metadata,
    Column("config_id", UUID(as_uuid=True), ForeignKey("configurations.id"), primary_key=True),
    Column("equipment_id", UUID(as_uuid=True), ForeignKey("equipment.id"), primary_key=True),
)


class Configuration(Base):
    __tablename__ = "configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id"))
    version: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(SAEnum(*CONFIG_STATUS, name="config_status_enum"), default="draft")
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    series: Mapped["Series"] = relationship(back_populates="configurations")
    equipment_list: Mapped[list["Equipment"]] = relationship(secondary=config_equipment)
```

- [ ] **Step 4: Create Installation, WeightBalance, ElectricalLoad sub-tables**

```python
# backend/app/models/installation.py
import uuid

from sqlalchemy import Float, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Installation(Base):
    __tablename__ = "installations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    zone_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("zones.id"))
    sta: Mapped[float | None] = mapped_column(Float, comment="Fuselage Station")
    wl: Mapped[float | None] = mapped_column(Float, comment="Waterline")
    bl: Mapped[float | None] = mapped_column(Float, comment="Buttline")
    rack_position: Mapped[str | None] = mapped_column(String(50))

    equipment: Mapped["Equipment"] = relationship(back_populates="installation")
    zone: Mapped["Zone | None"] = relationship()
```

```python
# backend/app/models/weight_balance.py
import uuid

from sqlalchemy import Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WeightBalance(Base):
    __tablename__ = "weight_balances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    mass_kg: Mapped[float] = mapped_column(Float)
    arm_sta: Mapped[float] = mapped_column(Float, comment="Moment arm along STA axis (mm)")
    arm_bl: Mapped[float] = mapped_column(Float, default=0.0, comment="Moment arm along BL axis (mm)")
    arm_wl: Mapped[float] = mapped_column(Float, default=0.0, comment="Moment arm along WL axis (mm)")

    equipment: Mapped["Equipment"] = relationship(back_populates="weight_balance")
```

```python
# backend/app/models/electrical_load.py
import uuid

from sqlalchemy import Float, String, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

FLIGHT_PHASES = ("ground", "takeoff", "cruise", "landing", "emergency")


class ElectricalLoad(Base):
    __tablename__ = "electrical_loads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipment.id"), unique=True)
    bus_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bus_definitions.id"))
    power_kva_normal: Mapped[float] = mapped_column(Float, comment="Normal mode power draw (kVA)")
    power_kva_emergency: Mapped[float | None] = mapped_column(Float, comment="Emergency mode (kVA)")
    power_kva_max: Mapped[float | None] = mapped_column(Float, comment="Max/transient (kVA)")

    equipment: Mapped["Equipment"] = relationship(back_populates="electrical_load")
    bus: Mapped["BusDefinition"] = relationship()
```

- [ ] **Step 5: Create Zone, BusDefinition, Supplier models**

```python
# backend/app/models/zone.py
import uuid

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id"))
    zone_code: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str] = mapped_column(String(100))
    sta_from: Mapped[float] = mapped_column(Float)
    sta_to: Mapped[float] = mapped_column(Float)
    wl_from: Mapped[float | None] = mapped_column(Float)
    wl_to: Mapped[float | None] = mapped_column(Float)
    bl_from: Mapped[float | None] = mapped_column(Float)
    bl_to: Mapped[float | None] = mapped_column(Float)
    env_category: Mapped[str | None] = mapped_column(String(50))
```

```python
# backend/app/models/bus.py
import uuid

from sqlalchemy import String, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusDefinition(Base):
    __tablename__ = "bus_definitions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("series.id"))
    bus_name: Mapped[str] = mapped_column(String(50))
    bus_type: Mapped[str] = mapped_column(SAEnum("AC", "DC", name="bus_type_enum"))
    rated_capacity_kva: Mapped[float] = mapped_column(Float)
    redundancy_group: Mapped[str | None] = mapped_column(String(50))
```

```python
# backend/app/models/supplier.py
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    country: Mapped[str | None] = mapped_column(String(100))
    contact_email: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    equipment_list: Mapped[list["Equipment"]] = relationship(back_populates="supplier")
```

```python
# backend/app/models/audit_log.py
import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(50), index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    action: Mapped[str] = mapped_column(String(20))
    old_value: Mapped[dict | None] = mapped_column(JSONB)
    new_value: Mapped[dict | None] = mapped_column(JSONB)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str | None] = mapped_column(String(500))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 6: Update models/__init__.py to re-export all**

```python
from app.models.user import User
from app.models.program import Program, Series
from app.models.equipment import Equipment
from app.models.configuration import Configuration, config_equipment
from app.models.installation import Installation
from app.models.weight_balance import WeightBalance
from app.models.electrical_load import ElectricalLoad
from app.models.zone import Zone
from app.models.bus import BusDefinition
from app.models.supplier import Supplier
from app.models.audit_log import AuditLog

__all__ = [
    "User", "Program", "Series", "Equipment", "Configuration", "config_equipment",
    "Installation", "WeightBalance", "ElectricalLoad", "Zone", "BusDefinition",
    "Supplier", "AuditLog",
]
```

- [ ] **Step 7: Generate and run migration**

Run: `cd backend && alembic revision --autogenerate -m "add_all_core_models"`
Run: `alembic upgrade head`
Expected: All tables created in PostgreSQL.

- [ ] **Step 8: Write model relationship test**

Create `backend/tests/test_models/test_equipment.py`:
```python
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Program, Series, Configuration, Equipment, WeightBalance, ElectricalLoad, Installation, Zone, BusDefinition, Supplier


@pytest.mark.asyncio
async def test_equipment_with_all_subtables(db_session: AsyncSession):
    # Create hierarchy: Program → Series → Config
    program = Program(name="CE-25A", aircraft_type="Widebody")
    db_session.add(program)
    await db_session.flush()

    series = Series(program_id=program.id, variant_name="基本型")
    db_session.add(series)
    await db_session.flush()

    zone = Zone(series_id=series.id, zone_code="131", name="前电子舱", sta_from=178, sta_to=360)
    bus = BusDefinition(series_id=series.id, bus_name="AC BUS 1", bus_type="AC", rated_capacity_kva=20.0)
    db_session.add_all([zone, bus])
    await db_session.flush()

    supplier = Supplier(name="Collins Aerospace")
    db_session.add(supplier)
    await db_session.flush()

    equip = Equipment(part_number="FMC-800A", name="飞行管理计算机", ata_chapter="34-21", equipment_type="LRU", supplier_id=supplier.id)
    db_session.add(equip)
    await db_session.flush()

    # Add sub-table data
    inst = Installation(equipment_id=equip.id, zone_id=zone.id, sta=280.0, wl=180.0, bl=0.0)
    wb = WeightBalance(equipment_id=equip.id, mass_kg=15.2, arm_sta=280.0)
    eload = ElectricalLoad(equipment_id=equip.id, bus_id=bus.id, power_kva_normal=0.8)
    db_session.add_all([inst, wb, eload])
    await db_session.flush()

    # Create config and associate equipment
    config = Configuration(series_id=series.id, version="V1.0")
    db_session.add(config)
    await db_session.flush()
    config.equipment_list.append(equip)
    await db_session.commit()

    # Verify relationships
    await db_session.refresh(equip, ["installation", "weight_balance", "electrical_load", "supplier"])
    assert equip.installation.sta == 280.0
    assert equip.weight_balance.mass_kg == 15.2
    assert equip.electrical_load.power_kva_normal == 0.8
    assert equip.supplier.name == "Collins Aerospace"

    await db_session.refresh(config, ["equipment_list"])
    assert len(config.equipment_list) == 1
    assert config.equipment_list[0].part_number == "FMC-800A"
```

- [ ] **Step 9: Run tests**

Run: `cd backend && pytest tests/test_models/ -v`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add backend/
git commit -m "feat: core data models — Program, Equipment, Configuration, sub-tables, Zone, Bus, Supplier, AuditLog"
```

---

## Task 4: Constraint Engines — Weight/CG + Electrical Load

**Files:**
- Create: `backend/app/engines/base.py`
- Create: `backend/app/engines/__init__.py`
- Create: `backend/app/engines/weight_balance.py`
- Create: `backend/app/engines/electrical_load.py`
- Test: `backend/tests/test_engines/test_weight_balance.py`
- Test: `backend/tests/test_engines/test_electrical_load.py`

- [ ] **Step 1: Create abstract engine interface**

```python
# backend/app/engines/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any


class ConstraintStatus(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    BLOCKED = "blocked"


@dataclass
class ConstraintResult:
    engine_name: str
    status: ConstraintStatus
    summary: str
    details: dict[str, Any]


class ConstraintEngine(ABC):
    @abstractmethod
    def evaluate(self, equipment_data: list[dict]) -> ConstraintResult:
        """Evaluate constraint for a list of equipment with their sub-table data.

        Each item in equipment_data is a dict with keys:
          - id, part_number, name, ata_chapter
          - weight_balance: {mass_kg, arm_sta, arm_bl, arm_wl} | None
          - electrical_load: {bus_id, bus_name, power_kva_normal, power_kva_emergency, power_kva_max} | None
          - installation: {zone_id, sta, wl, bl} | None
        """
        ...
```

- [ ] **Step 2: Write failing W&B engine test**

Create `backend/tests/test_engines/test_weight_balance.py`:
```python
from app.engines.base import ConstraintStatus
from app.engines.weight_balance import WeightBalanceEngine


def _make_equip(mass_kg: float, arm_sta: float) -> dict:
    return {
        "id": "test",
        "part_number": "TEST",
        "weight_balance": {"mass_kg": mass_kg, "arm_sta": arm_sta, "arm_bl": 0, "arm_wl": 0},
    }


def test_cg_within_envelope():
    engine = WeightBalanceEngine(
        mac_leading_edge_sta=500.0,
        mac_length=200.0,
        cg_forward_limit_pct=20.0,
        cg_aft_limit_pct=40.0,
        mtow_kg=100_000.0,
    )
    # Equipment at STA 580 → CG = (580-500)/200 = 40% — right at aft limit
    result = engine.evaluate([_make_equip(1000, 580)])
    assert result.status in (ConstraintStatus.PASS, ConstraintStatus.WARNING)
    assert result.details["cg_pct_mac"] == pytest.approx(40.0, abs=0.1)


def test_cg_out_of_envelope_aft():
    engine = WeightBalanceEngine(
        mac_leading_edge_sta=500.0,
        mac_length=200.0,
        cg_forward_limit_pct=20.0,
        cg_aft_limit_pct=40.0,
        mtow_kg=100_000.0,
    )
    result = engine.evaluate([_make_equip(1000, 700)])  # CG = 100% MAC — way aft
    assert result.status == ConstraintStatus.BLOCKED


def test_mtow_exceeded():
    engine = WeightBalanceEngine(
        mac_leading_edge_sta=500.0,
        mac_length=200.0,
        cg_forward_limit_pct=20.0,
        cg_aft_limit_pct=40.0,
        mtow_kg=50.0,  # Very low limit
    )
    result = engine.evaluate([_make_equip(100, 550)])  # 100kg > 50kg MTOW
    assert result.status == ConstraintStatus.BLOCKED
    assert result.details["total_mass_kg"] == 100.0


def test_warning_near_limit():
    engine = WeightBalanceEngine(
        mac_leading_edge_sta=500.0,
        mac_length=200.0,
        cg_forward_limit_pct=20.0,
        cg_aft_limit_pct=40.0,
        mtow_kg=100.0,
    )
    # 88kg out of 100kg MTOW = 88% — above 85% warning threshold
    result = engine.evaluate([_make_equip(88, 560)])
    assert result.status == ConstraintStatus.WARNING


def test_empty_equipment_list():
    engine = WeightBalanceEngine(
        mac_leading_edge_sta=500.0,
        mac_length=200.0,
        cg_forward_limit_pct=20.0,
        cg_aft_limit_pct=40.0,
        mtow_kg=100_000.0,
    )
    result = engine.evaluate([])
    assert result.status == ConstraintStatus.PASS
    assert result.details["total_mass_kg"] == 0.0
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && pytest tests/test_engines/test_weight_balance.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.engines.weight_balance'`

- [ ] **Step 4: Implement W&B engine**

```python
# backend/app/engines/weight_balance.py
from app.engines.base import ConstraintEngine, ConstraintResult, ConstraintStatus

WARNING_THRESHOLD = 0.85  # 85% of limit


class WeightBalanceEngine(ConstraintEngine):
    def __init__(
        self,
        mac_leading_edge_sta: float,
        mac_length: float,
        cg_forward_limit_pct: float,
        cg_aft_limit_pct: float,
        mtow_kg: float,
    ):
        self.mac_le = mac_leading_edge_sta
        self.mac_len = mac_length
        self.cg_fwd = cg_forward_limit_pct
        self.cg_aft = cg_aft_limit_pct
        self.mtow = mtow_kg

    def evaluate(self, equipment_data: list[dict]) -> ConstraintResult:
        items = [e for e in equipment_data if e.get("weight_balance")]
        if not items:
            return ConstraintResult(
                engine_name="weight_balance",
                status=ConstraintStatus.PASS,
                summary="无设备重量数据",
                details={"total_mass_kg": 0.0, "cg_pct_mac": 0.0, "mtow_margin_kg": self.mtow},
            )

        total_mass = sum(e["weight_balance"]["mass_kg"] for e in items)
        total_moment = sum(e["weight_balance"]["mass_kg"] * e["weight_balance"]["arm_sta"] for e in items)
        cg_sta = total_moment / total_mass if total_mass > 0 else 0
        cg_pct = ((cg_sta - self.mac_le) / self.mac_len) * 100 if self.mac_len > 0 else 0

        problems = []
        status = ConstraintStatus.PASS

        # Check MTOW
        mtow_ratio = total_mass / self.mtow if self.mtow > 0 else 0
        if total_mass > self.mtow:
            problems.append(f"超过最大起飞重量: {total_mass:.1f}kg > {self.mtow:.1f}kg")
            status = ConstraintStatus.BLOCKED
        elif mtow_ratio > WARNING_THRESHOLD:
            problems.append(f"接近最大起飞重量: {mtow_ratio:.0%}")
            status = ConstraintStatus.WARNING

        # Check CG envelope
        if cg_pct < self.cg_fwd:
            problems.append(f"CG 前越限: {cg_pct:.1f}%MAC < {self.cg_fwd:.1f}%MAC")
            status = ConstraintStatus.BLOCKED
        elif cg_pct > self.cg_aft:
            problems.append(f"CG 后越限: {cg_pct:.1f}%MAC > {self.cg_aft:.1f}%MAC")
            status = ConstraintStatus.BLOCKED

        return ConstraintResult(
            engine_name="weight_balance",
            status=status,
            summary="; ".join(problems) if problems else f"CG {cg_pct:.1f}%MAC, 重量 {total_mass:.1f}kg",
            details={
                "total_mass_kg": total_mass,
                "cg_sta": cg_sta,
                "cg_pct_mac": cg_pct,
                "mtow_margin_kg": self.mtow - total_mass,
                "mtow_ratio_pct": mtow_ratio * 100,
            },
        )
```

- [ ] **Step 5: Run W&B tests**

Run: `cd backend && pytest tests/test_engines/test_weight_balance.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 6: Write failing E-Load engine test**

Create `backend/tests/test_engines/test_electrical_load.py`:
```python
from app.engines.base import ConstraintStatus
from app.engines.electrical_load import ElectricalLoadEngine


BUS_DEFS = [
    {"id": "bus1", "bus_name": "AC BUS 1", "bus_type": "AC", "rated_capacity_kva": 20.0},
    {"id": "bus2", "bus_name": "DC ESS", "bus_type": "DC", "rated_capacity_kva": 5.0},
]


def _equip(bus_id: str, normal: float, emergency: float | None = None) -> dict:
    return {
        "id": "test",
        "electrical_load": {
            "bus_id": bus_id, "bus_name": "", "power_kva_normal": normal,
            "power_kva_emergency": emergency, "power_kva_max": None,
        },
    }


def test_all_buses_within_capacity():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus1", 10.0), _equip("bus2", 2.0)])
    assert result.status == ConstraintStatus.PASS
    assert result.details["buses"]["bus1"]["load_ratio_pct"] == pytest.approx(50.0)


def test_bus_overloaded():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus2", 3.0), _equip("bus2", 3.0)])  # 6 > 5
    assert result.status == ConstraintStatus.BLOCKED


def test_bus_warning_threshold():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([_equip("bus1", 18.0)])  # 90% > 85%
    assert result.status == ConstraintStatus.WARNING


def test_empty_equipment():
    engine = ElectricalLoadEngine(bus_definitions=BUS_DEFS)
    result = engine.evaluate([])
    assert result.status == ConstraintStatus.PASS
```

- [ ] **Step 7: Run test to verify it fails**

Run: `cd backend && pytest tests/test_engines/test_electrical_load.py -v`
Expected: FAIL

- [ ] **Step 8: Implement E-Load engine**

```python
# backend/app/engines/electrical_load.py
from app.engines.base import ConstraintEngine, ConstraintResult, ConstraintStatus

WARNING_THRESHOLD = 0.85


class ElectricalLoadEngine(ConstraintEngine):
    def __init__(self, bus_definitions: list[dict]):
        self.bus_defs = {b["id"]: b for b in bus_definitions}

    def evaluate(self, equipment_data: list[dict], phase: str = "normal") -> ConstraintResult:
        bus_loads: dict[str, float] = {bid: 0.0 for bid in self.bus_defs}

        for e in equipment_data:
            eload = e.get("electrical_load")
            if not eload:
                continue
            bid = eload["bus_id"]
            if bid not in bus_loads:
                continue
            power_key = f"power_kva_{phase}"
            power = eload.get(power_key) or eload.get("power_kva_normal", 0) or 0
            bus_loads[bid] += power

        status = ConstraintStatus.PASS
        problems = []
        bus_details = {}

        for bid, load in bus_loads.items():
            bdef = self.bus_defs[bid]
            capacity = bdef["rated_capacity_kva"]
            ratio = load / capacity if capacity > 0 else 0
            margin = capacity - load

            bus_details[bid] = {
                "bus_name": bdef["bus_name"],
                "load_kva": load,
                "capacity_kva": capacity,
                "margin_kva": margin,
                "load_ratio_pct": ratio * 100,
            }

            if load > capacity:
                problems.append(f"{bdef['bus_name']} 过载: {load:.1f}/{capacity:.1f} kVA")
                status = ConstraintStatus.BLOCKED
            elif ratio > WARNING_THRESHOLD and status != ConstraintStatus.BLOCKED:
                problems.append(f"{bdef['bus_name']} 接近满载: {ratio:.0%}")
                if status != ConstraintStatus.BLOCKED:
                    status = ConstraintStatus.WARNING

        return ConstraintResult(
            engine_name="electrical_load",
            status=status,
            summary="; ".join(problems) if problems else "所有母线负荷正常",
            details={"phase": phase, "buses": bus_details},
        )
```

- [ ] **Step 9: Run all engine tests**

Run: `cd backend && pytest tests/test_engines/ -v`
Expected: All 9 tests PASS.

- [ ] **Step 10: Create engine registry**

```python
# backend/app/engines/__init__.py
from app.engines.base import ConstraintEngine, ConstraintResult, ConstraintStatus
from app.engines.weight_balance import WeightBalanceEngine
from app.engines.electrical_load import ElectricalLoadEngine

__all__ = [
    "ConstraintEngine", "ConstraintResult", "ConstraintStatus",
    "WeightBalanceEngine", "ElectricalLoadEngine",
]
```

- [ ] **Step 11: Commit**

```bash
git add backend/
git commit -m "feat: constraint engines — Weight/CG envelope + Electrical load per-bus validation with TDD"
```

---

## Task 5: Equipment CRUD API

**Files:**
- Create: `backend/app/schemas/equipment.py`
- Create: `backend/app/services/equipment_svc.py`
- Create: `backend/app/api/equipment.py`
- Modify: `backend/app/main.py` (mount router)
- Test: `backend/tests/test_api/test_equipment_api.py`

This task implements the Equipment CRUD endpoints with sub-table data (installation, weight_balance, electrical_load) nested in a single request/response. Full Pydantic schemas, service layer with audit logging, and API routes with authentication.

- [ ] **Step 1: Create Pydantic schemas for Equipment**

`backend/app/schemas/equipment.py` — defines `EquipmentCreate`, `EquipmentUpdate`, `EquipmentResponse` with nested `InstallationData`, `WeightBalanceData`, `ElectricalLoadData`. Response includes all sub-tables inlined.

- [ ] **Step 2: Create equipment service**

`backend/app/services/equipment_svc.py` — implements `list_equipment(config_id, filters, pagination)`, `get_equipment(id)`, `create_equipment(data)`, `update_equipment(id, data)`, `delete_equipment(id)`. Each mutation writes to AuditLog.

- [ ] **Step 3: Create API routes**

`backend/app/api/equipment.py` — `GET /equipment`, `GET /equipment/{id}`, `POST /equipment`, `PUT /equipment/{id}`, `DELETE /equipment/{id}`. All require auth. List endpoint supports `?config_id=`, `?ata_chapter=`, `?zone_id=`, `?search=` query params with offset/limit pagination.

- [ ] **Step 4: Mount router in main.py**

Add `from app.api.equipment import router as equipment_router` and `app.include_router(equipment_router, prefix="/api")`.

- [ ] **Step 5: Write API tests**

`backend/tests/test_api/test_equipment_api.py` — tests for: create equipment with all sub-tables, list with pagination, filter by ATA chapter, get single, update, delete, unauthenticated access blocked.

- [ ] **Step 6: Run tests, verify pass**

Run: `cd backend && pytest tests/test_api/test_equipment_api.py -v`

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: equipment CRUD API with sub-table data, filtering, pagination, audit logging"
```

---

## Task 6: Configuration Management API + Diff

**Files:**
- Create: `backend/app/schemas/configuration.py`
- Create: `backend/app/services/configuration_svc.py`
- Create: `backend/app/api/configurations.py`
- Create: `backend/app/api/programs.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_api/test_configuration_api.py`
- Test: `backend/tests/test_services/test_configuration_svc.py`

- [ ] **Step 1: Create Configuration schemas**

Includes `ConfigCreate`, `ConfigResponse`, `ConfigDiffResponse` (with `added: list`, `removed: list`, `modified: list`, `impact_summary: dict`).

- [ ] **Step 2: Create configuration service**

`configuration_svc.py` — implements: `create_config(series_id, version)`, `clone_config(source_id, new_version)`, `lock_baseline(config_id)`, `add_equipment(config_id, equipment_id)`, `remove_equipment(config_id, equipment_id)`, `diff_configs(config_a_id, config_b_id)`.

The `diff_configs` method compares equipment lists between two configurations and returns added/removed/modified sets with attribute differences.

- [ ] **Step 3: Create Programs API**

`backend/app/api/programs.py` — basic CRUD for Program and Series. Needed so frontend can select which program/series to work with.

- [ ] **Step 4: Create Configurations API**

`backend/app/api/configurations.py` — `GET /configurations?series_id=`, `POST /configurations`, `POST /configurations/{id}/clone`, `POST /configurations/{id}/lock`, `POST /configurations/{id}/equipment/{equip_id}`, `DELETE /configurations/{id}/equipment/{equip_id}`, `GET /configurations/{a_id}/diff/{b_id}`.

- [ ] **Step 5: Write diff service unit test**

Test that diffing two configs correctly identifies added, removed, and modified equipment.

- [ ] **Step 6: Write API integration tests**

Test the full workflow: create program → series → config → add equipment → clone → modify → diff.

- [ ] **Step 7: Run all tests**

Run: `cd backend && pytest -v`

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: configuration management API with clone, lock baseline, diff"
```

---

## Task 7: Constraint Validation API + WebSocket

**Files:**
- Create: `backend/app/schemas/constraint.py`
- Create: `backend/app/services/constraint_svc.py`
- Create: `backend/app/ws/constraint_ws.py`
- Create: `backend/app/api/constraints.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_api/test_constraints_api.py`

- [ ] **Step 1: Create constraint schemas**

```python
# backend/app/schemas/constraint.py
from pydantic import BaseModel
from app.engines.base import ConstraintStatus


class ValidationRequest(BaseModel):
    config_id: str
    hypothetical_adds: list[str] | None = None      # equipment IDs to simulate adding
    hypothetical_removes: list[str] | None = None    # equipment IDs to simulate removing


class EngineResult(BaseModel):
    engine_name: str
    status: ConstraintStatus
    summary: str
    details: dict


class ValidationReport(BaseModel):
    config_id: str
    overall_status: ConstraintStatus
    engines: list[EngineResult]
```

- [ ] **Step 2: Create constraint service**

`constraint_svc.py` — loads all equipment for a config (with sub-tables), optionally applies hypothetical adds/removes, instantiates WeightBalanceEngine and ElectricalLoadEngine with the series' parameters (MAC, bus definitions), runs both in parallel (asyncio.gather), returns aggregated ValidationReport. Overall status = worst of individual statuses.

- [ ] **Step 3: Create REST endpoint**

`POST /api/constraints/validate` — accepts `ValidationRequest`, returns `ValidationReport`. Used for on-demand validation and "what-if" analysis.

- [ ] **Step 4: Create WebSocket endpoint**

`backend/app/ws/constraint_ws.py` — WebSocket at `/ws/constraints/{config_id}`. When a client connects, it joins a config-specific room. When any equipment mutation happens for that config, the constraint service is re-run and results pushed to all connected clients.

- [ ] **Step 5: Mount WebSocket in main.py**

```python
from app.ws.constraint_ws import router as ws_router
app.include_router(ws_router)
```

- [ ] **Step 6: Write constraint API test**

Test: create a config with equipment, call validate endpoint, verify response structure and correct status.

- [ ] **Step 7: Run tests**

Run: `cd backend && pytest tests/test_api/test_constraints_api.py -v`

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat: constraint validation API + WebSocket real-time push"
```

---

## Task 8: Excel Import + Sample Data Seed

**Files:**
- Create: `backend/app/services/import_svc.py`
- Create: `backend/app/api/imports.py`
- Create: `data/sample/ce25a_equipment.xlsx`
- Create: `backend/scripts/seed.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create import service**

`import_svc.py` — parses an Excel file (openpyxl) with columns: 件号, 名称, ATA章节, 类型, 重量kg, STA, WL, BL, 区域, 母线, 功耗kVA. Creates Equipment + sub-table records. Returns import summary (success count, error rows with reasons).

- [ ] **Step 2: Create import API**

`POST /api/import/equipment` — accepts file upload (multipart/form-data) + `config_id` param. Calls import service, adds imported equipment to the specified configuration.

- [ ] **Step 3: Create sample Excel data**

`data/sample/ce25a_equipment.xlsx` — 30-50 rows of representative CE-25A equipment across ATA chapters 21-34, distributed across zones and buses. Include realistic weight/location/power data.

- [ ] **Step 4: Create seed script**

`backend/scripts/seed.py` — creates: admin user, CE-25A program + 基本型 series, zones (131/132/141/142...), bus definitions (AC BUS 1/2, DC ESS, DC MAIN), imports sample Excel, creates V1.0 baseline config.

- [ ] **Step 5: Test seed script**

Run: `cd backend && python -m scripts.seed`
Expected: Database populated with sample data.

- [ ] **Step 6: Commit**

```bash
git add backend/ data/
git commit -m "feat: Excel import service + sample CE-25A data seeding"
```

---

## Task 9: Document Generation

**Files:**
- Create: `backend/app/services/document_svc.py`
- Create: `backend/app/api/documents.py`
- Create: `backend/templates/equipment_list.html`
- Create: `backend/templates/weight_report.html`
- Create: `backend/templates/eload_report.html`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_services/test_document_svc.py`

- [ ] **Step 1: Create document service**

`document_svc.py` — uses Jinja2 templates + WeasyPrint for PDF, openpyxl for Excel. Implements:
- `generate_equipment_list(config_id)` → PDF/Excel
- `generate_weight_report(config_id)` → PDF (includes CG calculation summary)
- `generate_eload_report(config_id)` → PDF (bus load table)

- [ ] **Step 2: Create HTML templates**

Jinja2 templates with clean table layouts for each report type. CSS styled for A4 print.

- [ ] **Step 3: Create API endpoint**

`POST /api/documents/generate` — body: `{config_id, doc_type: "equipment_list"|"weight_report"|"eload_report", format: "pdf"|"xlsx"}`. Returns file download.

- [ ] **Step 4: Write service tests**

Test that each generator produces valid output (non-empty bytes for PDF, valid openpyxl workbook for Excel).

- [ ] **Step 5: Run tests**

Run: `cd backend && pytest tests/test_services/test_document_svc.py -v`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: document generation — equipment list, weight report, electrical load report (PDF + Excel)"
```

---

## Task 10: Frontend Foundation — Layout, Routing, API Client

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/equipment.ts`
- Create: `frontend/src/api/configurations.ts`
- Create: `frontend/src/api/constraints.ts`
- Create: `frontend/src/store/configStore.ts`
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/GlobalNav.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/WorkstationPage.tsx`
- Create: `frontend/src/pages/SpatialViewPage.tsx`
- Create: `frontend/src/pages/ConfigPage.tsx`

- [ ] **Step 1: Create TypeScript types**

`frontend/src/types/index.ts` — interfaces mirroring backend schemas: `Equipment`, `Installation`, `WeightBalance`, `ElectricalLoad`, `Configuration`, `Program`, `Series`, `Zone`, `BusDefinition`, `ValidationReport`, `EngineResult`, `ConstraintStatus`.

- [ ] **Step 2: Create API client**

`frontend/src/api/client.ts` — Axios instance with base URL `/api`, token interceptor from localStorage, 401 redirect to login.

- [ ] **Step 3: Create API modules**

`equipment.ts` — `listEquipment(params)`, `getEquipment(id)`, `createEquipment(data)`, `updateEquipment(id, data)`, `deleteEquipment(id)`.

`configurations.ts` — `listConfigs(seriesId)`, `createConfig(data)`, `cloneConfig(id, version)`, `lockBaseline(id)`, `addEquipment(configId, equipId)`, `removeEquipment(configId, equipId)`, `diffConfigs(aId, bId)`.

`constraints.ts` — `validateConfig(request)`.

- [ ] **Step 4: Create Zustand store for active configuration**

```typescript
// frontend/src/store/configStore.ts
import { create } from 'zustand';

interface ConfigState {
  activeConfigId: string | null;
  activeProgramId: string | null;
  activeSeriesId: string | null;
  setActiveConfig: (configId: string) => void;
  setActiveProgram: (programId: string) => void;
  setActiveSeries: (seriesId: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  activeConfigId: null,
  activeProgramId: null,
  activeSeriesId: null,
  setActiveConfig: (configId) => set({ activeConfigId: configId }),
  setActiveProgram: (programId) => set({ activeProgramId: programId }),
  setActiveSeries: (seriesId) => set({ activeSeriesId: seriesId }),
}));
```

- [ ] **Step 5: Create AppLayout with Ant Design**

`AppLayout.tsx` — Ant Design `Layout` with `Sider` (menu: 工程师工作台 / 空间视图 / 构型管理) + `Header` (GlobalNav with config selector) + `Content` (router outlet).

`GlobalNav.tsx` — shows current program/series/config with dropdown selectors.

- [ ] **Step 6: Create App.tsx with routing**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { WorkstationPage } from './pages/WorkstationPage';
import { SpatialViewPage } from './pages/SpatialViewPage';
import { ConfigPage } from './pages/ConfigPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/workstation" replace />} />
            <Route path="/workstation" element={<WorkstationPage />} />
            <Route path="/spatial" element={<SpatialViewPage />} />
            <Route path="/config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

- [ ] **Step 7: Create main.tsx entry**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 8: Create page stubs**

Each page file (`WorkstationPage.tsx`, `SpatialViewPage.tsx`, `ConfigPage.tsx`, `LoginPage.tsx`) — minimal Ant Design page with heading text. Will be filled in subsequent tasks.

- [ ] **Step 9: Verify frontend builds and renders**

Run: `docker compose up frontend`
Open: http://localhost:5173
Expected: Ant Design layout with sidebar navigation, page switching works.

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: frontend foundation — React + Ant Design layout, routing, API client, Zustand store"
```

---

## Task 11: Workstation Page — Equipment Table + Constraint Panel

**Files:**
- Create: `frontend/src/components/equipment/EquipmentTable.tsx`
- Create: `frontend/src/components/equipment/EquipmentForm.tsx`
- Create: `frontend/src/components/equipment/EquipmentDetail.tsx`
- Create: `frontend/src/components/constraints/ConstraintPanel.tsx`
- Create: `frontend/src/components/constraints/CGIndicator.tsx`
- Create: `frontend/src/components/constraints/BusLoadBar.tsx`
- Create: `frontend/src/components/constraints/TrendSparkline.tsx`
- Create: `frontend/src/hooks/useConstraintWS.ts`
- Modify: `frontend/src/pages/WorkstationPage.tsx`

- [ ] **Step 1: Create EquipmentTable**

Ant Design `Table` with columns: 件号, 名称, ATA章节, 类型, 重量(kg), 区域, 母线, 状态. Supports: server-side pagination, column sorting, ATA/Zone filter dropdowns, search input. Row click opens detail drawer.

- [ ] **Step 2: Create EquipmentForm**

Ant Design `Form` in a `Modal` for creating/editing equipment. Fields grouped by tabs: 基本信息 | 安装位置 | 重量数据 | 电气数据. Zone and Bus fields are dropdowns populated from API.

- [ ] **Step 3: Create EquipmentDetail**

Ant Design `Drawer` showing all equipment data in `Descriptions` component with sub-table sections.

- [ ] **Step 4: Create WebSocket hook**

```typescript
// frontend/src/hooks/useConstraintWS.ts
import { useEffect, useRef, useState } from 'react';
import type { ValidationReport } from '../types';

export function useConstraintWS(configId: string | null) {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!configId) return;

    const ws = new WebSocket(`ws://${window.location.host}/ws/constraints/${configId}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as ValidationReport;
      setReport(data);
    };
    wsRef.current = ws;

    return () => { ws.close(); };
  }, [configId]);

  return report;
}
```

- [ ] **Step 5: Create ConstraintPanel**

Right-side panel (280px wide) displaying:
- CG indicator (CGIndicator component)
- Bus load bars (one BusLoadBar per bus)
- Trend sparkline (last 5 config versions)
- Overall status badge (green/yellow/red)

Color system: `#34C759` (pass), `#FF9500` (warning), `#FF3B30` (blocked), `#8E8E93` (inactive).

- [ ] **Step 6: Create CGIndicator**

SVG horizontal bar showing CG position between forward and aft limits. Marker dot at current CG%MAC. Green/yellow/red coloring based on proximity to limits.

- [ ] **Step 7: Create BusLoadBar**

Ant Design `Progress` bar with custom color based on load ratio. Shows: bus name, load/capacity, margin. Color thresholds at 85% (yellow) and 100% (red).

- [ ] **Step 8: Create TrendSparkline**

Minimal SVG `<polyline>` rendering 5 data points. 60px wide, 20px tall. Shows direction arrow (↗/→/↘).

- [ ] **Step 9: Wire up WorkstationPage**

```typescript
// frontend/src/pages/WorkstationPage.tsx
export function WorkstationPage() {
  // Left: EquipmentTable (flex: 1)
  // Right: ConstraintPanel (width: 280px, fixed)
  // Top toolbar: [+ 添加设备] [批量导入] buttons
  // EquipmentForm modal triggered by add/edit
  // EquipmentDetail drawer triggered by row click
  // useConstraintWS hook connected to active config
}
```

- [ ] **Step 10: Verify in browser**

Run: `docker compose up`
Navigate to workstation page. Verify: table loads equipment from seeded data, constraint panel shows real-time values, adding/editing equipment triggers constraint recalculation.

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "feat: workstation page — equipment table + real-time constraint panel with WebSocket"
```

---

## Task 12: 2D Spatial View — SVG Aircraft Views

**Files:**
- Create: `frontend/src/components/spatial/SpatialView.tsx`
- Create: `frontend/src/components/spatial/AircraftSideView.tsx`
- Create: `frontend/src/components/spatial/AircraftTopView.tsx`
- Create: `frontend/src/components/spatial/SectionView.tsx`
- Create: `frontend/src/components/spatial/EquipmentMarker.tsx`
- Create: `frontend/src/components/spatial/ZoneOverlay.tsx`
- Modify: `frontend/src/pages/SpatialViewPage.tsx`

- [ ] **Step 1: Create SpatialView container**

Tab switcher (侧视图 / 俯视图 / 截面图) + toolbar with STA slider (for section view), zoom controls, and equipment search/highlight input. Active tab renders corresponding SVG view.

- [ ] **Step 2: Create AircraftSideView**

SVG component rendering:
- Fuselage outline (simplified elliptical profile from nose to tail)
- STA scale ruler along bottom
- Zone background rectangles with semi-transparent colors
- Equipment markers positioned by (STA, WL) coordinates
- Viewbox: 0-1200 (STA) × 0-300 (WL), scaled to container

```typescript
// Core SVG structure
<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid meet">
  {/* Fuselage outline path */}
  <path d={fuselagePath} fill="none" stroke="#666" strokeWidth="2" />
  {/* Zone overlays */}
  {zones.map(z => <ZoneOverlay key={z.id} zone={z} />)}
  {/* Equipment markers */}
  {equipment.map(e => <EquipmentMarker key={e.id} equipment={e} view="side" />)}
  {/* STA ruler */}
  {staMarks.map(sta => <text x={sta} y={295} fontSize="8">{sta}</text>)}
</svg>
```

- [ ] **Step 3: Create AircraftTopView**

Similar to side view but positioned by (STA, BL). Fuselage is a wider ellipse. Equipment spread left-right of centerline (BL=0).

- [ ] **Step 4: Create SectionView**

Cross-section at a user-selected STA. SVG circle/ellipse representing the fuselage cross-section at that station. Equipment positioned by (BL, WL) within the section.

- [ ] **Step 5: Create EquipmentMarker**

SVG `<g>` containing: colored circle (color = ATA chapter), label on hover (part_number + name). Click handler to select equipment and open detail drawer. Selected marker has pulsing ring animation.

- [ ] **Step 6: Create ZoneOverlay**

SVG `<rect>` from `(zone.sta_from, zone.wl_from)` to `(zone.sta_to, zone.wl_to)` with semi-transparent fill color. Zone name label inside.

- [ ] **Step 7: Wire up SpatialViewPage**

Fetch equipment with installation data for active config. Pass to SVG views. Equipment click syncs with workstation selection. Search input highlights matching markers.

- [ ] **Step 8: Verify in browser**

Navigate to spatial view. Verify: side view shows fuselage with equipment dots at correct positions, zone colors visible, clicking equipment shows info, tab switching works.

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: 2D spatial view — SVG side/top/section views with equipment markers and zone overlays"
```

---

## Task 13: Configuration Management Page + Diff View

**Files:**
- Create: `frontend/src/components/configuration/ConfigSelector.tsx`
- Create: `frontend/src/components/configuration/ConfigDiff.tsx`
- Create: `frontend/src/components/configuration/ConfigTimeline.tsx`
- Modify: `frontend/src/pages/ConfigPage.tsx`

- [ ] **Step 1: Create ConfigTimeline**

Horizontal timeline showing all configurations for the active series. Each node shows version + status badge. Clicking a node sets it as active config. Baseline versions have a lock icon.

- [ ] **Step 2: Create ConfigDiff**

Git-diff style comparison view. Two dropdown selectors (Config A vs Config B). Table showing:
- Added equipment: green background, `+` prefix
- Removed equipment: red background, `-` prefix
- Modified equipment: orange background, `△` prefix with changed fields highlighted
- Impact summary at bottom: net weight change, CG shift, bus load changes

Default view: "只显示差异" toggle (hides unchanged equipment).

- [ ] **Step 3: Create ConfigSelector**

Used in GlobalNav. Cascading dropdowns: Program → Series → Configuration. Updates Zustand store on selection.

- [ ] **Step 4: Wire up ConfigPage**

Layout: Timeline at top, action buttons (创建新版本 / 克隆当前 / 锁定基线), diff view below. Create/Clone opens modal for version name input.

- [ ] **Step 5: Verify in browser**

Create a second config by cloning, modify equipment, use diff view to see changes.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: configuration management page — timeline, diff view, clone, lock baseline"
```

---

## Task 14: Integration Testing + Polish

**Files:**
- Modify: various files for bug fixes
- Create: `backend/tests/test_integration/test_full_workflow.py`

- [ ] **Step 1: Write full workflow integration test**

Backend test that exercises the complete flow: create program → series → zones → buses → config → import equipment via Excel → validate constraints → clone config → add equipment → validate again → diff → generate documents.

- [ ] **Step 2: Run full test suite**

Run: `cd backend && pytest -v --cov=app`
Expected: All tests pass, >70% coverage on engines and services.

- [ ] **Step 3: Frontend smoke test**

Manual verification in browser of complete workflow:
1. Login
2. See equipment table with seeded data
3. Constraint panel shows live values
4. Add new equipment → constraint panel updates
5. Switch to spatial view → see equipment on aircraft
6. Click equipment marker → syncs with detail
7. Switch to config page → see timeline
8. Clone config → diff shows changes
9. Generate equipment list PDF → downloads correctly

- [ ] **Step 4: Fix any issues found**

Address bugs discovered during integration testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: integration tests + polish for MVP release"
```

---

## Summary

| Task | Description | Key Deliverable |
|------|-------------|-----------------|
| 1 | Project scaffolding | Docker Compose + project structure |
| 2 | Backend foundation | Database, Auth, Alembic |
| 3 | Core data models | 12 SQLAlchemy models with relationships |
| 4 | Constraint engines | W&B + E-Load with full TDD |
| 5 | Equipment CRUD API | REST endpoints + audit logging |
| 6 | Configuration API | Clone, lock, diff |
| 7 | Constraint API + WS | Real-time validation push |
| 8 | Excel import + seed | Data import pipeline + sample data |
| 9 | Document generation | PDF + Excel report generation |
| 10 | Frontend foundation | React + Ant Design + routing + store |
| 11 | Workstation page | Equipment table + constraint panel |
| 12 | 2D spatial view | SVG aircraft views with markers |
| 13 | Config management UI | Timeline + diff view |
| 14 | Integration + polish | End-to-end testing |
