# AeroEquip - 航空设备管理平台

## 项目简介

航空设备管理平台，用于管理飞机设备库、构型装机、变更请求等。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React + TypeScript + Vite |
| 后端 | Python FastAPI + SQLAlchemy + Uvicorn |
| 数据库 | PostgreSQL 15（远程共享） |
| 缓存 | Redis 7（远程共享） |
| 容器 | Docker Compose |

## 架构

```
本地（你的电脑）                      远程服务器 36.212.172.150
┌────────────────────┐               ┌──────────────────────────┐
│  frontend  :3000   │               │  PostgreSQL  :15432      │
│  backend   :3001   │──────────────►│  Redis       :16379     │
└────────────────────┘               └──────────────────────────┘
                                              ▲
本地（同事的电脑）                              │
┌────────────────────┐                        │
│  frontend  :3000   │                        │
│  backend   :3001   │────────────────────────┘
└────────────────────┘
```

所有开发者共享同一个远程数据库，数据实时同步。

## 快速开始

### 前提条件

- Docker Desktop 已安装并运行
- Git

### 1. 克隆项目

```bash
git clone https://github.com/yanxuncat-prog/MBSE-Equipment.git
cd MBSE-Equipment
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

`.env` 文件内容（已预填远程数据库地址）：

```env
DB_HOST=36.212.172.150
DB_PORT=15432
DB_PASSWORD=AeroEquip2026@Prod
SECRET_KEY=dev-secret-key-change-in-production
```

### 3. 启动

```bash
docker compose up --build -d
```

### 4. 访问

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| API 文档 | http://localhost:3001/docs |

## 项目结构

```
.
├── frontend/            # React 前端
├── backend/             # FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── models/      # SQLAlchemy 数据模型
│   │   ├── services/    # 业务逻辑
│   │   └── main.py      # 应用入口
│   └── pyproject.toml   # Python 依赖
├── data/                # 数据库备份
│   └── aeroequip_dump.sql
├── scripts/             # 工具脚本
│   ├── db-export.sh     # 导出数据库
│   └── db-import.sh     # 导入数据库
├── docker-compose.yml   # 本地开发编排
├── .env.example         # 环境变量模板
└── README.md
```

## 数据库

### 概览

共 13 张表，核心关系：

```
programs → series → configurations → config_equipment ← equipment ← suppliers
                       ↓                    ↓
                     zones             bus_definitions
```

### 主要表

| 表 | 说明 | 记录数 |
|---|---|---|
| equipment | 设备库 | 265 |
| config_equipment | 构型-设备装机关联 | 795 |
| configurations | 构型版本 | 3 |
| suppliers | 供应商 | 45 |
| zones | 安装区域 | 10 |
| bus_definitions | 电气母线 | 6 |
| users | 用户 | 2 |
| change_requests | 变更请求 | 0 |
| audit_logs | 审计日志 | 0 |

### 备份与恢复

导出当前数据库：

```bash
./scripts/db-export.sh
```

从备份恢复：

```bash
./scripts/db-import.sh
```

## 远程服务器

| 项目 | 信息 |
|------|------|
| IP | 36.212.172.150 |
| PostgreSQL 端口 | 15432 |
| Redis 端口 | 16379 |
| 数据库用户 | aeroequip |
| 数据库名 | aeroequip |

数据库和 Redis 运行在服务器的 Docker 中（`/opt/aeroequip-db/docker-compose.yml`）。

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## 常用命令

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 重建（代码或依赖变更后）
docker compose up --build -d

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 直连远程数据库
PGPASSWORD=AeroEquip2026@Prod psql -h 36.212.172.150 -p 15432 -U aeroequip
```
