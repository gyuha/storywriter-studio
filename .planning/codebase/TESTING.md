# Testing Patterns

**Analysis Date:** 2026-05-17

## Test Framework

### Backend (`apps/api/`)

**Runner:**
- pytest 8.3+
- Config: `apps/api/pyproject.toml` under `[tool.pytest.ini_options]`

**Key pytest settings:**
- `asyncio_mode = "auto"` — all `async def test_*` functions run with asyncio automatically (no `@pytest.mark.asyncio` decorator needed)
- `testpaths = ["tests"]`
- `pythonpath = ["src"]` — `src/` is on the Python path so tests import as `from domains.auth.service import AuthService`
- `--strict-markers` — undeclared markers fail the run
- Coverage: `--cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=70`

**Assertion library:** Python built-in `assert`

**Run commands:**
```bash
cd apps/api && uv run pytest                                          # all tests + coverage
cd apps/api && uv run pytest tests/auth/test_auth_flows.py            # single file
cd apps/api && uv run pytest -m unit                                   # unit only
cd apps/api && uv run pytest -m integration                            # integration only
cd apps/api && uv run pytest --cov-report=html:htmlcov                 # with HTML report
```

### Frontend (`apps/web/`)

**Runner:** None — no jest/vitest configured. Frontend tests in `apps/web/src/sample/` are **plain TypeScript scripts** run via `node` or imported as ES modules. They use `throw new Error(...)` to signal failure rather than any test assertion library. These are reference-implementation validation scripts, not traditional unit tests.

No `vitest.config.*` or `jest.config.*` exists in `apps/web/`.

## Test File Organization

### Backend

**Location:** Separate `apps/api/tests/` directory, mirroring domain structure.

```
apps/api/tests/
├── conftest.py                        # Root: settings cache isolation (autouse)
├── auth/
│   ├── conftest.py                    # FakeRedis, FakeAuthRepository, auth_service fixture
│   ├── test_auth_flows.py             # E2E service flow tests (TestSignup, TestLogin, etc.)
│   ├── test_signup_route.py           # HTTP route tests with ASGI test client
│   ├── test_signup_schemas.py         # Pydantic schema validation tests
│   ├── test_login_route.py
│   ├── test_login_schemas.py
│   ├── test_refresh_route.py
│   ├── test_refresh_schemas.py
│   ├── test_verify_email_route.py
│   ├── test_password_reset_route.py
│   ├── test_password_reset_schemas.py
│   ├── test_password_reset_repository.py
│   ├── test_refresh_repository.py
│   ├── test_access_token_context.py
│   ├── test_signup_password_hashing.py
│   ├── test_email_backend.py
│   └── test_signup_mailpit_integration.py  # Integration: requires mailpit
├── chat/
│   ├── conftest.py                    # Provider env fixtures, LLMClient fixtures
│   ├── _mocks.py                      # Shared test doubles (FakeChatLiteLLM, StubLLMClient)
│   ├── test_auth_flows.py
│   ├── test_llm_client.py
│   ├── test_llm_factory.py
│   ├── test_ports.py
│   ├── test_provider_mocks.py
│   ├── test_provider_routing.py
│   ├── test_api_provider_switching.py
│   └── test_di_container.py
├── infra/llm/
│   └── test_provider_factory.py
├── shared/
│   └── test_shared_domain.py
├── test_config.py
├── test_dev_server.py
├── test_main_runtime.py
└── test_migrations.py
```

**Naming:**
- Test files: `test_<domain>_<subject>.py`
- Test classes: `Test<Subject>` — e.g., `TestSignup`, `TestLogin`, `TestRefresh`
- Test functions: `test_<describes_exact_behavior>` — verbose, behavior-centric names

### Frontend (Sample Scripts)

```
apps/web/src/sample/auth/
├── sign-in-page.test.ts          # Validates sign-in page constraints
├── sign-up-page.test.ts
├── sign-in-form-ui.test.ts
├── sign-up-form-ui.test.ts
├── otp-page.test.ts
├── forgot-password-page.test.ts
└── auth-demo-submit-handlers.test.ts
apps/web/src/sample/layout/
└── navigation.test.ts
apps/web/src/sample/errors/
└── maintenance-error-route.test.ts
```

## Test Structure

### Backend — Suite Organization

Tests are grouped in classes by the operation under test:

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

    async def test_signup_duplicate_email_raises_conflict(
        self,
        auth_service: AuthService,
        fake_repo: Any,
    ) -> None:
        from core.exceptions import ConflictError

        await auth_service.signup(_EMAIL, _PASSWORD)
        with pytest.raises(ConflictError, match="already exists"):
            await auth_service.signup(_EMAIL, "AnotherPass2!")
```

**Patterns:**
- Setup via fixtures, not `setUp` methods
- Inline imports for exceptions being asserted (`from core.exceptions import ConflictError`)
- Module-level helper constants: `_EMAIL = "alice@example.com"`, `_PASSWORD = "Password1!"`
- Private helper methods in classes prefixed with `_`: `async def _signup_and_verify(...)`

### Route Tests (HTTP Layer)

Route tests use `httpx.AsyncClient` with `ASGITransport` — no running server needed:

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
        response = await client.post("/api/v1/auth/signup", json={...})

    assert response.status_code == 201
```

## Mocking

### Backend Mocking Strategy

**Philosophy:** Intercept at the lowest I/O boundary. Everything above gets the real implementation.

**Three layers of test doubles:**

**1. Fake classes (in-memory stubs):**
- `FakeRedis` in `tests/auth/conftest.py` — async Redis stub with `get/set/exists/delete/ping`, tracks expirations
- `FakeAuthRepository` in `tests/auth/conftest.py` — full in-memory repository, tracks all mutations
- `FakeChatLiteLLM` in `tests/chat/_mocks.py` — drop-in for `ChatLiteLLM`, returns configurable pre-canned responses

```python
class FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, Any] = {}
        self.expirations: dict[str, int | None] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: Any, ex: int | None = None) -> None:
        self._store[key] = value
        self.expirations[key] = ex
```

**2. MagicMock / AsyncMock (call assertions):**
- Used for LLM client fixtures when test needs to assert call count/arguments
- `mock.ainvoke = AsyncMock(return_value=AIMessage(content=FAKE_RESPONSE_TEXT))`
- Async generators assigned directly: `mock.astream = _astream` (not AsyncMock)

**3. `unittest.mock.patch` (module boundary isolation):**
- Patches `infra.llm.provider_factory.ChatLiteLLM` to inject `FakeChatLiteLLM`
- Used as context manager fixture via `with patch(...) as mock_cls: yield mock_cls`

**FastAPI DI override (route tests):**
```python
application.dependency_overrides[_get_service] = lambda: signup_service
```

**monkeypatch (env var isolation):**
- `monkeypatch.setenv("LLM_PROVIDER", "openai")` — restored automatically after test
- Root `settings_cache_clear` autouse fixture clears `get_settings.cache_clear()` before/after every test

**What to mock:**
- All external I/O: Redis, database, email, HTTP requests, LLM API calls
- `ChatLiteLLM` (network boundary for LLM) — patch at `infra.llm.provider_factory.ChatLiteLLM`
- Service layer injected into router tests via `dependency_overrides`

**What NOT to mock:**
- Business logic (service methods)
- Security helpers (`hash_password`, `decode_token`) — test these with real implementations
- Pydantic validation

## Fixtures and Factories

### Conftest Hierarchy

```
tests/conftest.py           # autouse: settings_cache_clear (clears lru_cache)
tests/auth/conftest.py      # FakeRedis, FakeAuthRepository, auth_service
tests/chat/conftest.py      # env_openai/ollama, LLM client fixtures, ChatService fixtures
```

**Root fixture (autouse):**
```python
@pytest.fixture(autouse=True)
def settings_cache_clear() -> None:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
```

**Composable service fixture:**
```python
@pytest.fixture
def auth_service(fake_repo: FakeAuthRepository, fake_redis: FakeRedis) -> Any:
    return AuthService(repo=fake_repo, redis=fake_redis)
```

**Test data:**
- Module-level constants for reusable test inputs: `_EMAIL`, `_PASSWORD`
- In-test helper objects: `CapturingAuthEmailService` (captures sent emails for assertion)
- `MagicMock()` with manual attribute assignment for ORM-like objects

**Shared test doubles location:**
- `tests/chat/_mocks.py` — plain module (not conftest) for classes importable without pytest
- Constants: `FAKE_RESPONSE_TEXT`, `FAKE_STREAM_TOKENS`, `OPENAI_TEST_KEY`, `OLLAMA_TEST_URL`

## Coverage

**Requirement:** `--cov-fail-under=70` (70% minimum, CI fails below this)

**Coverage config (`[tool.coverage.run]`):**
- `branch = true` — branch coverage enabled
- Source: `src/`
- Omits: `*/migrations/*`, `*/alembic/*`, `*/tests/*`

**View coverage:**
```bash
cd apps/api && uv run pytest --cov-report=html:htmlcov
open apps/api/htmlcov/index.html
```

**Excluded lines (no cover):**
- `pragma: no cover`
- `def __repr__`
- `if TYPE_CHECKING:`
- `raise NotImplementedError`
- `...` (ellipsis — Protocol stubs)

## Test Types and Markers

Markers declared in `pyproject.toml`:
- `unit` — pure unit tests (no I/O)
- `integration` — tests that hit DB / Redis (requires Docker infrastructure)
- `e2e` — end-to-end tests against the running server

**Current test distribution:**
- Auth service tests (`test_auth_flows.py`) — unit (in-memory fakes, no DB/Redis)
- Route tests (`test_signup_route.py`, etc.) — unit (ASGITransport, fake services)
- Schema tests (`test_signup_schemas.py`, etc.) — unit (pure Pydantic validation)
- Repository tests — integration (require real AsyncSession)
- Mailpit test (`test_signup_mailpit_integration.py`) — integration (requires mailpit container)
- LLM tests — unit (patched ChatLiteLLM or StubLLMClient)

## Common Patterns

### Async Testing

No `@pytest.mark.asyncio` needed — `asyncio_mode = "auto"` in pyproject.toml applies globally:

```python
async def test_signup_creates_user(
    self,
    auth_service: AuthService,
    fake_repo: Any,
) -> None:
    user, raw_token = await auth_service.signup(_EMAIL, _PASSWORD, "Alice")
    assert user.email == _EMAIL.lower()
```

### Error Testing

```python
async def test_signup_duplicate_email_raises_conflict(
    self,
    auth_service: AuthService,
    fake_repo: Any,
) -> None:
    from core.exceptions import ConflictError

    await auth_service.signup(_EMAIL, _PASSWORD)
    with pytest.raises(ConflictError, match="already exists"):
        await auth_service.signup(_EMAIL, "AnotherPass2!")
```

### Parametrized Tests (route error mapping)

```python
@pytest.mark.parametrize(
    ("service_error", "expected_status", "expected_detail"),
    [
        (ConflictError("..."), 409, "..."),
        (AppError("..."), 400, "..."),
        (UnauthorizedError("..."), 401, "..."),
        (ForbiddenError("..."), 403, "..."),
        (NotFoundError("Invite"), 404, "Invite not found."),
    ],
)
async def test_signup_maps_application_service_errors_to_http_responses(
    app, signup_service, service_error, expected_status, expected_detail
) -> None:
    signup_service.error = service_error
    # ... make request and assert status + body
```

### Logger Capture (monkeypatch)

```python
warning_events: list[tuple[str, dict[str, Any]]] = []

class CapturingLogger:
    def warning(self, event: str, **kwargs: Any) -> None:
        warning_events.append((event, kwargs))

monkeypatch.setattr(auth_service_module, "logger", CapturingLogger())
```

### Async Streaming Test

```python
async def test_astream(streaming_stub_llm_client):
    from langchain_core.messages import HumanMessage
    service = ChatService(llm_client=streaming_stub_llm_client)
    chunks = [c async for c in service.stream([HumanMessage(content="hi")])]
    assert chunks == FAKE_STREAM_TOKENS
```

### SQLAlchemy IntegrityError Injection

```python
async def create_user_raises_unique_violation(*args: Any, **kwargs: Any) -> Any:
    raise IntegrityError(
        statement="INSERT INTO users ...",
        params={"email": "alice@example.com"},
        orig=Exception("duplicate key value violates unique constraint users_email_key"),
    )

fake_repo.create_user = create_user_raises_unique_violation
```

## Frontend Test Scripts (Sample)

Frontend "tests" in `apps/web/src/sample/` are plain TypeScript modules that:
- Execute assertions at module load time using `throw new Error(...)` 
- Parse TypeScript source files using the `typescript` compiler API to enforce structural constraints
- Validate that sample UI components do not make real network calls, use forbidden patterns, or violate UI isolation rules

They are NOT run by a test runner — they are validation scripts. No frontend unit test framework (Vitest, Jest) is configured.

---

*Testing analysis: 2026-05-17*
