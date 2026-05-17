# Coding Conventions

**Analysis Date:** 2026-05-17

## Naming Patterns

### Python API (`apps/api/src/`)

**Files/Modules:**
- `snake_case` throughout: `auth_service.py`, `auth_router.py`, `auth_repository.py`, `auth_models.py`, `auth_schemas.py`
- Domain sub-directory mirrors role: `router/`, `service/`, `repository/`, `models/`, `schemas/`

**Classes:**
- `PascalCase`: `AuthService`, `AuthRepository`, `SignupRequest`, `UserResponse`
- Pydantic schemas follow `<Entity><Role>` pattern: `SignupRequest`, `LoginRequest`, `TokenResponse`, `UserResponse`
- ORM models: `User`, `RefreshToken`, `EmailVerification`, `PasswordReset`, `OAuthAccount`
- Exception classes: `AppError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`

**Functions/Methods:**
- `snake_case` for all functions and methods
- Private helpers prefixed with `_`: `_normalize_display_name()`, `_refresh_token_reuse_state()`, `_app_error_to_http()`
- No `async_` prefix on async functions — same name as sync equivalent

**Constants:**
- `UPPER_SNAKE_CASE`: `EMAIL_VERIFY_EXPIRE_HOURS`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `JWT_ALGORITHM`
- `StrEnum` subclasses with lowercase values (e.g., `LLMProvider.openai`, `LLMProvider.ollama`)

### TypeScript Frontend (`apps/web/src/`)

**Files:**
- React components: `PascalCase.tsx` — `LoginForm.tsx`, `SignupForm.tsx` (but actual files are `login-form.tsx`, `signup-form.tsx`)
- Non-component modules: `kebab-case.ts` — `mock-auth-api.ts`, `auth.schema.ts`, `use-auth-mutation.ts`
- Stores: `<name>.store.ts` — `auth.store.ts`, `modal-store.ts`
- Schemas: `<name>.schema.ts` — `auth.schema.ts`
- Types: `<name>.ts` — `auth.ts`

**Identifiers:**
- React components: `PascalCase` — `LoginForm`, `SignupForm`, `AppProviders`, `RootComponent`
- Hooks: `camelCase` prefixed `use` — `useLoginMutation`, `useSignupMutation`, `useAuthStore`
- Constants: `UPPER_SNAKE_CASE` — `SAMPLE_SIGN_IN_PATH`, `SAMPLE_LOGIN_PATH`
- Interfaces: `PascalCase`, optionally `I`-prefixed for store state shapes — `IModalState`, `IModalStore`

**Exports:**
- Named exports only — no default exports for components or hooks
- Exception: Zustand store hooks may be default exported (`export default useModal`)
- Route files export `Route` as a named const: `export const Route = createFileRoute(...)`

## Code Style

### Python
- **Formatter/Linter:** ruff (v0.8+)
- Line length: 100 characters
- Quote style: double quotes (`"`)
- Indent style: spaces (4)
- Line ending: LF
- All source files begin with `from __future__ import annotations`
- Module-level docstring required on all files

**Ruff rules enforced:**
- `E`, `W` — pycodestyle
- `F` — Pyflakes
- `I` — isort import ordering
- `N` — pep8-naming
- `UP` — pyupgrade (Python 3.12 idioms)
- `B` — flake8-bugbear
- `C4` — flake8-comprehensions
- `SIM` — flake8-simplify
- `ANN` — type annotations required (except `ANN401` dynamic kwargs)
- `S` — bandit security checks
- `T20` — no `print()` (use structlog)
- `PT` — pytest-style rules
- `RUF` — ruff-specific rules

**mypy:** strict mode, `python_version = "3.12"`, Pydantic + SQLAlchemy plugins enabled

### TypeScript
- **Formatter/Linter:** Biome (v1.9.4)
- Indent style: spaces (2)
- Line width: 100
- Quote style: single quotes
- Trailing commas: `es5`
- TypeScript strict mode enabled
- Path alias: `@/*` → `./src/*`

## Import Organization

### Python
Order enforced by ruff isort (`I` ruleset):
1. `from __future__ import annotations` (always first)
2. stdlib (`import secrets`, `import uuid`, `from datetime import ...`)
3. Third-party (`import structlog`, `from redis.asyncio import Redis`)
4. Internal (`from core.exceptions import ...`, `from domains.auth.service import ...`)

Example from `apps/api/src/domains/auth/service/auth_service.py`:
```python
from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from redis.asyncio import Redis
from sqlalchemy.exc import IntegrityError

from core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from domains.auth.email import AuthEmailSender, get_auth_email_service
```

### TypeScript
- Biome organizeImports enabled — auto-sorted on save/format
- External packages before internal `@/*` imports
- Named imports preferred

## Error Handling

### Python (Service Layer)
- Raise `AppError` subclasses — **never** `HTTPException` in service code
- Available subclasses (`apps/api/src/core/exceptions.py`):
  - `AppError(message, status_code=400)` — base class
  - `NotFoundError(resource)` → 404, message: `"{resource} not found."`
  - `ConflictError(message)` → 409
  - `UnauthorizedError(message)` → 401
  - `ForbiddenError(message)` → 403
- Router layer converts via `_app_error_to_http(exc: AppError) -> HTTPException`
- Global handlers in `apps/api/src/core/exceptions.py` catch `HTTPException`, `RequestValidationError`, and bare `Exception`

### Python (Router Layer)
- Catch `AppError` and call `_app_error_to_http()` — do not re-raise as `HTTPException` directly
- 401 responses automatically include `WWW-Authenticate: Bearer` header

### Frontend (Mutations)
- Use `isError` + `error` from `useMutation` — display inline in component
- Success feedback via `sonner` toast: `toast.success('...')`
- Error display inline (not toast) for form submission errors:
```tsx
{isError && (
  <Alert variant="destructive">
    <AlertDescription>
      {error instanceof Error ? error.message : '오류가 발생했습니다'}
    </AlertDescription>
  </Alert>
)}
```

## Logging

**Framework:** `structlog` (backend only — `apps/api/src/`)

**Patterns:**
- Module-level logger: `logger = structlog.get_logger(__name__)`
- Keyword arguments for structured context: `logger.warning("event_name", key=value, ...)`
- Event names use `snake_case` strings: `"http_exception"`, `"refresh_token_reuse_detected"`, `"validation_error"`
- **Never use `print()`** — enforced by `T20` ruff rule
- JSON format in production, console format in development (configured via `ENVIRONMENT` env var)
- Correlation ID middleware in `apps/api/src/core/middleware.py`

## Comments

**Python:**
- Module-level docstring on every file describing purpose and usage example
- Section separators: `# ---------------------------------------------------------------------------\n# Section Name\n# ---------------------------------------------------------------------------`
- Inline comments explain *why*, not *what*: `# use jti as id for simplicity`
- Constants documented with `#:` RST-style docstring

**TypeScript:**
- Inline comments for non-obvious logic only
- No JSDoc required on component functions

## Function Design

### Python
- Services raise errors, never return `None` for "not found" states (use `NotFoundError`)
- Repository methods return `None` for missing rows — service layer decides error handling
- Private helpers at module level (not inside classes) for logic reuse
- Async functions for all I/O operations (`async def`)
- Sync helper functions for pure logic (`def`)

### TypeScript
- React components: function declarations with named exports
- Hooks: function declarations, `use` prefix
- Zod schemas defined at module level, types inferred with `z.infer<typeof schema>`

## Module Design

### Python
- Each domain subdirectory has an `__init__.py` that re-exports key symbols
- Example: `from domains.auth.repository import AuthRepository, normalize_email`
- Domain isolation enforced: `auth` and `chat` must not import each other
- Both may import `domains/shared` and `core`

### TypeScript
- No barrel `index.ts` files observed — import directly from module files
- Feature-scoped organization: `features/auth/components/`, `features/auth/hooks/`, etc.

## Pydantic Models (Python)

- `from_attributes = True` set in `model_config` for all ORM-backed response models
- `field_validator` (Pydantic v2 API) for normalization, with `mode="before"` for pre-validation transforms
- Normalize user-provided strings in validators (trim whitespace, lowercase email)
- Request schemas perform validation AND normalization in the same `@field_validator`

Example from `apps/api/src/domains/auth/schemas/auth_schemas.py`:
```python
class SignupRequest(BaseModel):
    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip().lower()
        return v
```

## React Component Patterns

- Forms: `react-hook-form` + `zodResolver` — always, no exceptions
- Tailwind classes composed via `cn()` utility (`clsx` + `tailwind-merge`), from `@/lib/utils`
- Animations: `motion/react` (`AnimatePresence`, `motion.div`)
- CVA (`class-variance-authority`) for component variants (see `apps/web/src/components/ui/button.tsx`)
- UI primitives: `@base-ui/react` (accessible, unstyled) + `radix-ui` headless components

## State Management (Frontend)

- **Client state:** Zustand (`apps/web/src/stores/`, `apps/web/src/features/*/store/`)
  - Use `devtools` middleware for stores with complex state (e.g., `modal-store.ts`)
  - Immer used for immutable updates within zustand slices
- **Server state:** React Query (`useMutation`, `useQuery`) for all API calls
- **Forbidden:** React Context for shared feature state — use a Zustand slice instead

---

*Convention analysis: 2026-05-17*
