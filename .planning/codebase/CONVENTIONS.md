# Coding Conventions

**Analysis Date:** 2026-05-17

## Overview

This is a monorepo with two distinct codebases: a Python FastAPI backend (`apps/api/`) and a React TypeScript frontend (`web/`). Each has its own toolchain and conventions.

---

## Python API (`apps/api/`)

### Toolchain

**Linter + Formatter:** Ruff (`pyproject.toml`)
- Line length: 100
- Target: Python 3.12
- `quote-style = "double"`, `indent-style = "space"`, `line-ending = "lf"`
- Enabled rule sets: `E`, `W`, `F`, `I` (isort), `N` (pep8-naming), `UP`, `B`, `C4`, `SIM`, `ANN`, `S`, `T20`, `PT`, `RUF`

**Type Checker:** mypy (strict mode)
- `python_version = "3.12"`, `strict = true`
- Pydantic and SQLAlchemy plugins enabled

### Naming Patterns

**Files:**
- Modules use `snake_case`: `auth_service.py`, `auth_router.py`, `auth_schemas.py`
- One logical unit per file, named after its primary class/function

**Functions:**
- `snake_case` for all functions and methods
- Private helpers prefixed with `_`: `_normalize_display_name()`, `_app_error_to_http()`
- Async functions named same as sync (no `async_` prefix)

**Classes:**
- `PascalCase`: `AuthService`, `AuthRepository`, `SignupRequest`, `UserResponse`
- Pydantic schemas follow `<Entity><Role>` naming — documented in `apps/api/src/domains/auth/schemas/auth_schemas.py`:
  - `<Entity>Request` — inbound request body
  - `<Entity>Response` — outbound response (never includes secrets like `hashed_password`)
  - `<Entity>Create` — creation-specific request

**Constants:**
- `UPPER_SNAKE_CASE`: `EMAIL_VERIFY_EXPIRE_HOURS`, `ACCESS_TOKEN_EXPIRE_MINUTES`

**Enums:**
- `StrEnum` subclasses with lowercase values: `AppEnv.development`, `LLMProvider.openai`

### Module Structure

Every Python source file starts with:
```python
"""Module docstring describing purpose and usage.

Usage::

    from module import Thing
    thing = Thing()
"""

from __future__ import annotations
```

The `from __future__ import annotations` import is mandatory in all source files.

### Import Organization

1. `from __future__ import annotations` (always first)
2. Standard library imports
3. Third-party imports
4. Local application imports (from `core.*`, `domains.*`, `infra.*`)

Isort is enforced by Ruff (`"I"` ruleset).

**No circular imports** — domain modules only import from `core.*`; infra modules import from `core.*` only.

### Type Annotations

All functions require full type annotations (enforced by `ANN` Ruff ruleset). Return types are always explicit:
```python
def _normalize_display_name(display_name: str | None, email: str) -> str:
```

Use `from typing import Any` sparingly — only at framework/LLM boundaries (`ANN401` is ignored).

### Error Handling

**Pattern:** Domain services raise `AppError` subclasses; routers convert them to `HTTPException`.

```python
# In service layer (apps/api/src/domains/auth/service/auth_service.py):
raise ConflictError("An account with email '...' already exists.")

# In router layer (apps/api/src/domains/auth/router/auth_router.py):
def _app_error_to_http(exc: AppError) -> HTTPException:
    headers = None
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}
    return HTTPException(status_code=exc.status_code, detail=exc.message, headers=headers)
```

**Exception hierarchy** (`apps/api/src/core/exceptions.py`):
- `AppError(Exception)` — base, carries `message` and `status_code`
- `NotFoundError(AppError)` → 404
- `ConflictError(AppError)` → 409
- `UnauthorizedError(AppError)` → 401
- `ForbiddenError(AppError)` → 403

**Global exception handlers** registered in `apps/api/src/core/exceptions.py`:
- `HTTPException` → JSON with `detail` field
- `RequestValidationError` → 422 with structured errors (Pydantic ctx errors sanitized)
- `Exception` → 500 with safe message `"Internal server error."`

All error responses include `X-Correlation-ID` header when set.

### Logging

**Framework:** `structlog` (`apps/api/src/core/logging.py`)

```python
import structlog
logger = structlog.get_logger(__name__)

# Usage in services/routers:
logger.warning("http_exception", status_code=exc.status_code, detail=exc.detail)
logger.exception("unhandled_exception", exc_type=type(exc).__name__)
```

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

```python
# Router-level dependency builder:
async def _get_service(
    session: AsyncSession = Depends(get_async_session),
    redis: Redis = Depends(get_redis_dep),
) -> AuthService:
    repo = AuthRepository(session)
    return AuthService(repo, redis)
```

Dependency functions are named `_get_<thing>` (private, underscore-prefixed).

---

## Web Frontend (`web/`)

### Toolchain

**Linter + Formatter:** Biome (`web/biome.json`)
- `indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 100`
- Quote style: `single`
- Trailing commas: `es5`
- Recommended rules enabled

**Type Checker:** TypeScript 5.8 (strict mode via `web/tsconfig.json`)
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Path alias: `@/*` maps to `./src/*`

### Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `LoginForm.tsx`, `SignupForm.tsx`
  - Exception: feature hook files use `kebab-case`: `use-auth-mutation.ts`
- Non-component modules: `kebab-case.ts` — `mock-auth-api.ts`, `auth.schema.ts`
- Stores: `<name>.store.ts` — `auth.store.ts`, `modal-store.ts`
- Schemas: `<name>.schema.ts` — `auth.schema.ts`
- Types: `<name>.types.ts` or `<name>.ts` inside `types/` directory

**Functions:**
- React components: `PascalCase` named function exports: `export function LoginForm()`
- Hooks: `camelCase` prefixed with `use`: `useLoginMutation`, `useAuthStore`
- Utilities: `camelCase`: `cn()`, `mockLogin()`

**Variables:**
- `camelCase` for all variables and object properties
- Constants: `UPPER_SNAKE_CASE` for exported path constants (e.g., `SAMPLE_SIGN_IN_PATH`)

**TypeScript Types/Interfaces:**
- `PascalCase`: `AuthUser`, `LoginInput`, `AuthState`
- Interfaces preferred over type aliases for object shapes
- `type` keyword used for union types and function signatures

### Import Organization

TanStack Router generates `src/routeTree.gen.ts` — do not edit manually.

```typescript
// Order (enforced by Biome organizeImports):
// 1. External packages
import { useMutation } from '@tanstack/react-query';
// 2. Internal aliases (@/...)
import { useAuthStore } from '@/features/auth/store/auth.store';
// 3. Relative imports
import type { LoginInput } from '../types/auth';
```

`type` imports are separated from value imports using `import type { ... }`.

### React Component Patterns

```typescript
// Named function export (not default):
export function LoginForm() {
  const { mutate, isPending, isError, error } = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (/* JSX */);
}
```

- Named exports, not default exports (enables refactor-safe imports)
- `react-hook-form` + `zodResolver` for all form validation
- Tailwind CSS classes via `cn()` utility (`clsx` + `tailwind-merge`)
- `motion/react` for animations

### State Management

**Client state:** Zustand stores in `src/features/<domain>/store/<name>.store.ts`

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ isAuthenticated: true, user }),
  clearUser: () => set({ isAuthenticated: false, user: null }),
}));
```

**Server state:** TanStack Query (`useMutation`, `useQuery`) in `src/features/<domain>/hooks/`

### Schema / Validation

Zod schemas defined in `src/features/<domain>/schema/<name>.schema.ts`:

```typescript
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

// Inferred types exported alongside schema:
export type LoginFormValues = z.infer<typeof loginSchema>;
```

### Error Handling (Frontend)

- Mutation errors displayed inline via `isError` + `error` from `useMutation`
- Toast notifications via `sonner` for success states
- No global error boundary pattern observed in feature code

### UI Components

Base UI components in `src/components/ui/` use `class-variance-authority` (CVA) for variant management:

```typescript
const buttonVariants = cva("...", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

Primitive components sourced from `@base-ui/react` and `@radix-ui/react-*`.

---

*Convention analysis: 2026-05-17*
