# Codebase Structure

**Analysis Date:** 2026-05-17

## Directory Layout

```
storywriter-studio/          # Monorepo root
├── apps/
│   └── api/                 # Python FastAPI backend
│       ├── alembic/         # DB migration engine
│       │   └── versions/    # Migration scripts (SQL history)
│       ├── docs/            # API documentation
│       ├── scripts/         # Dev/ops helper scripts
│       ├── src/             # Application source root (Python path root)
│       │   ├── main.py      # FastAPI app factory + entry point
│       │   ├── __main__.py  # `python -m app` runner
│       │   ├── core/        # Cross-cutting infrastructure (never imports domain)
│       │   │   ├── config.py      # Pydantic settings, env loading
│       │   │   ├── database.py    # SQLAlchemy engine, session factory, Base
│       │   │   ├── redis.py       # Redis pool + JTI blacklist helpers
│       │   │   ├── middleware.py  # CorrelationIdMiddleware
│       │   │   ├── exceptions.py  # AppError hierarchy + exception handlers
│       │   │   └── logging.py     # structlog configuration
│       │   ├── domains/     # Bounded contexts (business logic)
│       │   │   ├── shared/  # DDD shared kernel — Entity, AggregateRoot, etc.
│       │   │   ├── auth/    # Auth bounded context
│       │   │   │   ├── models/      # SQLAlchemy ORM models
│       │   │   │   ├── schemas/     # Pydantic request/response schemas
│       │   │   │   ├── router/      # FastAPI routers (HTTP layer)
│       │   │   │   ├── service/     # Business logic (no HTTP)
│       │   │   │   ├── repository/  # DB I/O (SQLAlchemy queries)
│       │   │   │   ├── oauth/       # OAuth2 provider adapters (google, kakao, naver)
│       │   │   │   ├── security.py  # JWT, password hashing, RBAC deps
│       │   │   │   └── email.py     # Email delivery service
│       │   │   └── chat/    # Chat/LLM bounded context
│       │   │       ├── models/      # SQLAlchemy ORM models
│       │   │       ├── schemas/     # Pydantic request/response schemas
│       │   │       ├── router/      # FastAPI routers (HTTP layer)
│       │   │       ├── service/     # Business logic (no HTTP)
│       │   │       ├── repository/  # DB I/O
│       │   │       ├── ports.py     # LLMClientProtocol, AbstractLLMPort (interfaces)
│       │   │       ├── llm_client.py # Concrete LLM client + factory
│       │   │       └── container.py  # DI wiring: interface → concrete
│       │   └── infra/       # Infrastructure adapters (third-party library wrappers)
│       │       └── llm/
│       │           └── provider_factory.py  # LangChain-LiteLLM adapter
│       ├── tests/           # pytest test suite
│       │   ├── auth/        # Auth domain tests
│       │   ├── chat/        # Chat domain tests
│       │   ├── infra/llm/   # LLM infra tests
│       │   └── shared/      # Shared kernel tests
│       ├── pyproject.toml   # Python project metadata + dependencies
│       ├── uv.lock          # Lockfile
│       ├── Dockerfile       # Container image
│       ├── docker-compose.yml       # Dev infra (Postgres, Redis, Mailpit)
│       ├── docker-compose.prod.yml  # Prod compose
│       └── alembic.ini      # Alembic config
│
└── apps/web/                     # React/Vite frontend
    ├── public/              # Static assets served as-is
    ├── src/
    │   ├── main.tsx         # React app entry — mounts RouterProvider
    │   ├── vite-env.d.ts    # Vite type declarations
    │   ├── routeTree.gen.ts # Auto-generated route tree (do not edit)
    │   ├── routes/          # TanStack Router file-based pages
    │   │   ├── __root.tsx   # Root layout: AppProviders, Toaster, Modals
    │   │   ├── index.tsx    # / — home page
    │   │   ├── auth/        # /auth/* — login, signup pages
    │   │   ├── sample/      # /sample/* — UI demo pages (not production)
    │   │   └── test/        # /test/* — test/debug routes
    │   ├── features/        # Vertical feature slices
    │   │   └── auth/        # Auth feature
    │   │       ├── components/  # login-form.tsx, signup-form.tsx
    │   │       ├── hooks/       # use-auth-mutation.ts (React Query)
    │   │       ├── store/       # auth.store.ts (Zustand)
    │   │       ├── lib/         # mock-auth-api.ts (placeholder for real API)
    │   │       ├── schema/      # Zod validation schemas
    │   │       └── types/       # TypeScript types for auth
    │   ├── components/      # Shared UI components
    │   │   ├── ui/          # shadcn/ui primitives (button, input, dialog, etc.)
    │   │   ├── layout/      # Layout shells (auth-shell.tsx)
    │   │   └── dev/         # Dev-only debug components
    │   ├── hooks/           # Shared React hooks (use-mobile, use-theme)
    │   ├── lib/             # Shared utilities
    │   │   ├── router.ts    # TanStack Router instance
    │   │   └── utils.ts     # General utilities (cn, etc.)
    │   ├── providers/       # React context providers
    │   │   └── app-providers.tsx  # QueryClientProvider wrapper
    │   ├── stores/          # Global Zustand stores
    │   │   ├── modal-store.ts     # Modal stack store
    │   │   └── modal.types.ts     # Modal type definitions
    │   ├── styles/          # Global CSS
    │   └── sample/          # UI demo/reference code (mirrors sample routes)
    │       ├── apps/        # Apps demo feature
    │       ├── auth/        # Auth demo
    │       ├── chats/       # Chat UI demo
    │       ├── dashboard/   # Dashboard demo
    │       ├── errors/      # Error page demos
    │       ├── help-center/ # Help center demo
    │       ├── i18n/        # i18n locale files (en, ko)
    │       ├── layout/      # SampleAdminShell layout
    │       ├── settings/    # Settings demo
    │       ├── tasks/       # Tasks data table demo
    │       └── users/       # Users data table demo
    ├── vite.config.ts       # Vite build config
    ├── tsconfig.json        # TypeScript config with `@/*` path alias
    └── package.json         # Frontend dependencies
```

## Directory Purposes

**`apps/api/src/core/`:**
- Purpose: Infrastructure primitives shared by all domains — never imports domain code
- Contains: Config (Pydantic settings), DB engine, Redis pool, middleware, exception hierarchy, logging setup
- Key files: `config.py`, `database.py`, `redis.py`, `exceptions.py`, `middleware.py`

**`apps/api/src/domains/`:**
- Purpose: Business logic organized as bounded contexts
- Contains: `auth`, `chat`, and `shared` sub-packages, each with router/service/repository/models/schemas layers
- Key constraint: `auth` and `chat` must not import each other; both may import `shared`

**`apps/api/src/domains/shared/`:**
- Purpose: DDD shared kernel — foundation types available to all domains
- Contains: `Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`, type aliases (`UserId`, `ConversationId`)
- Key files: `__init__.py` (public exports), `base.py`, `events.py`, `types.py`

**`apps/api/src/infra/`:**
- Purpose: Third-party library adapters that live outside domain boundaries
- Contains: `llm/provider_factory.py` — the only file that imports `langchain_litellm`
- Key rule: Domain code depends on ports (`domains/chat/ports.py`), not on this layer directly

**`apps/api/alembic/versions/`:**
- Purpose: DB schema migration history
- Contains: Auto-generated Alembic migration scripts
- Generated: Yes (by `alembic revision --autogenerate`)
- Committed: Yes (tracks schema history)

**`apps/web/src/routes/`:**
- Purpose: File-based routing — each `.tsx` file becomes a URL route
- Contains: TanStack Router page components using `createFileRoute`
- Key rule: `routeTree.gen.ts` is auto-generated by Vite plugin — never edit manually

**`apps/web/src/features/`:**
- Purpose: Feature-sliced vertical slices; each feature owns its components, hooks, store, types
- Contains: `auth/` only for now; future features (chat, story, etc.) go here
- Key pattern: Features export from their own index or are imported directly by routes

**`apps/web/src/components/ui/`:**
- Purpose: shadcn/ui component library primitives
- Contains: Pre-built accessible components (button, input, dialog, select, table, etc.)
- Key rule: These are copied/generated UI primitives — edit with care; match shadcn/ui patterns

**`apps/web/src/sample/`:**
- Purpose: UI reference/demo section — not production application code
- Contains: Full demo features (dashboard, tasks table, users, chats, settings)
- Key note: This is a template reference, not part of the real storywriter application features

## Key File Locations

**Backend Entry Points:**
- `apps/api/src/main.py`: FastAPI app factory, lifespan, middleware registration, router registration
- `apps/api/src/__main__.py`: `python -m app` runner (sets uvicorn host/port from settings)

**Frontend Entry Points:**
- `apps/web/src/main.tsx`: React DOM mount, RouterProvider
- `apps/web/src/routes/__root.tsx`: Root layout, AppProviders, Toaster, Modals

**Configuration:**
- `apps/api/src/core/config.py`: All backend settings (DB, Redis, JWT, LLM, OAuth, mail)
- `apps/web/vite.config.ts`: Vite plugins (TanStack Router, React, Tailwind, tsconfig-paths)
- `apps/web/tsconfig.json`: TypeScript config with `@/*` → `./src/*` alias

**Database:**
- `apps/api/src/core/database.py`: SQLAlchemy async engine + `Base` declarative class
- `apps/api/alembic/`: Migration engine configuration and version history
- `apps/api/alembic/versions/0001_initial_schema.py`: First (and currently only) migration

**Auth Core:**
- `apps/api/src/domains/auth/security.py`: JWT create/decode/blacklist, argon2 hashing, `get_current_user`, `require_permission`
- `apps/api/src/domains/auth/router/auth_router.py`: All auth HTTP endpoints
- `apps/api/src/domains/auth/service/auth_service.py`: `AuthService` class — all auth business logic

**LLM Integration:**
- `apps/api/src/domains/chat/ports.py`: `LLMClientProtocol`, `AbstractLLMPort` (interfaces)
- `apps/api/src/domains/chat/container.py`: DI wiring (`get_llm_factory`, `get_chat_service`)
- `apps/api/src/infra/llm/provider_factory.py`: `make_chat_litellm()` — concrete LangChain-LiteLLM adapter

**Frontend Auth:**
- `apps/web/src/features/auth/store/auth.store.ts`: Zustand auth state (`useAuthStore`)
- `apps/web/src/features/auth/hooks/use-auth-mutation.ts`: React Query mutations for login/signup
- `apps/web/src/features/auth/lib/mock-auth-api.ts`: Mock API functions (replace with real HTTP client)

**Global State:**
- `apps/web/src/stores/modal-store.ts`: Zustand modal stack (`useModal`)
- `apps/web/src/providers/app-providers.tsx`: `QueryClient` singleton + `QueryClientProvider`

## Naming Conventions

**Backend Files:**
- Domain modules: `{domain}_{layer}.py` — e.g., `auth_router.py`, `auth_service.py`, `auth_repository.py`
- Core modules: plain name — e.g., `config.py`, `database.py`, `middleware.py`
- Snake_case throughout for Python files, functions, variables

**Frontend Files:**
- Route files: `{route-name}.tsx` using kebab-case — e.g., `login.tsx`, `signup.tsx`
- Feature files: `{name}.{type}.ts(x)` — e.g., `auth.store.ts`, `use-auth-mutation.ts`
- Component files: kebab-case — e.g., `login-form.tsx`, `auth-shell.tsx`
- UI primitives: kebab-case matching shadcn/ui conventions — e.g., `button.tsx`, `alert-dialog.tsx`
- Hooks: `use-{name}.ts` prefix

**Backend Classes:**
- Services: `{Domain}Service` — e.g., `AuthService`, `ChatService`
- Repositories: `{Domain}Repository` — e.g., `AuthRepository`, `ChatRepository`
- Routers: module-level `router = APIRouter(prefix="/{domain}")`
- Models: PascalCase matching entity names — e.g., `User`, `RefreshToken`, `OAuthAccount`

## Where to Add New Code

**New Backend Domain (e.g., `stories`):**
1. Create `apps/api/src/domains/stories/` with subdirs: `models/`, `schemas/`, `router/`, `service/`, `repository/`
2. Add ORM models inheriting from `core.database.Base`
3. Create Alembic migration: `alembic revision --autogenerate -m "add_stories"`
4. Register router in `apps/api/src/main.py` → `_register_routers()` with `prefix="/api/v1"`

**New Backend API Endpoint in Existing Domain:**
- Router: `apps/api/src/domains/{domain}/router/{domain}_router.py`
- Service method: `apps/api/src/domains/{domain}/service/{domain}_service.py`
- Repository method: `apps/api/src/domains/{domain}/repository/{domain}_repository.py`
- Request/response schema: `apps/api/src/domains/{domain}/schemas/{domain}_schemas.py`

**New Frontend Feature:**
- Create `apps/web/src/features/{feature}/` with: `components/`, `hooks/`, `store/`, `types/`, `lib/`
- Add route file: `apps/web/src/routes/{feature}/index.tsx` using `createFileRoute`
- Route tree regenerates automatically on next Vite dev server start

**New Frontend Page (Route):**
- Add `apps/web/src/routes/{path}.tsx` using `createFileRoute('/{path}')({ component: ... })`
- `routeTree.gen.ts` is regenerated automatically — do not edit it

**Shared UI Components:**
- Generic primitives: `apps/web/src/components/ui/{name}.tsx`
- Layout wrappers: `apps/web/src/components/layout/{name}.tsx`
- Shared hooks: `apps/web/src/hooks/use-{name}.ts`

**Global State:**
- App-wide Zustand stores: `apps/web/src/stores/{name}-store.ts`
- Feature-scoped state stays inside `apps/web/src/features/{feature}/store/`

**Utilities:**
- Frontend shared helpers: `apps/web/src/lib/utils.ts`
- Backend shared helpers: Add to `apps/api/src/core/` only if truly cross-domain; otherwise keep inside the domain

## Special Directories

**`apps/api/alembic/`:**
- Purpose: Alembic migration runner + version history
- Generated: Migration scripts are generated by `alembic revision --autogenerate`
- Committed: Yes — schema history must be committed

**`apps/web/src/routeTree.gen.ts`:**
- Purpose: TanStack Router auto-generated route tree
- Generated: Yes — by the `@tanstack/router-plugin/vite` Vite plugin on dev/build
- Committed: Yes (needed for type checking), but never manually edited

**`apps/web/src/sample/`:**
- Purpose: UI reference demos bundled with the app for developer reference
- Generated: No — hand-authored demo code
- Production code: No — treat as template/scaffold reference, not business logic

**`apps/api/src/domains/*/\_\_pycache\_\_/`:**
- Purpose: Python bytecode cache
- Generated: Yes
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-05-17*
