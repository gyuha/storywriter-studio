# Codebase Structure

**Analysis Date:** 2026-05-17

## Directory Layout

```
storywriter-studio/              # Monorepo root
├── apps/
│   ├── api/                     # FastAPI backend (Python 3.12)
│   │   ├── alembic/             # Database migration runner
│   │   │   └── versions/        # Migration scripts (0001_initial_schema.py)
│   │   ├── docs/                # API documentation assets
│   │   ├── scripts/             # Dev/ops helper scripts
│   │   ├── src/                 # Python package root (hatchling src layout)
│   │   │   ├── core/            # Cross-cutting concerns — never imports domain code
│   │   │   │   ├── config.py    # Settings singleton (pydantic-settings, @lru_cache)
│   │   │   │   ├── database.py  # Async SQLAlchemy engine + session factory + Base
│   │   │   │   ├── exceptions.py # AppError hierarchy + global exception handlers
│   │   │   │   ├── logging.py   # structlog configuration
│   │   │   │   ├── middleware.py # CorrelationIdMiddleware
│   │   │   │   └── redis.py     # Redis async pool + JWT blacklist helpers
│   │   │   ├── domains/         # Domain-Driven Design bounded contexts
│   │   │   │   ├── auth/        # Auth bounded context
│   │   │   │   │   ├── email.py         # Transactional email (fastapi-mail)
│   │   │   │   │   ├── security.py      # JWT encode/decode, password hash, auth deps
│   │   │   │   │   ├── models/          # SQLAlchemy ORM models (User, Role, RefreshToken, ...)
│   │   │   │   │   ├── oauth/           # OAuth2 provider flows (google.py, kakao.py, naver.py)
│   │   │   │   │   ├── repository/      # All DB I/O (AuthRepository)
│   │   │   │   │   ├── router/          # FastAPI APIRouter (auth_router.py)
│   │   │   │   │   ├── schemas/         # Pydantic request/response models
│   │   │   │   │   └── service/         # Business logic (auth_service.py)
│   │   │   │   ├── chat/        # Chat / LLM bounded context
│   │   │   │   │   ├── container.py     # DI container — binds factory to interface
│   │   │   │   │   ├── llm_client.py    # LLMClient wrapping ChatLiteLLM
│   │   │   │   │   ├── llm_factory.py   # DefaultLLMClientFactory
│   │   │   │   │   ├── ports.py         # LLMClientProtocol, AbstractLLMPort (interfaces)
│   │   │   │   │   ├── models/          # Chat ORM models
│   │   │   │   │   ├── repository/      # Chat DB I/O
│   │   │   │   │   ├── router/          # Chat APIRouter (REST + SSE)
│   │   │   │   │   ├── schemas/         # Pydantic schemas
│   │   │   │   │   └── service/         # Chat business logic
│   │   │   │   └── shared/      # Shared DDD primitives (used by all domains)
│   │   │   │       ├── base.py          # Entity, AggregateRoot, ValueObject
│   │   │   │       ├── events.py        # Domain events
│   │   │   │       └── types.py         # Shared value types
│   │   │   ├── infra/           # External adapters (infrastructure layer)
│   │   │   │   └── llm/
│   │   │   │       └── provider_factory.py  # ONLY file importing langchain_litellm
│   │   │   ├── main.py          # FastAPI app factory + lifespan + router registration
│   │   │   └── __main__.py      # Direct execution entry (python -m app)
│   │   ├── tests/               # pytest test suite
│   │   │   ├── conftest.py      # Shared fixtures (app, client, session, redis)
│   │   │   ├── auth/            # Auth domain tests
│   │   │   ├── chat/            # Chat domain tests
│   │   │   ├── infra/llm/       # LLM provider/factory tests
│   │   │   └── shared/          # Shared base type tests
│   │   ├── pyproject.toml       # Project metadata, deps, ruff/mypy config
│   │   ├── Dockerfile           # Multi-stage production image
│   │   └── docker-compose.yml   # PostgreSQL 16, Redis 7, Mailpit
│   │
│   └── web/                     # React 19 frontend (TypeScript 5.8)
│       ├── public/              # Static assets served as-is
│       └── src/
│           ├── components/      # Shared UI not tied to a feature
│           │   ├── ui/          # Radix/shadcn-style primitives (button, input, dialog, ...)
│           │   │   └── modal/   # Imperative modal system components
│           │   ├── layout/      # Page shells (auth-shell.tsx)
│           │   ├── dev/         # Dev-only tools (form-devtool.tsx)
│           │   └── theme-toggle.tsx
│           ├── features/        # Vertical feature slices
│           │   └── auth/        # Auth feature (currently the only production feature)
│           │       ├── components/  # login-form.tsx, signup-form.tsx
│           │       ├── hooks/       # use-auth-mutation.ts (React Query mutations)
│           │       ├── lib/         # mock-auth-api.ts (temporary mock — NOT production)
│           │       ├── schema/      # auth.schema.ts (zod validation schemas)
│           │       ├── store/       # auth.store.ts (Zustand slice)
│           │       └── types/       # auth.ts (TypeScript interfaces)
│           ├── hooks/           # Shared React hooks (use-mobile.ts, use-theme.ts)
│           ├── lib/             # Shared utilities
│           │   ├── router.ts    # TanStack Router instance (imports routeTree.gen.ts)
│           │   └── utils.ts     # cn() utility (clsx + tailwind-merge)
│           ├── providers/       # React context/provider wrappers
│           │   └── app-providers.tsx  # QueryClientProvider
│           ├── routes/          # TanStack Router file-based routes
│           │   ├── __root.tsx   # Root layout (AppProviders, Modals, Toaster)
│           │   ├── index.tsx    # Home page (/)
│           │   ├── auth/        # Production auth routes (/auth/login, /auth/signup)
│           │   ├── sample/      # Reference/demo routes (NOT production)
│           │   └── test/        # Dev test routes
│           ├── sample/          # Reference UI — implementation reference ONLY
│           │   ├── auth/        # Sample auth pages and tests
│           │   ├── users/       # Sample user management
│           │   ├── dashboard/   # Sample dashboard
│           │   ├── chats/       # Sample chat UI
│           │   ├── settings/    # Sample settings pages
│           │   ├── tasks/       # Sample task management with data-table
│           │   ├── layout/      # Sample admin shell
│           │   ├── errors/      # Sample error pages (401, 403, 404, 500, 503)
│           │   ├── help-center/ # Sample help center
│           │   └── i18n/        # i18n setup + Korean/English locale files
│           ├── stores/          # Global Zustand stores (cross-feature)
│           │   ├── modal-store.ts   # Imperative modal stack
│           │   └── modal.types.ts   # ModalProps type definitions
│           ├── styles/          # Global CSS (Tailwind base)
│           ├── main.tsx         # DOM mount + RouterProvider
│           ├── routeTree.gen.ts # AUTO-GENERATED by Vite plugin — do not edit
│           └── vite-env.d.ts    # Vite env type declarations
├── .planning/                   # GSD planning artifacts
│   ├── codebase/                # Codebase analysis documents (this file)
│   └── research/                # Research notes
└── CLAUDE.md                    # Project instructions for Claude
```

## Directory Purposes

**`apps/api/src/core/`:**
- Purpose: Cross-cutting concerns shared by all layers
- Rule: Never import from `domains/` or `infra/`
- Key files: `config.py` (settings), `database.py` (engine + Base), `exceptions.py` (AppError), `redis.py` (pool)

**`apps/api/src/domains/<name>/`:**
- Purpose: One directory per bounded context; each is self-contained
- Rule: `auth` and `chat` must not import each other; both may import `shared` and `core`
- Subdirs: `router/`, `service/`, `repository/`, `models/`, `schemas/`

**`apps/api/src/domains/shared/`:**
- Purpose: DDD vocabulary reusable across all bounded contexts
- Key files: `base.py` (Entity, AggregateRoot, ValueObject)

**`apps/api/src/infra/`:**
- Purpose: Concrete adapters for external libraries
- Rule: Only `infra/llm/provider_factory.py` imports `langchain_litellm`

**`apps/api/alembic/`:**
- Purpose: Database schema migration runner
- Generated: `versions/` files are generated by `alembic revision --autogenerate`
- Key: `versions/0001_initial_schema.py` — initial schema

**`apps/web/src/features/<name>/`:**
- Purpose: Vertical feature slice owning all code for one domain
- Structure: `components/`, `hooks/`, `lib/`, `schema/`, `store/`, `types/`
- Current production features: `auth` only

**`apps/web/src/components/ui/`:**
- Purpose: Shared design system primitives (Radix/shadcn-style)
- Usage: Used across features and routes; styled with Tailwind + `cn()`

**`apps/web/src/routes/`:**
- Purpose: TanStack Router file-based pages
- Rule: Never edit `routeTree.gen.ts` — it is auto-generated
- Production routes: `auth/` (login, signup), `index.tsx`
- Reference routes: `sample/` (not production code)

**`apps/web/src/sample/`:**
- Purpose: Reference UI components and pages — not production code
- Safe to use as implementation reference; do not import from production features

**`apps/web/src/stores/`:**
- Purpose: Global Zustand stores for cross-feature client state
- Add here when state is needed by more than one feature

## Key File Locations

**Entry Points:**
- `apps/api/src/main.py`: FastAPI app factory, `app = create_app()`
- `apps/api/src/__main__.py`: `python -m app` direct execution
- `apps/web/src/main.tsx`: React DOM mount

**Configuration:**
- `apps/api/src/core/config.py`: All backend settings, `get_settings()` dependency
- `apps/api/pyproject.toml`: Python deps, ruff/mypy config
- `apps/web/vite.config.ts`: Vite + TanStack Router plugin + Tailwind
- `apps/web/tsconfig.json`: TypeScript strict config, `@/*` path alias

**Core Logic:**
- `apps/api/src/domains/auth/service/auth_service.py`: All auth business logic
- `apps/api/src/domains/auth/security.py`: JWT creation/decode, password hashing, FastAPI auth deps
- `apps/api/src/domains/chat/ports.py`: LLM abstraction interfaces
- `apps/api/src/infra/llm/provider_factory.py`: LLM provider construction
- `apps/web/src/features/auth/store/auth.store.ts`: Auth session state
- `apps/web/src/stores/modal-store.ts`: Global modal stack
- `apps/web/src/lib/utils.ts`: `cn()` class merging utility

**Testing:**
- `apps/api/tests/conftest.py`: Shared pytest fixtures
- `apps/api/tests/auth/`: Auth unit and integration tests
- `apps/api/tests/chat/`: Chat + LLM mock tests
- `apps/web/src/sample/auth/*.test.ts`: Frontend auth component tests

**Auto-generated (do not edit):**
- `apps/web/src/routeTree.gen.ts`: TanStack Router route tree

## Naming Conventions

**Backend files:**
- Modules: `snake_case` — `auth_service.py`, `auth_router.py`, `auth_repository.py`
- One module per layer component per domain: `<domain>_<layer>.py`

**Backend Python:**
- Classes: `PascalCase` — `AuthService`, `SignupRequest`, `UserResponse`
- Constants: `UPPER_SNAKE_CASE` — `ACCESS_TOKEN_EXPIRE_MINUTES`
- Pydantic schemas: `<Entity><Role>` — `SignupRequest`, `TokenResponse`, `UserResponse`
- Private helpers: prefix `_` — `_normalize_display_name()`

**Frontend files:**
- React components: `PascalCase.tsx` — `LoginForm.tsx` (but kebab-case filenames: `login-form.tsx`)
- Non-component modules: `kebab-case.ts` — `mock-auth-api.ts`, `auth.schema.ts`
- Stores: `<name>.store.ts` — `auth.store.ts`, `modal-store.ts`
- Schemas: `<name>.schema.ts` — `auth.schema.ts`
- Hooks: `use-<name>.ts` — `use-auth-mutation.ts`, `use-mobile.ts`
- Types: `<name>.ts` — `auth.ts`

**Frontend exports:**
- Named exports only — no default exports (except where framework requires, e.g. route `component`)

## Where to Add New Code

**New backend domain (e.g., `novel`):**
```
apps/api/src/domains/novel/
  router/novel_router.py    # APIRouter, Pydantic schemas import
  service/novel_service.py  # Business logic; raises AppError
  repository/novel_repository.py  # All DB I/O via AsyncSession
  models/novel_models.py    # SQLAlchemy ORM (extends core.database.Base)
  schemas/novel_schemas.py  # Pydantic request/response models
```
Register in `apps/api/src/main.py` inside `_register_routers()`.

**New backend database migration:**
```bash
cd apps/api && uv run alembic revision --autogenerate -m "description"
```
File lands in `apps/api/alembic/versions/`.

**New frontend feature (e.g., `novel`):**
```
apps/web/src/features/novel/
  components/   # React components
  hooks/        # use-<name>-mutation.ts, use-<name>-query.ts
  store/        # novel.store.ts (Zustand slice)
  schema/       # novel.schema.ts (zod)
  types/        # novel.ts (TypeScript interfaces)
  lib/          # API client functions (NOT mock — real API calls)
```

**New frontend page route:**
- Create `apps/web/src/routes/<path>.tsx` with `createFileRoute('/<path>')({ component: ... })`
- The Vite plugin auto-regenerates `apps/web/src/routeTree.gen.ts`

**New shared UI component:**
- Add to `apps/web/src/components/ui/<name>.tsx`
- Follow existing Radix/shadcn pattern with `cn()` for class merging

**New global cross-feature state:**
- Add Zustand store to `apps/web/src/stores/<name>-store.ts`
- Feature-local state: `apps/web/src/features/<name>/store/<name>.store.ts`

**New shared utility:**
- Shared helpers: `apps/web/src/lib/utils.ts` (if small) or new `apps/web/src/lib/<name>.ts`

## Special Directories

**`apps/web/src/sample/`:**
- Purpose: Reference UI components — not production code
- Generated: No — hand-written reference implementations
- Committed: Yes
- Usage: Safe to read and copy patterns from; do NOT import into production features

**`apps/web/src/routeTree.gen.ts`:**
- Purpose: Auto-generated TanStack Router route tree
- Generated: Yes — by `@tanstack/router-plugin` on every dev/build
- Committed: Yes (required for TypeScript)
- Rule: Never edit manually

**`apps/api/alembic/`:**
- Purpose: Alembic migration runner and version scripts
- Generated: `versions/` files are auto-generated by `alembic revision --autogenerate`
- Committed: Yes

**`apps/api/src/__pycache__/` and `apps/api/.venv/`:**
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-17*
