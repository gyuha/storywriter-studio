# Technology Stack

**Analysis Date:** 2026-05-17

## Languages

**Primary:**
- TypeScript 5.8 - Frontend (`web/src/`)
- Python 3.12 - Backend API (`apps/api/src/`)

**Secondary:**
- None

## Runtime

**Environment:**
- Node.js >=18.17.0 (frontend dev/build)
- Python 3.12 (backend, enforced in `apps/api/pyproject.toml`)

**Package Manager:**
- Frontend: pnpm 10.28.2 (`web/package.json`)
  - Lockfile: `web/pnpm-lock.yaml` (present)
- Backend: uv (`apps/api/pyproject.toml`)
  - Lockfile: `apps/api/uv.lock` (present)

## Frameworks

**Core:**
- React 19 - Frontend UI framework (`web/src/`)
- FastAPI >=0.115.0 with uvicorn >=0.30.0 - Backend HTTP framework (`apps/api/src/main.py`)

**Routing (Frontend):**
- @tanstack/react-router 1.95.0 - File-based routing with auto code splitting (`web/src/routes/`, config in `web/vite.config.ts`)

**State Management (Frontend):**
- zustand 5.0.3 - Global client state (`web/src/stores/`, `web/src/features/auth/store/auth.store.ts`)
- @tanstack/react-query 5.75.0 - Server state / async data fetching (`web/src/providers/app-providers.tsx`)
- immer 11.1.4 - Immutable state updates (paired with zustand)

**Forms (Frontend):**
- react-hook-form 7.55.0 + @hookform/resolvers 4.1.3 + zod 3.24.2 - Form handling with schema validation

**Styling (Frontend):**
- Tailwind CSS 4.0 - Utility-first CSS (`web/src/styles/`)
- tailwind-merge 2.6.0 + clsx 2.1.1 + class-variance-authority 0.7.1 - Class name utilities
- motion 11.18.0 (Framer Motion) - Animations

**UI Components (Frontend):**
- @base-ui/react 1.4.1 - Unstyled accessible UI primitives
- radix-ui 1.4.3 + @radix-ui/react-* - Radix UI headless components
- lucide-react 0.487.0 - Icon library
- cmdk 1.1.1 - Command palette component
- sonner 2.0.3 - Toast notifications
- recharts 3.8.1 - Charts/data visualization
- react-day-picker 10.0.0 - Date picker
- @tanstack/react-table 8.21.3 - Headless table

**Internationalization (Frontend):**
- i18next 26.0.10 + react-i18next 17.0.7 - i18n support

**Data Generation (Frontend):**
- @faker-js/faker 10.4.0 - Mock data generation

**LLM / AI (Backend):**
- langchain >=0.3.0 + langchain-core >=0.3.0 + langchain-community >=0.3.0 - LangChain orchestration
- langchain-litellm >=0.2.0 - LangChain adapter for LiteLLM
- litellm >=1.50.0 - Multi-provider LLM routing (OpenAI, Anthropic, Gemini, Azure, Ollama)
- sse-starlette >=2.1.0 - Server-Sent Events for LLM token streaming

**Database ORM (Backend):**
- SQLAlchemy[asyncio] >=2.0.36 - Async ORM (`apps/api/src/core/database.py`)
- alembic >=1.14.0 - Database migrations (`apps/api/alembic/`)
- asyncpg >=0.30.0 - Async PostgreSQL driver
- psycopg2-binary >=2.9.9 - Sync PostgreSQL driver (Alembic only)

**Auth / Security (Backend):**
- python-jose[cryptography] >=3.3.0 - JWT encode/decode (HS256)
- passlib[argon2] >=1.7.4 + argon2-cffi >=23.1.0 - Password hashing (Argon2)

**Cache (Backend):**
- redis[hiredis] >=5.2.0 - JWT blacklist, rate limiting, OAuth state, SSE fanout (`apps/api/src/core/redis.py`)

**HTTP Client (Backend):**
- httpx >=0.27.0 - OAuth flows, async HTTP

**Email (Backend):**
- fastapi-mail >=1.4.2 - Transactional email (`apps/api/src/domains/auth/email.py`)

**Rate Limiting (Backend):**
- slowapi >=0.1.9 - Redis-backed per-user/per-IP rate limiting (`apps/api/src/main.py`)

**Validation / Config (Backend):**
- pydantic >=2.9.0 + pydantic-settings >=2.5.0 - Data validation and settings management
- email-validator >=2.2.0 - Pydantic EmailStr support

**Logging (Backend):**
- structlog >=24.4.0 - JSON structured logging with correlation ID (`apps/api/src/core/logging.py`)

**Retry (Backend):**
- tenacity >=8.5.0 - Retry logic for transient LLM errors

**Testing (Backend):**
- pytest >=8.3.0 + pytest-asyncio >=0.24.0 + pytest-cov >=5.0.0
- fakeredis >=2.26.0 - In-memory Redis stub
- anyio >=4.6.0 - Async test helpers

## Build / Dev Tools

**Frontend:**
- Vite 6.0.0 - Dev server and bundler (`web/vite.config.ts`)
- @vitejs/plugin-react 4.3.4 - React fast refresh
- @tailwindcss/vite 4.0.0 - Tailwind CSS Vite plugin
- @tanstack/router-plugin 1.95.0 - Route tree generation
- vite-tsconfig-paths 5.1.4 - TypeScript path alias resolution

**Linting / Formatting (Frontend):**
- @biomejs/biome 1.9.4 - Unified linter + formatter (replaces ESLint + Prettier)

**Type Checking (Frontend):**
- TypeScript 5.8 strict mode (`web/tsconfig.json`)

**Backend Dev Tools:**
- ruff >=0.8.0 - Python linter + formatter (configured in `apps/api/pyproject.toml`)
- mypy >=1.13.0 - Static type checking (strict mode)
- pre-commit >=4.0.0 + detect-secrets >=1.5.0 - Pre-commit hooks + secret scanning

**Containerization:**
- Docker multi-stage build (`apps/api/Dockerfile`) — Python 3.12-slim-bookworm, uv 0.6.13
- Docker Compose (`apps/api/docker-compose.yml`) — PostgreSQL 16, Redis 7, Mailpit

## Key Dependencies

**Critical:**
- `langchain-litellm` / `litellm` - Single LLM provider-switching abstraction; changing `LLM_PROVIDER` env var is the only code change needed
- `sqlalchemy[asyncio]` + `asyncpg` - Entire database access layer is async
- `redis[hiredis]` - Required for JWT blacklist, rate limiting, and OAuth state nonce; app fails to start without it
- `python-jose` + `passlib[argon2]` - Core auth security; argon2 is the password hash algorithm

**Infrastructure:**
- `alembic` 1.14.0 - Database schema migrations (`apps/api/alembic/`)
- `slowapi` 0.1.9 - Rate limiter tied to Redis; key function in `apps/api/src/main.py`
- `structlog` 24.4.0 - All logging goes through structlog; correlation ID middleware in `apps/api/src/core/middleware.py`

## Configuration

**Environment (Backend):**
- All settings via environment variables or `.env` file
- Loaded by pydantic-settings in `apps/api/src/core/config.py` (singleton via `lru_cache`)
- Example: `apps/api/.env.example` and `apps/api/.env.prod.example`
- Key required vars: `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL` or `POSTGRES_*`, `REDIS_URL` or `REDIS_*`, LLM API key for active provider

**Environment (Frontend):**
- Vite `VITE_*` prefix convention for public env vars (no `.env` file detected at repo root)

**Build (Frontend):**
- `web/vite.config.ts` - Vite config with TanStack Router plugin, Tailwind, tsconfig paths
- `web/tsconfig.json` - TypeScript strict, target ES2022, path alias `@/*` → `./src/*`

**Build (Backend):**
- `apps/api/pyproject.toml` - hatchling build backend, src layout (`src/` package root)
- `apps/api/Dockerfile` - Multi-stage: builder (uv install + wheel build) → runtime (slim image, no dev tools)

## Platform Requirements

**Development:**
- Node.js >=18.17.0, pnpm >=10.0.0 (frontend)
- Python 3.12, uv package manager (backend)
- Docker + Docker Compose (for PostgreSQL 16, Redis 7, Mailpit dev infrastructure)

**Production:**
- Docker container: `python:3.12-slim-bookworm` + `libpq5` + pre-compiled `/runtime-venv`
- Deployment via `docker-compose.prod.yml` overlay
- Uvicorn as ASGI server; multiple workers supported (set `WORKERS` env var)

---

*Stack analysis: 2026-05-17*
