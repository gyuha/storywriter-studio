# Codebase Concerns

**Analysis Date:** 2026-05-17

## Tech Debt

**Web frontend uses mock API instead of real backend:**
- Issue: The auth feature in `apps/web/src/features/auth/lib/mock-auth-api.ts` uses a `mockLogin`/`mockSignup` stub with hardcoded test emails (`fail@example.com`, `taken@example.com`) instead of connecting to the FastAPI backend.
- Files: `apps/web/src/features/auth/lib/mock-auth-api.ts`, `apps/web/src/features/auth/hooks/use-auth-mutation.ts`
- Impact: The entire login/signup flow in `/auth/login` and `/auth/signup` routes does not communicate with the real API. Auth state (`useAuthStore`) is never persisted — cleared on page refresh. No real JWT handling exists in the frontend.
- Fix approach: Replace `mockLogin`/`mockSignup` with real `fetch`/`axios` calls to `POST /api/v1/auth/login` and `POST /api/v1/auth/signup`. Add JWT token persistence (e.g., Zustand `persist` middleware with `sessionStorage`). Implement token refresh logic.

**Auth state not persisted across page refreshes:**
- Issue: `useAuthStore` in `apps/web/src/features/auth/store/auth.store.ts` uses bare `create()` with no persistence middleware. Login state is lost on every page refresh.
- Files: `apps/web/src/features/auth/store/auth.store.ts`
- Impact: Users are effectively logged out on every page reload even when using mock auth.
- Fix approach: Add `persist` middleware from `zustand/middleware` using `sessionStorage` or add token storage once real API is wired.

**Test/debug routes included in production build:**
- Issue: `apps/web/src/routes/test/modal.tsx` registers a public `/test/modal` route in the production route tree (generated into `routeTree.gen.ts`). There is no auth gate on this route.
- Files: `apps/web/src/routes/test/modal.tsx`, `apps/web/src/routeTree.gen.ts`
- Impact: The modal test page is accessible in production at `/test/modal`.
- Fix approach: Move to a separate development-only entrypoint or guard with `import.meta.env.DEV`.

**Wildcard `__init__.py` re-exports in all domain modules:**
- Issue: All domain `__init__.py` files use `from .module import *  # noqa: F403` (e.g., `apps/api/src/domains/auth/service/__init__.py`, `apps/api/src/domains/chat/router/__init__.py`). This bypasses static analysis and makes refactoring risky.
- Files: All `__init__.py` files under `apps/api/src/domains/`
- Impact: `mypy` and `ruff` cannot track which names are actually exported. Renaming any public function requires auditing all consumers manually.
- Fix approach: Replace with explicit named imports: `from .auth_service import AuthService`.

**`uvicorn.run()` first argument is a control character `"\1"` instead of a module string:**
- Issue: `apps/api/src/main.py` line 275 passes `"\1"` (ASCII SOH character) as the uvicorn app string, which appears to be a rendering artifact or corruption.
- Files: `apps/api/src/main.py:275`
- Impact: `python -m app` (direct execution) will fail to start the server. The production `uvicorn app.main:app` command is unaffected.
- Fix approach: Replace `"\1"` with the correct module string `"main:app"` (given the `pythonpath = src` setting in pyproject.toml).

**Duplicate LLM settings fields in `Settings` and `LLMSettings`:**
- Issue: `LLMSettings` and `Settings` both declare the full set of LLM configuration fields (`llm_provider`, `llm_default_model`, all API keys, etc.). The `settings.llm` property manually constructs an `LLMSettings` by copying fields from `Settings`. This double-declaration creates drift risk.
- Files: `apps/api/src/core/config.py:68-259`, `apps/api/src/core/config.py:266-552`
- Impact: Adding a new LLM provider requires updating both classes. A missed field silently uses the default value.
- Fix approach: Have `Settings` embed a single `LLMSettings` instance directly, rather than re-declaring all fields.

**`@faker-js/faker` in production `dependencies` instead of `devDependencies`:**
- Issue: `@faker-js/faker` is listed under `dependencies` in `apps/web/package.json` instead of `devDependencies`. It is only used by `apps/web/src/sample/` data generators.
- Files: `apps/web/package.json:17`
- Impact: Faker (a large package) is bundled into production builds or included in the production `node_modules` install.
- Fix approach: Move `@faker-js/faker` to `devDependencies`.

## Known Bugs

**`python -m app` (direct execution) broken by corrupted uvicorn app string:**
- Symptoms: Starting the server with `python -m app` raises an error because uvicorn receives `"\1"` as the app argument.
- Files: `apps/api/src/main.py:275`
- Trigger: Running `uv run python -m app` or any direct module execution.
- Workaround: Use `uv run uvicorn main:app --reload` directly.

**OAuth state returned from Redis as `bytes`, compared against `str` `provider`:**
- Issue: In `apps/api/src/domains/auth/router/auth_router.py:320`, `redis.get(...)` returns `bytes` by default in `redis-py`. The check `stored_provider != provider` compares bytes against a string, which always evaluates to `True`, meaning all OAuth callbacks fail CSRF validation.
- Files: `apps/api/src/domains/auth/router/auth_router.py:319-323`
- Trigger: Any OAuth login via Google/Kakao/Naver.
- Workaround: None. All OAuth logins currently fail CSRF validation unless `decode_responses=True` is set on the Redis client.

## Security Considerations

**Hardcoded default secrets in production config:**
- Risk: `secret_key` defaults to `"change-me-in-production"` and `jwt_secret_key` defaults to `"change-me-jwt-secret-key"`. If `.env` is not set, the application starts with these weak defaults.
- Files: `apps/api/src/core/config.py:288`, `apps/api/src/core/config.py:327`
- Current mitigation: Documented in settings docstring. No runtime check enforces that defaults are overridden.
- Recommendations: Add a startup check that raises `ValueError` if `is_production()` and either key matches the default value.

**OAuth provider `access_token` and `refresh_token` stored as plaintext in the database:**
- Risk: `OAuthAccount.access_token` and `OAuthAccount.refresh_token` are stored as unencrypted `Text` columns. A database compromise exposes live OAuth tokens that can be used to access users' Google/Kakao/Naver accounts.
- Files: `apps/api/src/domains/auth/models/auth_models.py:327-328`, `apps/api/src/domains/auth/repository/auth_repository.py`
- Current mitigation: None. Tokens are stored as received from providers.
- Recommendations: Encrypt OAuth tokens at rest using application-layer encryption (e.g., `cryptography.fernet`) before storing.

**No rate limiting on auth endpoints:**
- Risk: `POST /api/v1/auth/login`, `POST /api/v1/auth/signup`, and `POST /api/v1/auth/password-reset` have no rate limiting. The `limiter` instance is configured in `main.py` but no `@limiter.limit(...)` decorator is applied to any auth route.
- Files: `apps/api/src/main.py:103`, `apps/api/src/domains/auth/router/auth_router.py`
- Current mitigation: None. Login attempts are unbounded.
- Recommendations: Apply `@limiter.limit("10/minute")` to login and `@limiter.limit("5/minute")` to signup/password-reset endpoints using the existing `limiter` instance.

**No brute-force account lockout:**
- Risk: There is no failed-attempt counter or temporary lockout mechanism. An attacker can try unlimited passwords against any account.
- Files: `apps/api/src/domains/auth/service/auth_service.py:220-227`
- Current mitigation: Rate limiting (when added) would help, but no per-account lockout exists.
- Recommendations: Track failed login attempts in Redis with exponential backoff or temporary lockout after N failures.

**CORS configured with `allow_methods=["*"]` and `allow_headers=["*"]`:**
- Risk: The wildcard CORS configuration allows any HTTP method and any header from origins in `cors_origins_list`. This is overly permissive.
- Files: `apps/api/src/main.py:134-135`
- Current mitigation: Origins are restricted via `cors_origins_list`.
- Recommendations: Restrict to `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]` and explicit headers.

**`python-jose` 3.5.0 is effectively unmaintained:**
- Risk: `python-jose` has had no release since 2022 and has open security issues. The recommended replacement is `PyJWT` or `joserfc`.
- Files: `apps/api/src/domains/auth/security.py:36`, `apps/api/pyproject.toml:50`
- Current mitigation: The `cryptography` extra is used which mitigates some known issues.
- Recommendations: Migrate to `PyJWT>=2.0` which is actively maintained and has a compatible API.

**Chat endpoint `/complete` and `/stream` have no authentication requirement:**
- Risk: `POST /api/v1/chat/complete` and `POST /api/v1/chat/stream` do not require authentication (no `Depends(get_current_user)` or `Depends(require_permission(...))`). Any unauthenticated request can invoke LLM calls, incurring API costs.
- Files: `apps/api/src/domains/chat/router/chat_router.py:208-255`, `apps/api/src/domains/chat/router/chat_router.py:258-305`
- Current mitigation: None observable from the code.
- Recommendations: Add `Depends(require_permission("chat:write"))` to both endpoints.

## Performance Bottlenecks

**`httpx.AsyncClient` created per-OAuth-request instead of being pooled:**
- Problem: Each OAuth token exchange in `google.py`, `kakao.py`, and `naver.py` instantiates a new `httpx.AsyncClient()` via `async with httpx.AsyncClient() as client`. This bypasses connection pooling and adds TCP handshake overhead per request.
- Files: `apps/api/src/domains/auth/oauth/google.py:66`, `apps/api/src/domains/auth/oauth/kakao.py:50`, `apps/api/src/domains/auth/oauth/naver.py:50`
- Cause: No shared client is created at startup or injected via DI.
- Improvement path: Create a single `httpx.AsyncClient` during application lifespan and inject via FastAPI dependency, similar to how Redis is handled.

**`has_permission()` on `User` does O(roles × permissions) linear scan per request:**
- Problem: `User.has_permission(key)` in `apps/api/src/domains/auth/models/auth_models.py:183-189` iterates all roles and all permissions for each authorization check. On authenticated routes with multiple permission checks this is O(R×P) per request.
- Files: `apps/api/src/domains/auth/models/auth_models.py:183-189`
- Cause: No caching or set-based lookup.
- Improvement path: Build a `frozenset` of permission keys from loaded roles once (e.g., a cached property) and use `in` for O(1) lookup.

## Fragile Areas

**OAuth CSRF state validation (Redis bytes vs. string comparison):**
- Files: `apps/api/src/domains/auth/router/auth_router.py:319-323`
- Why fragile: Redis returns bytes unless `decode_responses=True` is set. The comparison `stored_provider != provider` silently fails for all OAuth providers.
- Safe modification: Check whether `get_redis_client()` creates the client with `decode_responses=True`. If not, decode: `stored_provider.decode() if isinstance(stored_provider, bytes) else stored_provider`.
- Test coverage: No integration test for the OAuth callback path is visible.

**`settings` module-level singleton is loaded at import time:**
- Files: `apps/api/src/core/config.py:585`
- Why fragile: `settings = get_settings()` runs at module import. Any test that sets environment variables after import will see stale values unless `get_settings.cache_clear()` is called. This is documented but easy to miss.
- Safe modification: Use `get_settings()` calls within functions rather than importing the module-level `settings` directly.
- Test coverage: `tests/test_config.py` does test cache clearing, but individual domain tests may not.

**`_get_oauth_adapter()` is undocumented and silently returns `None`-behavior for unknown providers:**
- Files: `apps/api/src/domains/auth/router/auth_router.py` (private helper function)
- Why fragile: If an unsupported `provider` string is passed, the function raises an `HTTP 400`. But if a new provider is added to config without updating the router, it silently falls through.
- Safe modification: Use an exhaustive match/dict lookup with a clear `KeyError` path.
- Test coverage: Unknown.

## Scaling Limits

**Single worker default (`workers: int = 1`) in Settings:**
- Current capacity: 1 uvicorn worker handles all requests sequentially within the async event loop.
- Limit: CPU-bound operations (argon2 hashing during login) block the event loop since argon2-cffi is a C extension that releases the GIL but still runs synchronously.
- Scaling path: Increase `WORKERS` env var for production; consider `run_in_executor` for argon2 hashing to avoid blocking the event loop.

**No connection pooling for LLM provider HTTP calls:**
- Current capacity: Each LLM invocation creates a new TCP connection to the provider (OpenAI/Anthropic/etc.) via LangChain/LiteLLM internals.
- Limit: Under high load, connection establishment latency compounds.
- Scaling path: Verify LiteLLM's internal connection pooling behavior and configure pool sizes accordingly.

## Dependencies at Risk

**`python-jose` 3.5.0 — unmaintained JWT library:**
- Risk: No releases since 2022; known vulnerabilities in older versions.
- Impact: JWT encode/decode, the entire auth token system.
- Migration plan: Replace with `PyJWT>=2.0`. The API is similar: `jwt.encode`/`jwt.decode` with minor signature differences.

**`langchain-community>=0.3.0` — listed as dependency but no imports found in source:**
- Risk: `langchain-community` is a large dependency with many subdependencies that is listed in `pyproject.toml` but appears unused in `src/`.
- Impact: Unnecessary build weight and potential transitive vulnerability surface.
- Migration plan: Audit and remove if confirmed unused.

## Missing Critical Features

**No real frontend-backend API connection:**
- Problem: The web application has no HTTP client layer connecting to the FastAPI backend. All auth is mocked.
- Blocks: Any real user registration, login, or protected feature cannot be tested or used end-to-end.

**No token refresh mechanism in the web frontend:**
- Problem: There is no code in `apps/web/src/features/auth/` to handle JWT refresh token rotation, expiry detection, or automatic re-authentication.
- Blocks: Even after a real API is connected, sessions will silently expire after 15 minutes.

**No environment variable configuration for API base URL in web:**
- Problem: No `VITE_API_URL` or equivalent is used anywhere in `apps/web/src/features/`. When the real API is wired, the base URL will be hardcoded or will need to be added.
- Blocks: Multi-environment deployment (dev/staging/prod) requires this to be configurable.

## Test Coverage Gaps

**Web `features/` directory has zero tests:**
- What's not tested: `apps/web/src/features/auth/hooks/use-auth-mutation.ts`, `apps/web/src/features/auth/store/auth.store.ts`, `apps/web/src/features/auth/components/login-form.tsx`, `apps/web/src/features/auth/components/signup-form.tsx`
- Files: All of `apps/web/src/features/`
- Risk: Login/signup mutations, auth store transitions, and form validation can break silently.
- Priority: High — this is the core application code (as opposed to sample code which does have tests).

**No integration tests for OAuth callback flows:**
- What's not tested: The full OAuth authorize → callback → user-provision → JWT-issue cycle for Google/Kakao/Naver.
- Files: `apps/api/src/domains/auth/oauth/`, `apps/api/src/domains/auth/router/auth_router.py:265-400`
- Risk: The Redis bytes/string comparison bug (noted above) would have been caught by a single integration test.
- Priority: High.

**Chat `/complete` and `/stream` endpoints lack auth enforcement tests:**
- What's not tested: Whether unauthenticated requests to `/api/v1/chat/complete` and `/api/v1/chat/stream` are rejected.
- Files: `apps/api/tests/chat/`
- Risk: If auth is added later, regression tests don't exist to confirm it works.
- Priority: Medium.

---

*Concerns audit: 2026-05-17*
