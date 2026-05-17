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

## Overview
## Python API (`apps/api/`)
### Toolchain
- Line length: 100
- Target: Python 3.12
- `quote-style = "double"`, `indent-style = "space"`, `line-ending = "lf"`
- Enabled rule sets: `E`, `W`, `F`, `I` (isort), `N` (pep8-naming), `UP`, `B`, `C4`, `SIM`, `ANN`, `S`, `T20`, `PT`, `RUF`
- `python_version = "3.12"`, `strict = true`
- Pydantic and SQLAlchemy plugins enabled
### Naming Patterns
- Modules use `snake_case`: `auth_service.py`, `auth_router.py`, `auth_schemas.py`
- One logical unit per file, named after its primary class/function
- `snake_case` for all functions and methods
- Private helpers prefixed with `_`: `_normalize_display_name()`, `_app_error_to_http()`
- Async functions named same as sync (no `async_` prefix)
- `PascalCase`: `AuthService`, `AuthRepository`, `SignupRequest`, `UserResponse`
- Pydantic schemas follow `<Entity><Role>` naming — documented in `apps/api/src/domains/auth/schemas/auth_schemas.py`:
- `UPPER_SNAKE_CASE`: `EMAIL_VERIFY_EXPIRE_HOURS`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `StrEnum` subclasses with lowercase values: `AppEnv.development`, `LLMProvider.openai`
### Module Structure
### Import Organization
### Type Annotations
### Error Handling
- `AppError(Exception)` — base, carries `message` and `status_code`
- `NotFoundError(AppError)` → 404
- `ConflictError(AppError)` → 409
- `UnauthorizedError(AppError)` → 401
- `ForbiddenError(AppError)` → 403
- `HTTPException` → JSON with `detail` field
- `RequestValidationError` → 422 with structured errors (Pydantic ctx errors sanitized)
- `Exception` → 500 with safe message `"Internal server error."`
### Logging
- `json` format in production/staging
- `console` format in local development
- Correlation IDs propagated via `structlog.contextvars`
- Never use `print()` — enforced by `T20` Ruff ruleset
### Comments and Docstrings
- All public modules have a module-level docstring with Usage examples
- Public classes and functions have docstrings
- Section separators use `# ------` comments for visual grouping within long files
- Inline comments explain non-obvious decisions, not what the code does
### Pydantic Models
- `from_attributes = True` for ORM-backed response models
- Use `field_validator` (Pydantic v2 API — no `@validator` from v1)
- Validators use `mode="before"` for normalization (e.g., email trimming/lowercasing)
### FastAPI Dependency Injection
## Web Frontend (`web/`)
### Toolchain
- `indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 100`
- Quote style: `single`
- Trailing commas: `es5`
- Recommended rules enabled
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Path alias: `@/*` maps to `./src/*`
### Naming Patterns
- React components: `PascalCase.tsx` — `LoginForm.tsx`, `SignupForm.tsx`
- Non-component modules: `kebab-case.ts` — `mock-auth-api.ts`, `auth.schema.ts`
- Stores: `<name>.store.ts` — `auth.store.ts`, `modal-store.ts`
- Schemas: `<name>.schema.ts` — `auth.schema.ts`
- Types: `<name>.types.ts` or `<name>.ts` inside `types/` directory
- React components: `PascalCase` named function exports: `export function LoginForm()`
- Hooks: `camelCase` prefixed with `use`: `useLoginMutation`, `useAuthStore`
- Utilities: `camelCase`: `cn()`, `mockLogin()`
- `camelCase` for all variables and object properties
- Constants: `UPPER_SNAKE_CASE` for exported path constants (e.g., `SAMPLE_SIGN_IN_PATH`)
- `PascalCase`: `AuthUser`, `LoginInput`, `AuthState`
- Interfaces preferred over type aliases for object shapes
- `type` keyword used for union types and function signatures
### Import Organization
### React Component Patterns
- Named exports, not default exports (enables refactor-safe imports)
- `react-hook-form` + `zodResolver` for all form validation
- Tailwind CSS classes via `cn()` utility (`clsx` + `tailwind-merge`)
- `motion/react` for animations
### State Management
### Schema / Validation
### Error Handling (Frontend)
- Mutation errors displayed inline via `isError` + `error` from `useMutation`
- Toast notifications via `sonner` for success states
- No global error boundary pattern observed in feature code
### UI Components
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| FastAPI app factory | App creation, middleware, router registration | `apps/api/src/main.py` |
| core/config | Pydantic settings, env-var loading, LLM provider config | `apps/api/src/core/config.py` |
| core/database | SQLAlchemy async engine, session factory, Base | `apps/api/src/core/database.py` |
| core/redis | Redis connection pool, JTI blacklist helpers | `apps/api/src/core/redis.py` |
| core/middleware | CorrelationIdMiddleware — X-Correlation-ID propagation | `apps/api/src/core/middleware.py` |
| core/exceptions | AppError hierarchy, global FastAPI exception handlers | `apps/api/src/core/exceptions.py` |
| domains/shared | DDD base types: Entity, AggregateRoot, ValueObject, DomainEvent | `apps/api/src/domains/shared/` |
| domains/auth/router | HTTP handlers for auth endpoints (signup, login, OAuth, etc.) | `apps/api/src/domains/auth/router/auth_router.py` |
| domains/auth/service | Auth business logic — no HTTP awareness, raises AppError | `apps/api/src/domains/auth/service/auth_service.py` |
| domains/auth/repository | All auth DB I/O via SQLAlchemy async session | `apps/api/src/domains/auth/repository/auth_repository.py` |
| domains/auth/security | JWT create/decode/blacklist, argon2 hashing, RBAC deps | `apps/api/src/domains/auth/security.py` |
| domains/chat/ports | LLMClientProtocol, AbstractLLMPort interfaces (hexagonal) | `apps/api/src/domains/chat/ports.py` |
| domains/chat/container | DI container: binds DefaultLLMClientFactory to interface | `apps/api/src/domains/chat/container.py` |
| domains/chat/service | Chat business logic; depends only on AbstractLLMPort | `apps/api/src/domains/chat/service/chat_service.py` |
| infra/llm/provider_factory | LangChain-LiteLLM adapter; only place that imports langchain_litellm | `apps/api/src/infra/llm/provider_factory.py` |
| web/main.tsx | React app entry point — mounts RouterProvider | `web/src/main.tsx` |
| web/routes/__root.tsx | Root route: wraps AppProviders, Toaster, Modals | `web/src/routes/__root.tsx` |
| web/providers/app-providers.tsx | QueryClientProvider (React Query) | `web/src/providers/app-providers.tsx` |
| web/features/auth | Auth feature: components, hooks (React Query mutations), Zustand store | `web/src/features/auth/` |
| web/stores/modal-store.ts | Global Zustand modal stack with devtools | `web/src/stores/modal-store.ts` |
| web/sample/ | Reference UI samples (dashboard, tasks, users, settings, chats) — not production code | `web/src/sample/` |
## Pattern Overview
- Backend domains (`auth`, `chat`) are isolated: they may import from `shared` but not from each other.
- Each backend domain follows a strict Router → Service → Repository layering; service has no HTTP imports.
- The LLM infrastructure is isolated in `infra/llm/`; chat domain depends only on the Protocol/ABC defined in `domains/chat/ports.py`.
- Frontend routing is file-based via TanStack Router; `routeTree.gen.ts` is auto-generated.
- The `web/src/sample/` subtree is a UI reference/demo section, not production application code.
## Layers
- Purpose: Validate requests, call service, serialize responses
- Location: `apps/api/src/domains/*/router/`
- Contains: FastAPI `APIRouter`, Pydantic request/response models, dependency factories
- Depends on: Service layer, core dependencies
- Used by: FastAPI application router registration in `main.py`
- Purpose: Business logic and orchestration; raises `AppError` subclasses, never `HTTPException`
- Location: `apps/api/src/domains/*/service/`
- Contains: Domain service classes (`AuthService`, `ChatService`)
- Depends on: Repository layer, core security/config utilities, domain ports
- Used by: Router layer via FastAPI `Depends`
- Purpose: All database I/O — no business logic
- Location: `apps/api/src/domains/*/repository/`
- Contains: Repository classes wrapping `AsyncSession` with typed query methods
- Depends on: SQLAlchemy models, core/database
- Used by: Service layer
- Purpose: External adapter implementations (LLM providers)
- Location: `apps/api/src/infra/`
- Contains: `provider_factory.py` — sole importer of `langchain_litellm`
- Depends on: `core/config`, `langchain_litellm`
- Used by: `domains/chat/llm_client.py` via DI container
- Purpose: Cross-cutting concerns shared by all domains
- Location: `apps/api/src/core/`
- Contains: config, database engine, redis client, middleware, exceptions, security base
- Depends on: Python stdlib, third-party libraries only (never domain code)
- Used by: All layers
- Purpose: File-based page components; map URLs to UI
- Location: `web/src/routes/`
- Contains: TanStack Router route files (`createFileRoute`)
- Depends on: Features, components, stores
- Purpose: Encapsulated vertical slices (auth only so far)
- Location: `web/src/features/`
- Contains: components, hooks (React Query), store (Zustand), types, schemas, lib
- Depends on: `web/src/lib/`, `web/src/components/`
- Purpose: Reusable UI primitives
- Location: `web/src/components/ui/` (shadcn/ui components), `web/src/components/layout/`
- Depends on: Nothing domain-specific
## Data Flow
### Backend: Auth Request Path
### Backend: Chat Completion Path
### Frontend: Auth Login Path
- Backend: Stateless per request. Redis holds JWT blacklist entries and OAuth CSRF state nonces.
- Frontend: Zustand for auth user state (`web/src/features/auth/store/auth.store.ts`) and modal stack (`web/src/stores/modal-store.ts`). React Query for server-state caching.
## Key Abstractions
- Purpose: Typed domain errors that carry HTTP status codes without importing FastAPI
- Examples: `ConflictError`, `UnauthorizedError`, `NotFoundError` in `apps/api/src/core/exceptions.py`
- Pattern: Service raises `AppError`; router catches and calls `_app_error_to_http()`
- Purpose: Hexagonal port — the chat domain's contract for any LLM provider
- Examples: `apps/api/src/domains/chat/ports.py`
- Pattern: Protocol for structural duck-typing; ABC for explicit first-party adapters
- Purpose: Foundation types for DDD — `Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`
- Examples: `apps/api/src/domains/shared/`
- Pattern: `shared` may not import `auth` or `chat`; both may import `shared`
- Purpose: Each file in `web/src/routes/` becomes a route; tree is auto-generated
- Examples: `web/src/routes/index.tsx`, `web/src/routes/auth/login.tsx`
- Pattern: `createFileRoute('/')({ component: ... })` — no manual route registration
## Entry Points
- Location: `apps/api/src/main.py`
- Triggers: `uvicorn` via `make dev` / `uv run python -m app` / Docker
- Responsibilities: Creates FastAPI app, registers middleware (CorrelationId, CORS, rate limiting), registers domain routers
- Location: `web/src/main.tsx`
- Triggers: Vite dev server (`npm run dev`) or static build (`npm run build`)
- Responsibilities: Mounts `<RouterProvider router={router} />` into `#root` DOM element
## Architectural Constraints
- **Threading:** Backend runs on asyncio event loop (single-threaded per worker). All I/O is async. `uvicorn --workers` for multiprocess prod scale.
- **Global state:** `app` module-level FastAPI instance in `apps/api/src/main.py`. `settings` singleton in `apps/api/src/core/config.py` (lru_cache). Zustand stores are module-level singletons in frontend.
- **Domain isolation:** `domains/auth` and `domains/chat` must not import each other. Both import from `domains/shared` and `core`. Enforced by code convention, not tooling.
- **LLM adapter isolation:** Only `apps/api/src/infra/llm/provider_factory.py` and `apps/api/src/domains/chat/llm_client.py` may import `langchain_litellm`. All other code goes through the Protocol/ABC in `ports.py`.
- **Frontend mock:** `web/src/features/auth/lib/mock-auth-api.ts` is used instead of real API calls. This is a known gap — the real API backend is not yet wired to the frontend.
## Anti-Patterns
### Raising HTTPException in the service layer
### Importing concrete LLM implementation outside the container
### Cross-domain imports between auth and chat
## Error Handling
- Backend service layer: raises `AppError` subclasses (`ConflictError`, `UnauthorizedError`, `NotFoundError`)
- Backend router layer: catches `AppError`, calls `_app_error_to_http()` to produce `HTTPException`
- Backend global handlers: registered via `register_exception_handlers(app)` in `apps/api/src/core/exceptions.py` — covers `HTTPException`, `RequestValidationError`, and bare `Exception` (500)
- All error responses include `X-Correlation-ID` header when available
## Cross-Cutting Concerns
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
