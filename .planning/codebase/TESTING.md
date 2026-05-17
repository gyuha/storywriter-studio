# Testing Patterns

**Analysis Date:** 2026-05-17

## Overview

Two separate test suites: Python pytest for the FastAPI backend (`apps/api/tests/`) and TypeScript script-style tests for the web frontend (`web/src/`). They are structurally and philosophically different.

---

## Python API Tests (`apps/api/`)

### Test Framework

**Runner:** pytest 8.3+
**Config:** `apps/api/pyproject.toml` (`[tool.pytest.ini_options]`)
**Async support:** `pytest-asyncio` 0.24+ with `asyncio_mode = "auto"` — all async test functions run automatically without `@pytest.mark.asyncio`

**Run Commands:**
```bash
cd apps/api
uv run pytest                          # Run all tests with coverage
uv run pytest tests/auth/              # Run auth domain tests only
uv run pytest -k "test_signup"         # Run tests matching name pattern
uv run pytest --co -q                  # List collected tests (dry run)
```

**Coverage:** `pytest-cov` with `--cov-fail-under=70`
- Report: `term-missing` + HTML at `htmlcov/`
- Branch coverage enabled
- Source: `src/`

### Test File Organization

**Location:** Separate `tests/` directory mirroring the `src/` domain structure

```
apps/api/
├── src/
│   ├── domains/auth/
│   └── domains/chat/
└── tests/
    ├── conftest.py          ← root fixtures (autouse cache clearing)
    ├── auth/
    │   ├── conftest.py      ← auth-domain fixtures
    │   └── test_*.py
    ├── chat/
    │   ├── conftest.py      ← chat-domain fixtures
    │   ├── _mocks.py        ← shared mock classes (not fixtures)
    │   └── test_*.py
    └── infra/
        └── llm/
            └── test_*.py
```

**Naming:** `test_<what_is_being_tested>.py` — e.g., `test_signup_route.py`, `test_auth_flows.py`, `test_llm_client.py`

### Test Structure

Tests grouped by domain operation in classes:

```python
class TestSignup:
    """signup() — user creation, password hashing, email verification token issuance."""

    async def test_signup_creates_user(
        self,
        auth_service: AuthService,
        fake_repo: Any,
    ) -> None:
        user, raw_token = await auth_service.signup(_EMAIL, _PASSWORD, "Alice")

        assert user.email == _EMAIL.lower()
        assert user.display_name == "Alice"
        assert user.is_verified is False
```

Test function names are full sentences describing behavior:
- `test_signup_delegates_validated_payload_to_auth_service`
- `test_signup_rejects_invalid_payload_before_service_call`
- `test_signup_persists_normalized_identity_fields`

**Module-level test constants** for repeated test data:
```python
_EMAIL = "alice@example.com"
_PASSWORD = "Password1!"
```

### Fixtures (`conftest.py`)

**Root `conftest.py`** (`apps/api/tests/conftest.py`):
- `settings_cache_clear` — `autouse=True`, clears `get_settings()` LRU cache before/after every test to prevent env var leakage

**Auth conftest** (`apps/api/tests/auth/conftest.py`):
- `fake_redis` — in-memory async Redis stub (`FakeRedis` class)
- `fake_repo` — in-memory `FakeAuthRepository` implementing full `AuthRepository` interface
- `auth_service` — `AuthService` wired to `fake_repo` + `fake_redis`

**Chat conftest** (`apps/api/tests/chat/conftest.py`):
- `env_openai` / `env_ollama` — `monkeypatch` env var fixtures for provider switching
- `openai_llm_settings` / `ollama_llm_settings` — pure `LLMSettings` instances (no env side effects)
- `patched_chat_litellm` — patches `ChatLiteLLM` with `MagicMock` for call-arg assertions
- `fake_chat_litellm_openai` / `fake_chat_litellm_ollama` — patches with `FakeChatLiteLLM`
- `llm_client_openai` / `llm_client_ollama` — real `LLMClient` with patched `ChatLiteLLM`
- `mock_llm_client` — `MagicMock` for call-count / call-arg assertions on `ChatService`
- `stub_llm_client` / `streaming_stub_llm_client` — pure Python stubs, zero patches
- `stub_chat_service` / `chat_service_openai` / `chat_service_ollama` — `ChatService` instances

### Mocking

**Philosophy:** Intercept at the lowest-level I/O boundary, test everything above with real implementations.

**Pattern 1: Hand-written Fake Classes** (preferred for domain logic)

Fakes implement the full interface of the dependency they replace:

```python
class FakeRedis:
    """Minimal async Redis stub for auth tests."""
    def __init__(self) -> None:
        self._store: dict[str, Any] = {}
        self.expirations: dict[str, int | None] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: Any, ex: int | None = None) -> None:
        self._store[key] = value
        self.expirations[key] = ex
```

Fakes also track call metadata for assertion:
```python
self.locked_refresh_jtis: list[str] = []
self.invalidated_session_user_ids: list[str] = []
```

**Pattern 2: `unittest.mock.patch`** (for third-party library boundaries)

Used to intercept `ChatLiteLLM` at the import location where it is used:

```python
with patch("infra.llm.provider_factory.ChatLiteLLM") as mock_cls:
    yield mock_cls
```

```python
with patch("infra.llm.provider_factory.ChatLiteLLM", return_value=fake_instance):
    yield fake_instance
```

**Pattern 3: `MagicMock` / `AsyncMock`** (for call-count/call-arg assertions)

```python
mock = MagicMock(spec=["ainvoke", "astream", "invoke", "stream"])
mock.ainvoke = AsyncMock(return_value=AIMessage(content=FAKE_RESPONSE_TEXT))

async def _astream(messages: Any, **kwargs: Any) -> AsyncIterator[str]:
    for token in FAKE_STREAM_TOKENS:
        yield token

mock.astream = _astream
```

**What to mock:**
- Database sessions and repositories
- Redis connections
- External LLM provider clients (`ChatLiteLLM`)
- Email delivery services
- OAuth HTTP calls

**What NOT to mock:**
- The service layer when testing route handlers (use `FastAPI.dependency_overrides` instead)
- Business logic in `AuthService` or `ChatService` when testing them

### HTTP / Route Tests

FastAPI route tests use `httpx.AsyncClient` with `ASGITransport`:

```python
@pytest.fixture
def app(signup_service: FakeSignupService) -> FastAPI:
    application = FastAPI()
    application.include_router(router, prefix="/api/v1")
    application.dependency_overrides[_get_service] = lambda: signup_service
    return application

async def test_signup_delegates_validated_payload_to_auth_service(
    app: FastAPI,
    signup_service: FakeSignupService,
) -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/v1/auth/signup",
            json={"email": "alice@example.com", "password": "Password1!", "display_name": "Alice"},
        )

    assert response.status_code == 201
    assert response.json()["user"]["email"] == "alice@example.com"
```

Use `FastAPI.dependency_overrides` to inject fakes — do NOT patch the service constructor.

### Parametrize

Used for error mapping and multi-case schema validation:

```python
@pytest.mark.parametrize(
    ("service_error", "expected_status", "expected_detail"),
    [
        (ConflictError("An account ..."), 409, "An account ..."),
        (AppError("Signup payload rejected"), 400, "Signup payload rejected"),
        (UnauthorizedError("Email verification required"), 401, "Email verification ..."),
    ],
)
async def test_signup_maps_application_service_errors_to_http_responses(
    app, signup_service, service_error, expected_status, expected_detail
) -> None:
    signup_service.error = service_error
    ...
    assert response.status_code == expected_status
```

### Pytest Markers

Defined in `pyproject.toml`:

| Marker | Meaning |
|--------|---------|
| `unit` | Pure unit test — no I/O |
| `integration` | Tests hitting DB / Redis |
| `e2e` | End-to-end against running server |

Currently only `unit` and `integration` are actively used. Most tests do not carry a marker (they default to running in all contexts).

### Environment Variable Isolation

Use `monkeypatch.setenv` + `settings_cache_clear` autouse fixture:

```python
def test_with_openai_env(monkeypatch, env_openai):
    from core.config import get_settings
    s = get_settings()
    assert s.llm_provider.value == "openai"
```

For full env isolation, use `patch.dict(os.environ, base_env, clear=True)`:

```python
def make_settings(**env_overrides: str) -> Settings:
    base_env = {"SECRET_KEY": "test-secret-key", "JWT_SECRET_KEY": "test-jwt-secret"}
    base_env.update(env_overrides)
    with patch.dict(os.environ, base_env, clear=True):
        get_settings.cache_clear()
        return Settings(_env_file=None)
```

### Test Helper Location

Shared mock classes NOT backed by `@pytest.fixture` live in `tests/<domain>/_mocks.py`:

- `apps/api/tests/chat/_mocks.py` — `FakeChatLiteLLM`, `StubLLMClient`, constants

This separates plain helper classes (importable by any module) from pytest fixture functions (only available via fixture injection).

### Coverage

- **Target:** 70% minimum (`--cov-fail-under=70`)
- **Excluded:** migrations, alembic, tests themselves
- **Branch coverage:** enabled
- **Report command:** `uv run pytest --cov=src --cov-report=html:htmlcov`

---

## Web Frontend Tests (`web/`)

### Framework

The web test files (`*.test.ts`) are **not standard Jest/Vitest tests**. No test runner is configured in `web/package.json`. These files are TypeScript modules that execute assertions as top-level `throw new Error(...)` calls — they run as plain Node scripts or are executed by the TypeScript compiler via `ts-node`/`tsx`.

**No `describe()` blocks, no `it()` blocks, no `expect()` calls.** Assertions use `throw new Error(message)` directly.

```typescript
const parsedValidValues = sampleSignInSchema.safeParse(validSignInValues);

if (!parsedValidValues.success) {
  throw new Error('Sign-in schema must accept a valid email and password.');
}
```

### What the Web Tests Cover

These tests are **schema validation tests** and **source code contract tests**. They do not test DOM rendering or component behavior.

**Schema validation tests** (e.g., `sign-in-page.test.ts`, `sign-up-page.test.ts`):
- Zod schema accepts valid input
- Schema rejects invalid input with expected error messages
- One validation message is shown at a time per field

**Source code contract tests** (e.g., `sign-in-page.test.ts`):
- Sample reference files do not import forbidden APIs (fetch, XMLHttpRequest, axios, useMutation, useNavigate, toast, redirect, etc.)
- Route files import the correct page component
- Route files declare the correct path
- `Link` elements set `preload={false}` in sample references

The contract tests use the TypeScript compiler API (`import ts from 'typescript'`) to parse and walk the AST of source files.

**Test data:**
```typescript
const validSignInValues = {
  email: ' Name@Example.COM ',
  password: 'password',
};
```

### Test File Location

Co-located with the modules they test inside `src/sample/`:

```
web/src/sample/
├── auth/
│   ├── sign-in-page.test.ts          ← schema + AST contract tests
│   ├── sign-up-page.test.ts
│   ├── sign-in-form-ui.test.ts
│   ├── sign-up-form-ui.test.ts
│   ├── otp-page.test.ts
│   ├── forgot-password-page.test.ts
│   └── auth-demo-submit-handlers.test.ts
├── layout/
│   └── navigation.test.ts
└── errors/
    └── maintenance-error-route.test.ts
```

There are **no test files** in `src/features/`, `src/components/`, `src/routes/`, `src/stores/`, or `src/hooks/`. Only `src/sample/` contains tests.

### Assertion Pattern

```typescript
function assertRejectedField(
  values: { email: string; password: string },
  fieldName: 'email' | 'password',
  message: string
) {
  const parsedValues = sampleSignInSchema.safeParse(values);

  if (parsedValues.success) {
    throw new Error(`Sign-in schema must reject invalid ${fieldName} values client-side.`);
  }

  const hasExpectedIssue = parsedValues.error.issues.some(
    (issue) => issue.path.join('.') === fieldName && issue.message === message
  );

  if (!hasExpectedIssue) {
    throw new Error(`Sign-in schema must return the expected ${fieldName} validation message.`);
  }
}
```

Helper assertion functions defined locally in each test file — no shared test utility library.

### Forbidden Pattern Checks

The AST-based tests scan source files for forbidden import patterns, verifying sample reference code does not include real network calls or navigation side effects:

```typescript
const forbiddenSourcePatterns = [
  { pattern: /\bfetch\s*\(/, reason: 'Network fetch calls are forbidden ...' },
  { pattern: /\buseMutation\b/, reason: 'Mutation hooks are forbidden ...' },
  { pattern: /\bredirect\s*\(/, reason: 'Redirect helpers are forbidden ...' },
  // ...
];
```

---

*Testing analysis: 2026-05-17*
