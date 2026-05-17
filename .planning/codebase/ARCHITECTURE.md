<!-- refreshed: 2026-05-17 -->
# Architecture

**Analysis Date:** 2026-05-17

## System Overview

This is a monorepo with two independent applications: a Python FastAPI backend (`apps/api`) and a React/Vite frontend (`web`). They are currently not connected — the web app uses mock API functions for auth rather than calling the real backend.

```text
┌─────────────────────────────────────────────────────────────────┐
│                    web/  (React + Vite)                          │
│  Routes → Features → Stores (Zustand) + Queries (React Query)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (currently mocked — no real HTTP)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 apps/api/  (FastAPI + Python)                    │
├─────────────────┬───────────────────────────┬───────────────────┤
│  Router Layer   │   Service Layer            │  Repository Layer │
│  `src/domains/  │   `src/domains/*/service/` │  `src/domains/*/  │
│  */router/`     │                            │  repository/`     │
└────────┬────────┴──────────────┬─────────────┴────────┬──────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌──────────────────────┐  ┌──────────────────┐
│  core/          │   │  infra/llm/           │  │  PostgreSQL      │
│  (config, db,   │   │  (LangChain+LiteLLM   │  │  Redis           │
│  redis, auth    │   │  provider_factory)    │  │  (via SQLAlchemy │
│  security,      │   └──────────────────────┘  │  async engine)   │
│  middleware)    │                              └──────────────────┘
└─────────────────┘
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

**Backend:** Domain-Driven Design modular monolith with hexagonal architecture (Ports & Adapters) for the LLM integration.

**Frontend:** Feature-sliced architecture with TanStack Router (file-based routing), React Query for server state, Zustand for client state.

**Key Characteristics:**
- Backend domains (`auth`, `chat`) are isolated: they may import from `shared` but not from each other.
- Each backend domain follows a strict Router → Service → Repository layering; service has no HTTP imports.
- The LLM infrastructure is isolated in `infra/llm/`; chat domain depends only on the Protocol/ABC defined in `domains/chat/ports.py`.
- Frontend routing is file-based via TanStack Router; `routeTree.gen.ts` is auto-generated.
- The `web/src/sample/` subtree is a UI reference/demo section, not production application code.

## Layers

**HTTP Layer (Backend):**
- Purpose: Validate requests, call service, serialize responses
- Location: `apps/api/src/domains/*/router/`
- Contains: FastAPI `APIRouter`, Pydantic request/response models, dependency factories
- Depends on: Service layer, core dependencies
- Used by: FastAPI application router registration in `main.py`

**Service Layer (Backend):**
- Purpose: Business logic and orchestration; raises `AppError` subclasses, never `HTTPException`
- Location: `apps/api/src/domains/*/service/`
- Contains: Domain service classes (`AuthService`, `ChatService`)
- Depends on: Repository layer, core security/config utilities, domain ports
- Used by: Router layer via FastAPI `Depends`

**Repository Layer (Backend):**
- Purpose: All database I/O — no business logic
- Location: `apps/api/src/domains/*/repository/`
- Contains: Repository classes wrapping `AsyncSession` with typed query methods
- Depends on: SQLAlchemy models, core/database
- Used by: Service layer

**Infrastructure Layer (Backend):**
- Purpose: External adapter implementations (LLM providers)
- Location: `apps/api/src/infra/`
- Contains: `provider_factory.py` — sole importer of `langchain_litellm`
- Depends on: `core/config`, `langchain_litellm`
- Used by: `domains/chat/llm_client.py` via DI container

**Core (Backend):**
- Purpose: Cross-cutting concerns shared by all domains
- Location: `apps/api/src/core/`
- Contains: config, database engine, redis client, middleware, exceptions, security base
- Depends on: Python stdlib, third-party libraries only (never domain code)
- Used by: All layers

**Routes (Frontend):**
- Purpose: File-based page components; map URLs to UI
- Location: `web/src/routes/`
- Contains: TanStack Router route files (`createFileRoute`)
- Depends on: Features, components, stores

**Features (Frontend):**
- Purpose: Encapsulated vertical slices (auth only so far)
- Location: `web/src/features/`
- Contains: components, hooks (React Query), store (Zustand), types, schemas, lib
- Depends on: `web/src/lib/`, `web/src/components/`

**Shared Components (Frontend):**
- Purpose: Reusable UI primitives
- Location: `web/src/components/ui/` (shadcn/ui components), `web/src/components/layout/`
- Depends on: Nothing domain-specific

## Data Flow

### Backend: Auth Request Path

1. HTTP request arrives → `CorrelationIdMiddleware` injects `X-Correlation-ID` (`apps/api/src/core/middleware.py`)
2. FastAPI validates request body via Pydantic schema (`apps/api/src/domains/auth/schemas/auth_schemas.py`)
3. Router dependency `_get_service()` builds `AuthService(repo, redis, mail_service)` (`apps/api/src/domains/auth/router/auth_router.py:66`)
4. Router handler calls `service.login()` / `service.signup_and_send_email()` etc.
5. `AuthService` calls `AuthRepository` for DB reads/writes (`apps/api/src/domains/auth/service/auth_service.py`)
6. `AuthRepository` executes SQLAlchemy async queries against PostgreSQL
7. `AuthService` raises `AppError` subclass on failure; router converts to `HTTPException` via `_app_error_to_http()`
8. Pydantic response model serializes result to JSON

### Backend: Chat Completion Path

1. Request → auth check via `get_current_user` dependency
2. `get_chat_service(factory=get_llm_factory())` builds `ChatService` with injected LLM client (`apps/api/src/domains/chat/container.py`)
3. `ChatService.complete()` / `ChatService.stream()` calls `AbstractLLMPort.invoke()` / `.stream()`
4. `DefaultLLMClientFactory.get_llm_client()` → `LLMClient` wrapping `ChatLiteLLM` from `infra/llm/provider_factory.py`
5. For streaming: `EventSourceResponse` yields SSE chunks to client

### Frontend: Auth Login Path

1. User submits login form (`web/src/features/auth/components/login-form.tsx`)
2. `useLoginMutation()` triggers React Query mutation (`web/src/features/auth/hooks/use-auth-mutation.ts`)
3. `mockLogin()` is called — **currently uses mock, not real API** (`web/src/features/auth/lib/mock-auth-api.ts`)
4. On success: `useAuthStore.setUser()` writes to Zustand store; TanStack Router navigates to `/`

**State Management:**
- Backend: Stateless per request. Redis holds JWT blacklist entries and OAuth CSRF state nonces.
- Frontend: Zustand for auth user state (`web/src/features/auth/store/auth.store.ts`) and modal stack (`web/src/stores/modal-store.ts`). React Query for server-state caching.

## Key Abstractions

**AppError hierarchy (Backend):**
- Purpose: Typed domain errors that carry HTTP status codes without importing FastAPI
- Examples: `ConflictError`, `UnauthorizedError`, `NotFoundError` in `apps/api/src/core/exceptions.py`
- Pattern: Service raises `AppError`; router catches and calls `_app_error_to_http()`

**LLMClientProtocol / AbstractLLMPort (Backend):**
- Purpose: Hexagonal port — the chat domain's contract for any LLM provider
- Examples: `apps/api/src/domains/chat/ports.py`
- Pattern: Protocol for structural duck-typing; ABC for explicit first-party adapters

**Domain shared kernel (Backend):**
- Purpose: Foundation types for DDD — `Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`
- Examples: `apps/api/src/domains/shared/`
- Pattern: `shared` may not import `auth` or `chat`; both may import `shared`

**TanStack Router file-based routes (Frontend):**
- Purpose: Each file in `web/src/routes/` becomes a route; tree is auto-generated
- Examples: `web/src/routes/index.tsx`, `web/src/routes/auth/login.tsx`
- Pattern: `createFileRoute('/')({ component: ... })` — no manual route registration

## Entry Points

**Backend:**
- Location: `apps/api/src/main.py`
- Triggers: `uvicorn` via `make dev` / `uv run python -m app` / Docker
- Responsibilities: Creates FastAPI app, registers middleware (CorrelationId, CORS, rate limiting), registers domain routers

**Frontend:**
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

**What happens:** If service code raises `fastapi.HTTPException` directly, the service imports HTTP concerns.
**Why it's wrong:** Breaks layer separation; makes service untestable without FastAPI context.
**Do this instead:** Raise `AppError` subclasses from `core/exceptions.py`; let the router call `_app_error_to_http()` at `apps/api/src/domains/auth/router/auth_router.py:76`.

### Importing concrete LLM implementation outside the container

**What happens:** Chat domain code importing `DefaultLLMClientFactory` or `langchain_litellm` directly.
**Why it's wrong:** Defeats the hexagonal architecture; provider changes ripple into domain code.
**Do this instead:** Always depend on `LLMClientProtocol` or `AbstractLLMPort` from `apps/api/src/domains/chat/ports.py`; wire concrete impl only in `apps/api/src/domains/chat/container.py`.

### Cross-domain imports between auth and chat

**What happens:** `domains/chat` importing from `domains/auth` (or vice versa) for shared types.
**Why it's wrong:** Creates tight coupling between bounded contexts.
**Do this instead:** Place shared types in `apps/api/src/domains/shared/` (e.g., `UserId`, `ConversationId`).

## Error Handling

**Strategy:** Layered error translation — domain raises typed errors, boundary layer translates to HTTP.

**Patterns:**
- Backend service layer: raises `AppError` subclasses (`ConflictError`, `UnauthorizedError`, `NotFoundError`)
- Backend router layer: catches `AppError`, calls `_app_error_to_http()` to produce `HTTPException`
- Backend global handlers: registered via `register_exception_handlers(app)` in `apps/api/src/core/exceptions.py` — covers `HTTPException`, `RequestValidationError`, and bare `Exception` (500)
- All error responses include `X-Correlation-ID` header when available

## Cross-Cutting Concerns

**Logging:** structlog with JSON or console format (configured by `LOG_FORMAT` env var). Correlation ID bound to context-var store per request by `CorrelationIdMiddleware`. All modules use `structlog.get_logger(__name__)`.

**Validation:** Pydantic v2 on backend (request/response schemas in `domains/*/schemas/`). Zod on frontend (`web/src/features/auth/schema/`).

**Authentication:** Bearer JWT (access token 15 min, refresh token 7 days). Redis JTI blacklist for logout. RBAC via `require_permission(key)` FastAPI dependency factory in `apps/api/src/domains/auth/security.py`. OAuth2 supported for Google, Kakao, Naver.

---

*Architecture analysis: 2026-05-17*
