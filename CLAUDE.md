# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (`apps/api/`)

```bash
# Start infrastructure (PostgreSQL 16, Redis 7, Mailpit)
cd apps/api && docker compose up -d

# Run dev server
cd apps/api && uv run uvicorn src.main:app --reload

# Database migrations
cd apps/api && uv run alembic upgrade head
cd apps/api && uv run alembic revision --autogenerate -m "description"

# Tests
cd apps/api && uv run pytest                                      # all tests
cd apps/api && uv run pytest tests/unit/auth/test_auth_service.py # single file
cd apps/api && uv run pytest -m unit                              # unit only
cd apps/api && uv run pytest -m integration                       # integration only

# Lint / format / typecheck
cd apps/api && uv run ruff check .
cd apps/api && uv run ruff format .
cd apps/api && uv run mypy src/
```

### Frontend (`web/`)

```bash
cd web && pnpm dev          # dev server
cd web && pnpm build        # production build (tsc + vite)
cd web && pnpm typecheck    # tsc --noEmit only
cd web && pnpm lint         # biome check
cd web && pnpm lint:fix     # biome check --write
```

## Critical Architecture Notes

### Frontend auth is currently mocked

`web/src/features/auth/lib/mock-auth-api.ts` is used instead of real API calls. The actual FastAPI backend is not yet wired to the frontend. This is the primary gap for Phase 1.

### Adding a new backend domain

Follow `domains/auth/` exactly:
```
domains/<name>/
  router/<name>_router.py   # FastAPI APIRouter, Pydantic schemas
  service/<name>_service.py # Business logic; raises AppError, never HTTPException
  repository/<name>_repository.py  # All DB I/O via AsyncSession
  models/<name>_models.py   # SQLAlchemy ORM models
  schemas/<name>_schemas.py # Pydantic request/response models
```
Register the router in `apps/api/src/main.py`. Domain rules: `auth` and `chat` must not import each other; both may import `shared` and `core`.

### LLM provider isolation

Only `apps/api/src/infra/llm/provider_factory.py` imports `langchain_litellm`. All other code depends on the Protocol/ABC in `apps/api/src/domains/chat/ports.py`. Switching LLM providers requires only changing the `LLM_PROVIDER` env var.

### Error handling pattern

Service layer raises `AppError` subclasses (`ConflictError`, `UnauthorizedError`, `NotFoundError`). Router layer catches via `_app_error_to_http()`. Never raise `HTTPException` in service code.

### Frontend routing

TanStack Router uses file-based routing. `web/src/routes/routeTree.gen.ts` is auto-generated — do not edit. Create route files with `createFileRoute('/<path>')({ component: ... })`.

### Frontend state

- **Zustand** (`web/src/stores/`, `web/src/features/*/store/`) — client state
- **React Query** (`useMutation`, `useQuery`) — server state, API calls
- Do not use React Context for shared feature state; use a Zustand slice instead.

### `web/src/sample/`

Reference UI components only — not production code. Safe to use as implementation reference.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**StoryWriter Studio**

AI 기반 웹소설 집필 에이전트 플랫폼. 작가가 소설 프로젝트를 생성하고, 캐릭터·장소·세계관 설정을 데이터베이스로 관리하며, 챕터 에디터에서 AI가 해당 설정들을 컨텍스트로 참조하여 초안을 자동 생성하거나 집필을 보조한다. 일반 웹소설 작가가 주 대상이며, 다중 AI 모델을 지원한다.

**Core Value:** 작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어, 세계관과 일관된 글을 AI가 생성한다.

### Constraints

- **Tech Stack**: FastAPI(Python 3.12) + React 19(TypeScript 5.8) — 기존 스택 유지
- **AI**: LangChain + LiteLLM — 이미 통합된 인프라 활용, 모델 교체 가능
- **DB**: PostgreSQL (SQLAlchemy async) + Redis — 기존 인프라 유지
- **Auth**: 기존 JWT/OAuth 시스템 재사용, 소설 도메인에 RBAC 확장
- **i18n**: react-i18next 적용됨 — 한국어 우선
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.8 - Frontend (`web/src/`)
- Python 3.12 - Backend API (`apps/api/src/`)
- None
## Runtime
- Node.js >=18.17.0 (frontend dev/build)
- Python 3.12 (backend, enforced in `apps/api/pyproject.toml`)
- Frontend: pnpm 10.28.2 (`web/package.json`)
- Backend: uv (`apps/api/pyproject.toml`)
## Frameworks
- React 19 - Frontend UI framework (`web/src/`)
- FastAPI >=0.115.0 with uvicorn >=0.30.0 - Backend HTTP framework (`apps/api/src/main.py`)
- @tanstack/react-router 1.95.0 - File-based routing with auto code splitting (`web/src/routes/`, config in `web/vite.config.ts`)
- zustand 5.0.3 - Global client state (`web/src/stores/`, `web/src/features/auth/store/auth.store.ts`)
- @tanstack/react-query 5.75.0 - Server state / async data fetching (`web/src/providers/app-providers.tsx`)
- immer 11.1.4 - Immutable state updates (paired with zustand)
- react-hook-form 7.55.0 + @hookform/resolvers 4.1.3 + zod 3.24.2 - Form handling with schema validation
- Tailwind CSS 4.0 - Utility-first CSS (`web/src/styles/`)
- tailwind-merge 2.6.0 + clsx 2.1.1 + class-variance-authority 0.7.1 - Class name utilities
- motion 11.18.0 (Framer Motion) - Animations
- @base-ui/react 1.4.1 - Unstyled accessible UI primitives
- radix-ui 1.4.3 + @radix-ui/react-* - Radix UI headless components
- lucide-react 0.487.0 - Icon library
- cmdk 1.1.1 - Command palette component
- sonner 2.0.3 - Toast notifications
- recharts 3.8.1 - Charts/data visualization
- react-day-picker 10.0.0 - Date picker
- @tanstack/react-table 8.21.3 - Headless table
- i18next 26.0.10 + react-i18next 17.0.7 - i18n support
- @faker-js/faker 10.4.0 - Mock data generation
- langchain >=0.3.0 + langchain-core >=0.3.0 + langchain-community >=0.3.0 - LangChain orchestration
- langchain-litellm >=0.2.0 - LangChain adapter for LiteLLM
- litellm >=1.50.0 - Multi-provider LLM routing (OpenAI, Anthropic, Gemini, Azure, Ollama)
- sse-starlette >=2.1.0 - Server-Sent Events for LLM token streaming
- SQLAlchemy[asyncio] >=2.0.36 - Async ORM (`apps/api/src/core/database.py`)
- alembic >=1.14.0 - Database migrations (`apps/api/alembic/`)
- asyncpg >=0.30.0 - Async PostgreSQL driver
- psycopg2-binary >=2.9.9 - Sync PostgreSQL driver (Alembic only)
- python-jose[cryptography] >=3.3.0 - JWT encode/decode (HS256)
- passlib[argon2] >=1.7.4 + argon2-cffi >=23.1.0 - Password hashing (Argon2)
- redis[hiredis] >=5.2.0 - JWT blacklist, rate limiting, OAuth state, SSE fanout (`apps/api/src/core/redis.py`)
- httpx >=0.27.0 - OAuth flows, async HTTP
- fastapi-mail >=1.4.2 - Transactional email (`apps/api/src/domains/auth/email.py`)
- slowapi >=0.1.9 - Redis-backed per-user/per-IP rate limiting (`apps/api/src/main.py`)
- pydantic >=2.9.0 + pydantic-settings >=2.5.0 - Data validation and settings management
- email-validator >=2.2.0 - Pydantic EmailStr support
- structlog >=24.4.0 - JSON structured logging with correlation ID (`apps/api/src/core/logging.py`)
- tenacity >=8.5.0 - Retry logic for transient LLM errors
- pytest >=8.3.0 + pytest-asyncio >=0.24.0 + pytest-cov >=5.0.0
- fakeredis >=2.26.0 - In-memory Redis stub
- anyio >=4.6.0 - Async test helpers
## Build / Dev Tools
- Vite 6.0.0 - Dev server and bundler (`web/vite.config.ts`)
- @vitejs/plugin-react 4.3.4 - React fast refresh
- @tailwindcss/vite 4.0.0 - Tailwind CSS Vite plugin
- @tanstack/router-plugin 1.95.0 - Route tree generation
- vite-tsconfig-paths 5.1.4 - TypeScript path alias resolution
- @biomejs/biome 1.9.4 - Unified linter + formatter (replaces ESLint + Prettier)
- TypeScript 5.8 strict mode (`web/tsconfig.json`)
- ruff >=0.8.0 - Python linter + formatter (configured in `apps/api/pyproject.toml`)
- mypy >=1.13.0 - Static type checking (strict mode)
- pre-commit >=4.0.0 + detect-secrets >=1.5.0 - Pre-commit hooks + secret scanning
- Docker multi-stage build (`apps/api/Dockerfile`) — Python 3.12-slim-bookworm, uv 0.6.13
- Docker Compose (`apps/api/docker-compose.yml`) — PostgreSQL 16, Redis 7, Mailpit
## Key Dependencies
- `langchain-litellm` / `litellm` - Single LLM provider-switching abstraction; changing `LLM_PROVIDER` env var is the only code change needed
- `sqlalchemy[asyncio]` + `asyncpg` - Entire database access layer is async
- `redis[hiredis]` - Required for JWT blacklist, rate limiting, and OAuth state nonce; app fails to start without it
- `python-jose` + `passlib[argon2]` - Core auth security; argon2 is the password hash algorithm
- `alembic` 1.14.0 - Database schema migrations (`apps/api/alembic/`)
- `slowapi` 0.1.9 - Rate limiter tied to Redis; key function in `apps/api/src/main.py`
- `structlog` 24.4.0 - All logging goes through structlog; correlation ID middleware in `apps/api/src/core/middleware.py`
## Configuration
- All settings via environment variables or `.env` file
- Loaded by pydantic-settings in `apps/api/src/core/config.py` (singleton via `lru_cache`)
- Example: `apps/api/.env.example` and `apps/api/.env.prod.example`
- Key required vars: `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL` or `POSTGRES_*`, `REDIS_URL` or `REDIS_*`, LLM API key for active provider
- Vite `VITE_*` prefix convention for public env vars (no `.env` file detected at repo root)
- `web/vite.config.ts` - Vite config with TanStack Router plugin, Tailwind, tsconfig paths
- `web/tsconfig.json` - TypeScript strict, target ES2022, path alias `@/*` → `./src/*`
- `apps/api/pyproject.toml` - hatchling build backend, src layout (`src/` package root)
- `apps/api/Dockerfile` - Multi-stage: builder (uv install + wheel build) → runtime (slim image, no dev tools)
## Platform Requirements
- Node.js >=18.17.0, pnpm >=10.0.0 (frontend)
- Python 3.12, uv package manager (backend)
- Docker + Docker Compose (for PostgreSQL 16, Redis 7, Mailpit dev infrastructure)
- Docker container: `python:3.12-slim-bookworm` + `libpq5` + pre-compiled `/runtime-venv`
- Deployment via `docker-compose.prod.yml` overlay
- Uvicorn as ASGI server; multiple workers supported (set `WORKERS` env var)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Python API (`apps/api/`)
### Toolchain
- Line length: 100
- Target: Python 3.12
- `quote-style = "double"`, `indent-style = "space"`, `line-ending = "lf"`
- Enabled rule sets: `E`, `W`, `F`, `I` (isort), `N` (pep8-naming), `UP`, `B`, `C4`, `SIM`, `ANN`, `S`, `T20`, `PT`, `RUF`
- `python_version = "3.12"`, `strict = true`
- Pydantic and SQLAlchemy plugins enabled
### Naming Patterns
- Modules: `snake_case` (`auth_service.py`, `auth_router.py`)
- Classes: `PascalCase` (`AuthService`, `SignupRequest`, `UserResponse`)
- Constants: `UPPER_SNAKE_CASE`; `StrEnum` subclasses with lowercase values
- Private helpers prefixed with `_`; async functions use same name as sync (no `async_` prefix)
- Pydantic schemas: `<Entity><Role>` — e.g. `SignupRequest`, `UserResponse`
### Error Handling
- `AppError(Exception)` — base with `message` and `status_code`
- Subclasses: `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `ForbiddenError` (403)
- Global handlers in `apps/api/src/core/exceptions.py` cover `HTTPException`, `RequestValidationError`, bare `Exception`
### Logging
- Never use `print()` — enforced by `T20` ruff rule; use `structlog` instead
- JSON format in production, console format in development
### Pydantic Models
- `from_attributes = True` for ORM-backed response models
- Use `field_validator` (Pydantic v2); `mode="before"` for normalization
## Web Frontend (`web/`)
### Toolchain
- Biome: `indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 100`, single quotes, trailing commas `es5`
- TypeScript strict; path alias `@/*` → `./src/*`
### Naming Patterns
- React components: `PascalCase.tsx`; non-component modules: `kebab-case.ts`
- Stores: `<name>.store.ts`; schemas: `<name>.schema.ts`
- Hooks: `camelCase` prefixed with `use`; constants: `UPPER_SNAKE_CASE`
- Named exports only (no default exports)
### React Component Patterns
- `react-hook-form` + `zodResolver` for all form validation
- Tailwind classes via `cn()` utility (`clsx` + `tailwind-merge`)
- `motion/react` for animations
### Error Handling (Frontend)
- Mutation errors via `isError` + `error` from `useMutation`
- Success toasts via `sonner`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

**System:** Monorepo — `apps/api/` (FastAPI + DDD) and `web/` (React 19). Currently not connected: frontend uses mock auth.

**Backend layers (per domain):**
- Router → validates requests, calls service, serializes responses (`domains/*/router/`)
- Service → business logic, raises `AppError` never `HTTPException` (`domains/*/service/`)
- Repository → all DB I/O via `AsyncSession` (`domains/*/repository/`)
- Core → cross-cutting concerns, never imports domain code (`core/`)
- Infra → external adapters, e.g. LLM provider (`infra/llm/`)

**Domain isolation:** `domains/auth` and `domains/chat` must not import each other. Both may import `domains/shared` and `core`.

**LLM isolation:** Only `infra/llm/provider_factory.py` imports `langchain_litellm`. Chat domain depends only on `domains/chat/ports.py` Protocol/ABC.

**Key components:**

| Component | File |
|-----------|------|
| FastAPI app factory + middleware | `apps/api/src/main.py` |
| Settings singleton (lru_cache) | `apps/api/src/core/config.py` |
| Async DB engine + session | `apps/api/src/core/database.py` |
| JWT blacklist + Redis pool | `apps/api/src/core/redis.py` |
| AppError hierarchy + global handlers | `apps/api/src/core/exceptions.py` |
| DDD base types (Entity, AggregateRoot) | `apps/api/src/domains/shared/` |
| LLM provider adapter | `apps/api/src/infra/llm/provider_factory.py` |
| React app entry | `web/src/main.tsx` |
| Root route (AppProviders, Toaster) | `web/src/routes/__root.tsx` |
| Auth feature (components, hooks, store) | `web/src/features/auth/` |
| Global modal stack | `web/src/stores/modal-store.ts` |
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
