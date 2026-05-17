<!-- refreshed: 2026-05-17 -->
# Architecture

**Analysis Date:** 2026-05-17

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / Client                              │
│            React 19 SPA  (`apps/web/src/`)                          │
│   Routes → Features → Components → Stores (Zustand) + Queries (RQ)  │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTP / SSE  (currently: mock only)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                              │
│              `apps/api/src/main.py`  (ASGI, uvicorn)                │
│  CorrelationIdMiddleware → CORS → RateLimiter → Routers             │
├──────────────────────┬──────────────────────┬───────────────────────┤
│   domains/auth/      │   domains/chat/      │   domains/shared/     │
│  router → service   │  router → service    │  base.py  events.py   │
│  → repository        │  → ports (Protocol)  │                       │
│  → models            │  → repository        │                       │
│  + oauth/ + email.py │  → models            │                       │
└──────────┬───────────┴─────────┬────────────┴───────────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────┐   ┌─────────────────────────────────────────────┐
│  core/           │   │  infra/llm/                                  │
│  config.py       │   │  provider_factory.py  ← langchain_litellm    │
│  database.py     │   │  (only file that imports langchain_litellm)  │
│  redis.py        │   └──────────────────────────────────────────────┘
│  exceptions.py   │
│  middleware.py   │
│  logging.py      │
└──────────┬───────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Infrastructure                                                   │
│  PostgreSQL 16 (SQLAlchemy asyncpg)  |  Redis 7  |  Mailpit SMTP │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| FastAPI app factory | Middleware registration, router wiring, lifespan | `apps/api/src/main.py` |
| Settings singleton | All env/config loading via pydantic-settings | `apps/api/src/core/config.py` |
| Async DB engine + session | SQLAlchemy async engine, `get_async_session` dep | `apps/api/src/core/database.py` |
| Redis pool + JWT blacklist | Redis client, JWT JTI blacklisting | `apps/api/src/core/redis.py` |
| AppError hierarchy + handlers | Domain error types, global exception registration | `apps/api/src/core/exceptions.py` |
| Correlation-ID middleware | Request tracing header injection + structlog binding | `apps/api/src/core/middleware.py` |
| Auth router | HTTP endpoints for signup/login/OAuth/JWT | `apps/api/src/domains/auth/router/auth_router.py` |
| Auth service | Business logic; raises AppError, never HTTPException | `apps/api/src/domains/auth/service/auth_service.py` |
| Auth repository | All DB I/O for auth domain | `apps/api/src/domains/auth/repository/auth_repository.py` |
| Auth ORM models | User, Role, RefreshToken, OAuthAccount tables | `apps/api/src/domains/auth/models/auth_models.py` |
| OAuth providers | Google, Kakao, Naver OAuth2 flows | `apps/api/src/domains/auth/oauth/` |
| Chat router | REST + SSE endpoints for LLM completions | `apps/api/src/domains/chat/router/chat_router.py` |
| Chat service | LLM orchestration via AbstractLLMPort only | `apps/api/src/domains/chat/service/chat_service.py` |
| Chat ports | LLMClientProtocol, AbstractLLMPort (interfaces) | `apps/api/src/domains/chat/ports.py` |
| Chat DI container | Binds DefaultLLMClientFactory to LLMClientFactoryProtocol | `apps/api/src/domains/chat/container.py` |
| LLM provider factory | Single file importing langchain_litellm; builds ChatLiteLLM | `apps/api/src/infra/llm/provider_factory.py` |
| DDD base types | Entity, AggregateRoot, ValueObject | `apps/api/src/domains/shared/base.py` |
| React entry | DOM mount, RouterProvider | `apps/web/src/main.tsx` |
| Root route | AppProviders, Modals, Toaster, DevTools wrapper | `apps/web/src/routes/__root.tsx` |
| AppProviders | QueryClientProvider (React Query) | `apps/web/src/providers/app-providers.tsx` |
| Router config | TanStack Router instance from auto-generated routeTree | `apps/web/src/lib/router.ts` |
| Auth store | Zustand slice: isAuthenticated, user, setUser/clearUser | `apps/web/src/features/auth/store/auth.store.ts` |
| Modal store | Zustand stack for imperative modal management | `apps/web/src/stores/modal-store.ts` |
| Mock auth API | Simulated login/signup (no real API calls yet) | `apps/web/src/features/auth/lib/mock-auth-api.ts` |

## Pattern Overview

**Overall:** Monorepo with two fully independent apps. Backend uses Domain-Driven Design (DDD) with Hexagonal Architecture (Ports & Adapters). Frontend uses feature-sliced structure with file-based routing.

**Key Characteristics:**
- Backend domains are isolated bounded contexts — `auth` and `chat` must not import each other
- Both domains may import `domains/shared` and `core`; `core` never imports domain code
- LLM provider is isolated behind a Protocol/ABC so only `infra/llm/provider_factory.py` touches `langchain_litellm`
- Frontend auth is currently mocked — `mock-auth-api.ts` replaces real API calls; the FastAPI backend is not yet connected
- Frontend state split: Zustand for client/UI state, React Query for server state

## Layers

**Backend: Router Layer**
- Purpose: HTTP boundary — validates requests, calls service, serializes responses
- Location: `apps/api/src/domains/*/router/`
- Contains: FastAPI `APIRouter`, Pydantic schema imports, `Depends()` wiring
- Depends on: Service layer, Pydantic schemas, `core.exceptions.AppError`
- Used by: FastAPI app via `include_router()`
- **Rule:** Catches `AppError` subclasses and converts to `HTTPException`; never raises `HTTPException` itself

**Backend: Service Layer**
- Purpose: Business logic — all orchestration, invariant enforcement
- Location: `apps/api/src/domains/*/service/`
- Contains: Domain operations, calls to repository and external ports
- Depends on: Repository, core exceptions, domain models
- Used by: Router layer
- **Rule:** Raises `AppError` subclasses only, never `HTTPException`

**Backend: Repository Layer**
- Purpose: All database I/O — no business logic
- Location: `apps/api/src/domains/*/repository/`
- Contains: SQLAlchemy async queries, transaction context managers
- Depends on: SQLAlchemy `AsyncSession`, domain ORM models
- Used by: Service layer

**Backend: Models Layer**
- Purpose: SQLAlchemy ORM table definitions
- Location: `apps/api/src/domains/*/models/`
- Contains: ORM classes extending `core.database.Base`
- Depends on: `core.database.Base`, SQLAlchemy column types
- Used by: Repository layer, Alembic migrations

**Backend: Core Layer**
- Purpose: Cross-cutting concerns — never imports domain code
- Location: `apps/api/src/core/`
- Contains: config, database, redis, exceptions, middleware, logging
- Depends on: External libraries only
- Used by: All layers

**Backend: Infra Layer**
- Purpose: External adapters for third-party libraries
- Location: `apps/api/src/infra/`
- Contains: LLM provider factory (only `langchain_litellm` import point)
- Depends on: `core.config`, `langchain_litellm`
- Used by: `domains/chat/container.py` via lazy import

**Frontend: Routes Layer**
- Purpose: File-based page definitions for TanStack Router
- Location: `apps/web/src/routes/`
- Contains: `createFileRoute()` components; `routeTree.gen.ts` is auto-generated
- **Rule:** Never edit `apps/web/src/routeTree.gen.ts` — it is generated by the Vite plugin

**Frontend: Features Layer**
- Purpose: Domain-specific feature slices (components, hooks, store, types, schema, lib)
- Location: `apps/web/src/features/`
- Contains: Complete vertical slice per feature — currently only `auth`

**Frontend: Components Layer**
- Purpose: Shared UI primitives not tied to a feature
- Location: `apps/web/src/components/`
- Contains: `ui/` (Radix/shadcn-style primitives), `layout/` (shells), `dev/` (dev tools)

**Frontend: Stores Layer**
- Purpose: Global client state not owned by a feature
- Location: `apps/web/src/stores/`
- Contains: `modal-store.ts` (imperative modal stack)

## Data Flow

### Backend: Auth Request Path (Login)

1. HTTP POST `/api/v1/auth/login` received (`apps/api/src/main.py`)
2. `CorrelationIdMiddleware` injects `X-Correlation-ID` and binds structlog context
3. `SlowAPI` rate-limiter checks Redis per user/IP
4. `auth_router.py` validates `LoginRequest` schema via Pydantic
5. Router calls `AuthService.login()` (`apps/api/src/domains/auth/service/auth_service.py`)
6. Service calls `AuthRepository.get_user_by_email()` (`apps/api/src/domains/auth/repository/auth_repository.py`)
7. Service verifies password with `passlib[argon2]`, creates JWT pair, stores refresh token in DB, blacklists old JTI in Redis
8. Router serializes `TokenResponse` and returns HTTP 200

### Backend: Chat Streaming Path (SSE)

1. HTTP POST `/api/v1/chat/stream` (`apps/api/src/domains/chat/router/chat_router.py`)
2. FastAPI resolves `get_chat_service(factory=get_llm_factory())` via DI (`apps/api/src/domains/chat/container.py`)
3. `get_llm_factory()` lazy-imports and returns `DefaultLLMClientFactory` from `apps/api/src/infra/llm/provider_factory.py`
4. Factory produces `LLMClient` wrapping `ChatLiteLLM` (configured from `LLM_PROVIDER` env var)
5. `ChatService.stream()` calls `AbstractLLMPort.stream()` → async generator yields text chunks
6. Router wraps generator in `EventSourceResponse` (sse_starlette) → SSE stream to client

### Frontend: Auth Mutation Path (current — mocked)

1. User submits login form (`apps/web/src/features/auth/components/login-form.tsx`)
2. `useLoginMutation()` hook calls `mockLogin()` (`apps/web/src/features/auth/lib/mock-auth-api.ts`)
3. On success: `useAuthStore.setUser()` updates Zustand state (`apps/web/src/features/auth/store/auth.store.ts`)
4. `useNavigate()` redirects to `/`

**State Management:**
- **Zustand** — client/UI state: auth session (`auth.store.ts`), modal stack (`modal-store.ts`)
- **React Query** — server state, async mutations (wired in `app-providers.tsx`; used in `use-auth-mutation.ts`)
- **No React Context** for shared feature state — use Zustand slices instead

## Key Abstractions

**AppError Hierarchy:**
- Purpose: Domain error types that routers convert to HTTP responses
- Examples: `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `ForbiddenError` (403)
- Pattern: Service raises → router catches via `_app_error_to_http()` or try/except
- File: `apps/api/src/core/exceptions.py`

**LLMClientProtocol / AbstractLLMPort:**
- Purpose: Interface contract for LLM clients; chat domain depends only on this, never on `langchain_litellm`
- Pattern: Protocol (structural subtyping) for mocks/third-party; ABC for first-party adapters
- File: `apps/api/src/domains/chat/ports.py`

**DDD Base Types (Entity, AggregateRoot, ValueObject):**
- Purpose: Domain vocabulary for bounded context modeling
- Pattern: Pure Python dataclasses; do NOT extend SQLAlchemy `Base`
- File: `apps/api/src/domains/shared/base.py`

**Modal Store Stack:**
- Purpose: Imperative modal management — push/pop without prop drilling
- Pattern: Zustand store with array stack; `openModal`, `closeModal`, `closeAllModal`
- File: `apps/web/src/stores/modal-store.ts`

## Entry Points

**Backend ASGI app:**
- Location: `apps/api/src/main.py` — `app: FastAPI = create_app()`
- Triggers: `uvicorn src.main:app` or `python -m app`
- Responsibilities: Middleware chain, router registration, Redis warm-up, lifespan

**Frontend SPA:**
- Location: `apps/web/src/main.tsx`
- Triggers: Vite dev server or production build
- Responsibilities: DOM mount, `RouterProvider` with auto-generated `routeTree`

**Root Route:**
- Location: `apps/web/src/routes/__root.tsx`
- Triggers: Every page navigation
- Responsibilities: Wraps all routes in `AppProviders`, mounts `Modals` and `Toaster`

## Architectural Constraints

- **Threading:** FastAPI/uvicorn uses async event loop (asyncio); all DB calls are async via `asyncpg`; blocking I/O is forbidden in route handlers
- **Global state (backend):** `settings` singleton via `@lru_cache` in `apps/api/src/core/config.py`; Redis pool in `apps/api/src/core/redis.py`
- **Global state (frontend):** Zustand stores are module-level singletons — `useAuthStore` in `apps/web/src/features/auth/store/auth.store.ts`, `useModal` in `apps/web/src/stores/modal-store.ts`
- **Circular imports:** `auth` and `chat` domains must not import each other; `core` must not import any domain
- **Route tree:** `apps/web/src/routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin` — never edit manually
- **LLM isolation:** Only `apps/api/src/infra/llm/provider_factory.py` may import `langchain_litellm`

## Anti-Patterns

### Raising HTTPException in Service Layer

**What happens:** Service code imports and raises `HTTPException` directly
**Why it's wrong:** Couples domain logic to HTTP transport; makes services untestable without HTTP context; violates DDD layer separation
**Do this instead:** Raise `AppError` subclasses (`NotFoundError`, `ConflictError`, etc.) from `apps/api/src/core/exceptions.py`; let the router catch and convert

### Importing langchain_litellm Outside infra/

**What happens:** Chat service or router imports `langchain_litellm.ChatLiteLLM` directly
**Why it's wrong:** Binds the domain to a specific LLM library; prevents provider swapping; breaks hexagonal architecture boundary
**Do this instead:** Depend on `LLMClientProtocol` or `AbstractLLMPort` from `apps/api/src/domains/chat/ports.py`; let `apps/api/src/domains/chat/container.py` wire the concrete factory

### Using React Context for Shared Feature State

**What happens:** Feature state (auth session, modals, etc.) passed through React Context
**Why it's wrong:** Context causes unnecessary re-renders; harder to access outside components; Zustand is already the established pattern
**Do this instead:** Create a Zustand slice in `apps/web/src/features/<name>/store/` or `apps/web/src/stores/` for cross-feature state

### Editing routeTree.gen.ts

**What happens:** Developer manually edits `apps/web/src/routeTree.gen.ts`
**Why it's wrong:** The file is fully regenerated by Vite on every build; manual changes are lost
**Do this instead:** Create route files in `apps/web/src/routes/` with `createFileRoute('/<path>')({ component: ... })`; the plugin auto-regenerates the tree

## Error Handling

**Strategy:** Domain errors expressed as typed Python exceptions; converted to HTTP responses at the router boundary only.

**Patterns:**
- Service layer: `raise NotFoundError("User")`, `raise ConflictError("Email already in use")`
- Router layer: `try: ... except AppError as e: raise HTTPException(status_code=e.status_code, detail=e.message)`
- Global catch-all: `_unhandled_exception_handler` in `apps/api/src/core/exceptions.py` returns 500 with safe message
- Frontend: `isError` + `error` from `useMutation`; success feedback via `sonner` toast

## Cross-Cutting Concerns

**Logging:** `structlog` with JSON format in production, console in development; correlation ID bound per request via `CorrelationIdMiddleware`; `print()` banned by ruff `T20` rule
**Validation:** Pydantic v2 for all request/response schemas; `zod` + `react-hook-form` + `zodResolver` for all frontend forms
**Authentication:** JWT (HS256) via `python-jose`; argon2 password hashing via `passlib`; refresh token rotation with Redis JTI blacklist; OAuth2 (Google, Kakao, Naver) in `apps/api/src/domains/auth/oauth/`
**Rate limiting:** `slowapi` with Redis backend; key function prefers authenticated user ID over remote IP (`apps/api/src/main.py`)
**i18n:** `react-i18next` with Korean as primary language; sample locale files in `apps/web/src/sample/i18n/`

---

*Architecture analysis: 2026-05-17*
