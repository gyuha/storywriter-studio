# Technology Stack

**Analysis Date:** 2026-05-17

## Languages

**Primary:**
- TypeScript 5.8 - Frontend (`apps/web/src/`); strict mode, target ES2022
- Python 3.12 - Backend API (`apps/api/src/`); required in `apps/api/pyproject.toml`

**Secondary:**
- None

## Runtime

**Environment:**
- Node.js >=18.17.0 (frontend dev/build)
- Python 3.12 (backend, enforced via `requires-python = ">=3.12"`)

**Package Manager:**
- Frontend: pnpm 10.28.2 (`apps/web/package.json` `packageManager` field)
- Backend: uv (`apps/api/pyproject.toml`, `apps/api/uv.lock`)
- Lockfile: present for both (`apps/web/pnpm-lock.yaml`, `apps/api/uv.lock`)

## Frameworks

**Core:**
- React 19 (`^19.0.0`) - Frontend UI framework (`apps/web/src/`)
- FastAPI >=0.115.0 with uvicorn >=0.30.0 - Backend HTTP, ASGI (`apps/api/src/main.py`)

**Routing:**
- @tanstack/react-router 1.95.0 - File-based routing with auto code-splitting (`apps/web/src/routes/`)
- Route tree auto-generated at `apps/web/src/routeTree.gen.ts` — never edit manually

**State:**
- zustand 5.0.3 - Global client state (`apps/web/src/stores/`, `apps/web/src/features/*/store/`)
- immer 11.1.4 - Immutable state updates (paired with zustand)
- @tanstack/react-query 5.75.0 - Server state / async data fetching (`apps/web/src/providers/app-providers.tsx`)

**Form / Validation:**
- react-hook-form 7.55.0 + @hookform/resolvers 4.1.3 - Form handling
- zod 3.24.2 - Schema validation (frontend)
- pydantic >=2.9.0 + pydantic-settings >=2.5.0 - Data validation and settings (backend)

**Styling:**
- Tailwind CSS 4.0 - Utility-first CSS (`apps/web/src/styles/`)
- tailwind-merge 2.6.0 + clsx 2.1.1 - Class name merging via `cn()` utility
- class-variance-authority 0.7.1 - Variant-based component styling

**UI Components:**
- @base-ui/react 1.4.1 - Unstyled accessible UI primitives
- radix-ui 1.4.3 + @radix-ui/react-* - Headless Radix components (label, slot, icons)
- lucide-react 0.487.0 - Icon library
- cmdk 1.1.1 - Command palette
- sonner 2.0.3 - Toast notifications
- motion 11.18.0 (Framer Motion) - Animations
- recharts 3.8.1 - Charts/data visualization
- react-day-picker 10.0.0 - Date picker
- @tanstack/react-table 8.21.3 - Headless table

**i18n:**
- i18next 26.0.10 + react-i18next 17.0.7 - Internationalization, Korean-first

**Testing (Backend):**
- pytest >=8.3.0 + pytest-asyncio >=0.24.0 + pytest-cov >=5.0.0
- fakeredis >=2.26.0 - In-memory Redis stub
- anyio >=4.6.0 - Async test helpers
- httpx >=0.27.0 - AsyncClient for test HTTP calls

**Testing (Frontend):**
- No test framework detected in `apps/web/package.json`

## Build / Dev Tools

**Frontend:**
- Vite 6.0.0 - Dev server and bundler (`apps/web/vite.config.ts`)
- @vitejs/plugin-react 4.3.4 - React fast refresh
- @tailwindcss/vite 4.0.0 - Tailwind CSS Vite plugin
- @tanstack/router-plugin 1.95.0 - Route tree generation
- vite-tsconfig-paths 5.1.4 - TypeScript path alias (`@/*` → `./src/*`)
- @biomejs/biome 1.9.4 - Unified linter + formatter (replaces ESLint + Prettier)

**Backend:**
- ruff >=0.8.0 - Python linter + formatter (configured in `apps/api/pyproject.toml`)
- mypy >=1.13.0 - Static type checking (strict mode)
- pre-commit >=4.0.0 + detect-secrets >=1.5.0 - Pre-commit hooks + secret scanning
- hatchling - Build backend (`[build-system]` in `apps/api/pyproject.toml`)

**Infrastructure / CI:**
- Docker multi-stage build (`apps/api/Dockerfile`) — Python 3.12-slim-bookworm, uv 0.6.13
- Docker Compose (`apps/api/docker-compose.yml`) — PostgreSQL 16, Redis 7, Mailpit
- Production overlay: `apps/api/docker-compose.prod.yml`

## Key Dependencies

**Critical:**
- `langchain-litellm` / `litellm` >=1.50.0 - Single LLM provider-switching abstraction; only `infra/llm/provider_factory.py` imports it
- `sqlalchemy[asyncio]` >=2.0.36 + `asyncpg` >=0.30.0 - Entire DB access layer is async
- `redis[hiredis]` >=5.2.0 - Required for JWT blacklist, rate limiting, OAuth state; app fails without it
- `python-jose[cryptography]` >=3.3.0 - JWT encode/decode (HS256)
- `passlib[argon2]` >=1.7.4 + `argon2-cffi` >=23.1.0 - Password hashing (Argon2 algorithm)
- `alembic` >=1.14.0 - Database schema migrations (`apps/api/alembic/`)

**Infrastructure:**
- `slowapi` >=0.1.9 - Redis-backed rate limiting, per-user/per-IP (`apps/api/src/main.py`)
- `structlog` >=24.4.0 - JSON structured logging with correlation ID (`apps/api/src/core/logging.py`)
- `sse-starlette` >=2.1.0 - Server-Sent Events for LLM token streaming
- `fastapi-mail` >=1.4.2 - Transactional email (`apps/api/src/domains/auth/email.py`)
- `tenacity` >=8.5.0 - Retry logic for transient LLM errors
- `httpx` >=0.27.0 - OAuth flows, async HTTP client
- `@faker-js/faker` 10.4.0 - Mock data generation (frontend dev)

## Configuration

**Environment:**
- Backend: all settings via env vars or `.env` file, loaded by pydantic-settings in `apps/api/src/core/config.py` (singleton via `lru_cache`)
- Example files: `apps/api/.env.example`, `apps/api/.env.prod.example`
- Frontend: Vite `VITE_*` prefix for public env vars; dev server on port 3000

**Required Backend Env Vars:**
- `SECRET_KEY` — app-level CSRF/signing key
- `JWT_SECRET_KEY` — JWT signing key (HS256)
- `DATABASE_URL` or `POSTGRES_*` variables
- `REDIS_URL` or `REDIS_*` variables
- LLM API key for active provider (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `AZURE_OPENAI_API_KEY`, or none for Ollama)
- `LLM_PROVIDER` — one of: `openai`, `anthropic`, `gemini`, `azure`, `ollama`

**Build:**
- `apps/web/vite.config.ts` - Vite config with TanStack Router plugin, Tailwind, tsconfig paths
- `apps/web/tsconfig.json` - TypeScript strict, ES2022, path alias `@/*` → `./src/*`
- `apps/api/pyproject.toml` - hatchling build backend, src layout
- `apps/api/Dockerfile` - Multi-stage: builder → runtime (slim, no dev tools)

## Platform Requirements

**Development:**
- Node.js >=18.17.0, pnpm >=10.0.0 (frontend)
- Python 3.12, uv package manager (backend)
- Docker + Docker Compose (PostgreSQL 16, Redis 7, Mailpit dev infra)

**Production:**
- Docker container: `python:3.12-slim-bookworm` + `libpq5`
- Pre-compiled `/runtime-venv` (no uv/pip in production image)
- Uvicorn as ASGI server; `WORKERS` env var controls worker count
- Deploy via `docker-compose.prod.yml` overlay

---

*Stack analysis: 2026-05-17*
