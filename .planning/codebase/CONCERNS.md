# Codebase Concerns

**Analysis Date:** 2026-05-17

## Tech Debt

**Frontend-Backend Disconnection (Phase 1 blocker):**
- Issue: Frontend auth is fully mocked — no real API calls to FastAPI backend
- Files: `apps/web/src/features/auth/lib/mock-auth-api.ts`, `apps/web/src/features/auth/hooks/use-auth-mutation.ts`
- Impact: Signup/login buttons call `mockLogin`/`mockSignup` which simulate delay and return fake user data. The entire auth domain in FastAPI is unused by the UI. Real token handling (access/refresh JWT), email verification, OAuth flows are all bypassed.
- Fix approach: Replace `mockLogin`/`mockSignup` imports with a real API client (e.g. `apps/web/src/features/auth/lib/auth-api.ts`) that calls `POST /api/v1/auth/login` and `POST /api/v1/auth/signup`. Store tokens in a persistent store (see auth store concern below).

**Auth Store Has No Persistence:**
- Issue: `useAuthStore` in `apps/web/src/features/auth/store/auth.store.ts` is a plain Zustand store — no `persist` middleware, no localStorage, no cookie. Every page refresh logs the user out.
- Files: `apps/web/src/features/auth/store/auth.store.ts`
- Impact: Unusable in production; state is lost on reload. Also missing `accessToken`/`refreshToken` fields — the store only tracks `user` object.
- Fix approach: Add `zustand/middleware`'s `persist` with a storage adapter; add `accessToken`/`refreshToken` fields; implement token refresh logic.

**Sample Code Bundled in Production Build:**
- Issue: `apps/web/src/main.tsx` imports `@/sample/i18n` directly. `apps/web/src/routes/__root.tsx` imports `isSamplePath` from `@/sample/layout/navigation`. The TanStack Router generates ~30+ sample routes into `routeTree.gen.ts` which are included in every production bundle.
- Files: `apps/web/src/main.tsx:3`, `apps/web/src/routes/__root.tsx:5`, `apps/web/src/routeTree.gen.ts`
- Impact: Dead code + bundle size bloat. The `/sample/*` routes (sign-in variants, settings, dashboard, tasks, etc.) are publicly accessible in production.
- Fix approach: Move sample routes and i18n import behind a `VITE_ENABLE_SAMPLE` feature flag, or delete the `apps/web/src/routes/sample/` directory entirely when starting real feature development.

**Bootstrap Template Identity Leak:**
- Issue: The codebase still carries the original FastAPI Bootstrap template identity — app title `"FastAPI Bootstrap"`, mail sender `"FastAPI Bootstrap"`, startup log `app="FastAPI Bootstrap"`, OpenAPI docs exposed at `/docs`, `/redoc`, `/openapi.json` without auth.
- Files: `apps/api/src/main.py:66,85,109`, `apps/api/src/core/config.py:351`
- Impact: Misleading API docs, incorrect email sender identity, OpenAPI schema publicly exposable in production.
- Fix approach: Replace title/sender strings with StoryWriter Studio identity. In production, set `docs_url=None`, `redoc_url=None`, `openapi_url=None`.

**No Rate Limiting on Auth Endpoints:**
- Issue: `slowapi` is configured at the app level (`apps/api/src/main.py`) but no `@limiter.limit(...)` decorator is applied to any auth router endpoint (signup, login, password-reset).
- Files: `apps/api/src/main.py:103`, `apps/api/src/domains/auth/router/auth_router.py`
- Impact: Login and password-reset endpoints are open to brute-force credential stuffing and email enumeration attacks at unrestricted rate.
- Fix approach: Apply `@limiter.limit("5/minute")` to `/auth/login`, `/auth/signup`, `/auth/password-reset`, and `/auth/password-reset/confirm`.

**No Context Window Management for Conversations:**
- Issue: `send_message` in `apps/api/src/domains/chat/router/chat_router.py` fetches all messages in a conversation via `repo.get_conversation_messages(conversation_id)` and passes the entire history to the LLM on every turn.
- Files: `apps/api/src/domains/chat/router/chat_router.py:469-476`
- Impact: Long conversations will eventually exceed the model's context window, causing provider errors (typically 400/context_length_exceeded). Token costs will also grow unboundedly per request.
- Fix approach: Implement a message window strategy — e.g., keep last N messages or implement token-counted sliding window in `ChatRepository` or `ChatService`.

## Known Bugs

**OAuth State CSRF Validation — Silent Bypass Risk:**
- Symptoms: Redis `get()` returns the provider name as a string (e.g. `"google"`). The comparison `if stored_provider != provider` works correctly only because `decode_responses=True` is set on the Redis client. If that setting is ever changed or a different Redis client is used, `stored_provider` would be `bytes` and the comparison would always fail, invalidating all OAuth callbacks.
- Files: `apps/api/src/domains/auth/router/auth_router.py:319-320`, `apps/api/src/core/redis.py:65`
- Trigger: Changing `decode_responses` on the Redis client.
- Workaround: The current setup with `decode_responses=True` prevents this, but there is no defensive `str()` cast or type annotation to protect future changes.

**unauthenticated `/chat/complete` and `/chat/stream` endpoints:**
- Symptoms: `POST /chat/complete` and `POST /chat/stream` at `apps/api/src/domains/chat/router/chat_router.py:199-309` have no `get_current_user` or `require_permission` dependency. Any unauthenticated caller can consume LLM API credits.
- Files: `apps/api/src/domains/chat/router/chat_router.py:208-309`
- Trigger: Calling `POST /api/v1/chat/complete` without a Bearer token.
- Workaround: None. These endpoints are intentionally stateless (no DB persistence) but are still unprotected.

**SSE Streaming — Session Used After Closed:**
- Symptoms: In `send_message`, `repo.add_message()` and `session.commit()` are called inside the `finally` block of `_event_gen()`, which runs after the SSE stream response has already been sent. If the SQLAlchemy `AsyncSession` has been closed or the connection returned to the pool by the time `finally` runs, the commit will fail silently (logged as `chat_message_persist_failed` but not surfaced to the client).
- Files: `apps/api/src/domains/chat/router/chat_router.py:521-542`
- Trigger: Session pool exhaustion or session timeout during a long stream.
- Workaround: The `finally` block catches `Exception` and logs; the assistant message is simply not persisted.

## Security Considerations

**Default Secrets in Production:**
- Risk: `SECRET_KEY` defaults to `"change-me-in-production"` and `JWT_SECRET_KEY` defaults to `"change-me-jwt-secret-key"`. There is no startup validation that rejects these defaults when `APP_ENV=production`.
- Files: `apps/api/src/core/config.py:288,327`
- Current mitigation: None — the app starts and issues JWTs with the default key.
- Recommendations: Add a `@field_validator` on `secret_key` and `jwt_secret_key` that raises `ValueError` when the value matches the known defaults and `app_env == "production"`.

**OAuth Provider Tokens Stored in Plaintext:**
- Risk: `oauth_accounts.access_token` and `oauth_accounts.refresh_token` are stored as plain `TEXT` columns in PostgreSQL with no encryption.
- Files: `apps/api/alembic/versions/0001_initial_schema.py:194-195`, `apps/api/src/domains/auth/models/auth_models.py` (OAuthAccount model)
- Current mitigation: Database access is controlled at the network level. The tokens are also short-lived for most providers.
- Recommendations: Encrypt OAuth tokens at rest using a symmetric key (e.g. Fernet) before storage. At minimum, document the plaintext storage risk.

**CORS `allow_methods=["*"]` and `allow_headers=["*"]`:**
- Risk: Combined with `allow_credentials=True`, wildcard methods and headers allow any content-type and custom header from allowed origins. This is broader than necessary.
- Files: `apps/api/src/main.py:133-135`
- Current mitigation: `allow_origins` is properly restricted via `settings.cors_origins_list`.
- Recommendations: Restrict to `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]` and `allow_headers=["Authorization", "Content-Type"]`.

**OpenAPI Docs Exposed Without Auth:**
- Risk: `/docs`, `/redoc`, and `/openapi.json` are publicly accessible with no authentication, exposing full API schema, endpoint list, and request/response models in production.
- Files: `apps/api/src/main.py:115-117`
- Current mitigation: None.
- Recommendations: Set `docs_url=None`, `redoc_url=None`, `openapi_url=None` when `APP_ENV=production`.

**OAuth `httpx.AsyncClient` Has No Timeout:**
- Risk: All three OAuth adapters (`google.py`, `kakao.py`, `naver.py`) open `httpx.AsyncClient()` with no `timeout` parameter. A hanging OAuth provider can block the async event loop worker for the default httpx timeout (5 seconds) or indefinitely.
- Files: `apps/api/src/domains/auth/oauth/google.py:66`, `apps/api/src/domains/auth/oauth/kakao.py:50`, `apps/api/src/domains/auth/oauth/naver.py:50`
- Current mitigation: None.
- Recommendations: `httpx.AsyncClient(timeout=10.0)` on all three adapters.

## Performance Bottlenecks

**Full Conversation History Sent to LLM on Every Turn:**
- Problem: Every call to the `/conversations/{id}/messages` SSE send endpoint fetches all historical messages from the DB and sends them to the LLM.
- Files: `apps/api/src/domains/chat/router/chat_router.py:469-476`
- Cause: No message limit or token-count truncation is applied.
- Improvement path: Add a `limit` parameter to `repo.get_conversation_messages()` (e.g., last 20 messages), or implement a token-counted sliding window. Long-term: move context management into `ChatService`.

**Per-Request `get_settings()` Re-computation in Chat Router:**
- Problem: `get_settings()` is called on every chat request inside `chat_complete`, `chat_stream`, and `get_provider_info` via `get_settings().llm.litellm_model`. `get_settings()` itself is `@lru_cache` so the top-level call is cheap, but `.llm` property on `Settings` creates a new `LLMSettings` instance each call (not cached).
- Files: `apps/api/src/domains/chat/router/chat_router.py:246,295,363`, `apps/api/src/core/config.py:525-552`
- Cause: `settings.llm` is a `@property` that calls `LLMSettings(...)` on every access.
- Improvement path: Cache `settings.llm` with `functools.cached_property` or memoize it inside `Settings`.

## Fragile Areas

**Wildcard Re-exports (`from .module import *`):**
- Files: All `__init__.py` files in `apps/api/src/domains/*/` — e.g., `apps/api/src/domains/auth/router/__init__.py:1-2`, `apps/api/src/domains/chat/service/__init__.py:1`, etc.
- Why fragile: Wildcard imports (`# noqa: F403`) hide what is actually exported. Adding a new symbol to a submodule silently pollutes the namespace. Mypy cannot fully resolve types from wildcard imports.
- Safe modification: Do not add new public symbols to `__init__.py` files via `*` import. Use explicit named imports where possible when consuming these packages.
- Test coverage: No test validates the public API surface of these modules.

**SSE Streaming Commits Inside `finally` Block:**
- Files: `apps/api/src/domains/chat/router/chat_router.py:521-542`
- Why fragile: The SQLAlchemy `AsyncSession` is a request-scoped dependency. By the time the SSE generator's `finally` block executes, the FastAPI request lifecycle may have already cleaned up the session. Whether the session remains valid depends on the ASGI server's handling of background tasks vs. response finalization — not guaranteed.
- Safe modification: Move message persistence out of the SSE generator into a background task using `BackgroundTasks` or a Celery/ARQ worker, so it does not depend on a still-open request session.
- Test coverage: No integration test exercises the SSE path with DB persistence failure.

**`has_permission` Is an O(roles × permissions) Linear Scan:**
- Files: `apps/api/src/domains/auth/models/auth_models.py:183-189`, `apps/api/src/domains/auth/security.py:403`
- Why fragile: Every authenticated request with `require_permission()` triggers a full nested loop over `user.roles` and `role.permissions`. With `selectinload` this is N+1-free, but still linear in the number of role/permission combinations.
- Safe modification: The current scale (expected few roles and permissions) is fine. At scale, cache resolved permissions per user in Redis.
- Test coverage: Unit tested via `FakeAuthRepository`.

## Scaling Limits

**Redis as Single Point of Failure:**
- Current capacity: Single Redis instance (`REDIS_URL` or `REDIS_*` env vars).
- Limit: JWT blacklist, OAuth state nonces, and rate limiting all depend on the single Redis instance. If Redis is unavailable, the app fails to start (ping fails in lifespan) and all authenticated requests fail.
- Scaling path: Redis Cluster or Redis Sentinel for HA. Consider Redis-less fallback for non-critical features (e.g., rate limiting with in-memory fallback).

**No Pagination on Conversation Listing or Message Fetching:**
- Current capacity: `list_conversations` returns all conversations, `get_conversation_messages` returns all messages for a conversation.
- Limit: Will degrade with hundreds of conversations or thousands of messages per conversation.
- Files: `apps/api/src/domains/chat/repository/chat_repository.py`, `apps/api/src/domains/chat/router/chat_router.py:373-385, 406-422`
- Scaling path: Add `limit`/`offset` or cursor-based pagination to both repository methods and router endpoints.

## Dependencies at Risk

**`langchain-litellm` is a Thin Adapter with Uncertain Maintenance:**
- Risk: `langchain-litellm` (`>=0.2.0`) is a community bridge package. If it falls behind LangChain or LiteLLM major version updates, provider switching may break silently.
- Impact: All LLM calls via `ChatLiteLLM` would fail.
- Migration plan: The isolation boundary in `apps/api/src/infra/llm/provider_factory.py` and the `AbstractLLMPort` protocol in `apps/api/src/domains/chat/ports.py` make it possible to replace `langchain-litellm` with a direct `litellm` or provider SDK without touching domain code.

**`passlib[argon2]` — Maintenance Status:**
- Risk: `passlib` has had minimal maintenance since 2023. The `argon2-cffi` backend still receives updates, but the `passlib` wrapper layer may lag.
- Impact: Password hashing continues to work, but security patches or Python 3.13+ compatibility may be slow.
- Migration plan: Can be replaced with `argon2-cffi` directly via `argon2.PasswordHasher()`. The change is isolated to `apps/api/src/domains/auth/security.py:hash_password` and `verify_password`.

## Missing Critical Features

**No Novel Domain (Story/Character/World) — Core Product Value Gap:**
- Problem: The project goal is an AI web novel writing platform. The codebase currently contains only generic auth and a simple chat proxy. No Story, Chapter, Character, Location, or Worldbuilding domain exists.
- Blocks: The stated core value — "AI generates context-aware prose using character/setting context" — is entirely unimplemented.

**No Frontend Test Coverage:**
- What's missing: Zero test files exist outside `apps/web/src/sample/`. No unit tests, no component tests, no integration tests for any production frontend code (`features/auth/`, `stores/`, `routes/`, `components/`).
- Files: `apps/web/src/features/auth/` (all files untested)
- Risk: Auth flow regressions (form validation, store mutations, navigation on success/error) go undetected.
- Priority: High — the mock auth will be replaced soon and must not regress silently.

## Test Coverage Gaps

**Chat Endpoints `/complete` and `/stream` Have No Auth Tests:**
- What's not tested: Whether unauthenticated callers can access `POST /api/v1/chat/complete` and `POST /api/v1/chat/stream`. These endpoints have no auth dependencies.
- Files: `apps/api/src/domains/chat/router/chat_router.py:208-309`
- Risk: Security regression — if auth is added later, no test would catch a misconfigured dependency.
- Priority: High

**SSE Stream + DB Persistence Integration Path Not Tested:**
- What's not tested: The `send_message` SSE path that persists the assistant message in the `finally` block after the stream completes.
- Files: `apps/api/src/domains/chat/router/chat_router.py:503-543`
- Risk: Silent data loss — assistant message not persisted when session is closed before `finally` executes.
- Priority: Medium

**No Integration Tests Against Real PostgreSQL for Auth Flows:**
- What's not tested: Auth repository methods against a live database (only in-memory `FakeAuthRepository` is used in `tests/auth/`). Migration correctness is tested in `tests/test_migrations.py` but query correctness under real PostgreSQL constraints (unique index races, nullable columns) is not verified.
- Files: `apps/api/tests/auth/conftest.py` (uses `FakeAuthRepository` only)
- Risk: Race conditions in signup (double-insert between `get_user_by_email` check and `create_user`) caught only by the `IntegrityError` fallback, not by tests.
- Priority: Medium

---

*Concerns audit: 2026-05-17*
