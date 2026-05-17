# External Integrations

**Analysis Date:** 2026-05-17

## APIs & External Services

**LLM Providers (via LiteLLM routing):**
- OpenAI — GPT-4o, GPT-4o-mini, etc.
  - SDK/Client: `langchain-litellm` / `litellm` >=1.50.0
  - Auth: `OPENAI_API_KEY` env var
- Anthropic — Claude 3.5 Sonnet, Claude 3.5 Haiku, etc.
  - SDK/Client: `langchain-litellm` / `litellm`
  - Auth: `ANTHROPIC_API_KEY` env var
- Google Gemini — gemini-1.5-flash, gemini-2.0-flash, etc.
  - SDK/Client: `langchain-litellm` / `litellm`
  - Auth: `GEMINI_API_KEY` env var
- Azure OpenAI — deployment-name based routing
  - SDK/Client: `langchain-litellm` / `litellm`
  - Auth: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`
- Ollama (local inference) — no API key; runs locally
  - SDK/Client: `langchain-litellm` / `litellm`
  - Auth: none (local); `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

**Provider isolation:** Only `apps/api/src/infra/llm/provider_factory.py` imports `langchain_litellm`. All domain code depends solely on `apps/api/src/domains/chat/ports.py` Protocol/ABC. Switching providers requires only changing `LLM_PROVIDER` env var.

**OAuth Providers:**
- Google OAuth 2.0 / OpenID Connect
  - Adapter: `apps/api/src/domains/auth/oauth/google.py`
  - Endpoints: `accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`, `www.googleapis.com/oauth2/v3/userinfo`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Kakao OAuth 2.0
  - Adapter: `apps/api/src/domains/auth/oauth/kakao.py`
  - Endpoints: `kauth.kakao.com/oauth/authorize`, `kauth.kakao.com/oauth/token`, `kapi.kakao.com/v2/user/me`
  - Auth: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`
- Naver OAuth 2.0
  - Adapter: `apps/api/src/domains/auth/oauth/naver.py`
  - Endpoints: `nid.naver.com/oauth2.0/authorize`, `nid.naver.com/oauth2.0/token`, `openapi.naver.com/v1/nid/me`
  - Auth: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_REDIRECT_URI`

**HTTP Client for OAuth flows:**
- Library: `httpx` >=0.27.0 (`httpx.AsyncClient`)
- Used by all three OAuth adapters for token exchange and userinfo fetches

## Data Storage

**Databases:**
- PostgreSQL 16 (primary relational store)
  - Connection: `DATABASE_URL` (full DSN) or `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
  - Async client: `asyncpg` >=0.30.0 via SQLAlchemy asyncio engine (`apps/api/src/core/database.py`)
  - Sync client: `psycopg2-binary` >=2.9.9 (Alembic migrations only)
  - ORM: SQLAlchemy 2.0 async (`AsyncSession`, `async_sessionmaker`)
  - Migrations: Alembic >=1.14.0 (`apps/api/alembic/`)

**File Storage:**
- Local filesystem only (no cloud object storage detected)

**Caching / Pub-Sub:**
- Redis 7
  - Connection: `REDIS_URL` (full DSN) or `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB`
  - Client: `redis[hiredis]` >=5.2.0 async (`apps/api/src/core/redis.py`)
  - Pool: single shared async instance, max 20 connections
  - Uses:
    - JWT blacklist (jti strings with TTL = token expiry)
    - Refresh-token reuse detection
    - OAuth state nonce (short TTL, CSRF protection)
    - Rate limiting (slowapi backend)
    - SSE fan-out pub/sub channel

## Authentication & Identity

**Auth Provider: Custom (JWT + OAuth)**
- Implementation: `apps/api/src/domains/auth/` (service, repository, router, security)
- JWT: `python-jose[cryptography]` >=3.3.0; algorithm HS256; access token 15 min, refresh 7 days
- Password hashing: `passlib[argon2]` + `argon2-cffi` (Argon2 algorithm)
- Security helpers: `apps/api/src/domains/auth/security.py`
- JWT blacklist: stored in Redis (invalidates tokens on logout)
- OAuth social login: Google, Kakao, Naver (adapters in `apps/api/src/domains/auth/oauth/`)
- Frontend auth: currently mocked — `apps/web/src/features/auth/lib/mock-auth-api.ts` is used instead of real API calls; FastAPI backend not yet wired to frontend

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or equivalent detected)

**Logs:**
- structlog >=24.4.0 (`apps/api/src/core/logging.py`)
- JSON format in production, console format in development
- Correlation ID middleware adds `X-Correlation-ID` header and binds it to all log entries (`apps/api/src/core/middleware.py`)
- Log level controlled via `LOG_LEVEL` env var (default: `INFO`)

**Health Endpoints:**
- `GET /health` — always returns `{"status": "ok"}` (used by load balancers, Docker healthcheck)
- `GET /ready` — checks PostgreSQL, Redis, SMTP reachability; returns 503 if any fail

## CI/CD & Deployment

**Hosting:**
- Docker containers via `docker-compose.prod.yml` + base `apps/api/docker-compose.yml`
- Production image: `python:3.12-slim-bookworm`, pre-compiled `/runtime-venv`, no dev tools
- Uvicorn ASGI server; multiple workers via `WORKERS` env var

**CI Pipeline:**
- No CI config file detected (GitHub Actions, GitLab CI, etc. not found)

## Email

**Provider:**
- Development: Mailpit (local SMTP capture server, runs via Docker Compose on port 1025; web UI on 8025)
- Production: Any SMTP provider via `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` env vars
- Library: `fastapi-mail` >=1.4.2 (`apps/api/src/domains/auth/email.py`)
- Transactional emails: email verification, password reset
- Config assembled in `apps/api/src/core/config.py` `mail_connection_config` property

## Environment Configuration

**Required env vars (backend):**
- `SECRET_KEY` — app-level signing key
- `JWT_SECRET_KEY` — JWT HS256 signing key
- `DATABASE_URL` or `POSTGRES_HOST`/`PORT`/`USER`/`PASSWORD`/`DB`
- `REDIS_URL` or `REDIS_HOST`/`PORT`/`DB`
- `LLM_PROVIDER` — active LLM provider (`openai` | `anthropic` | `gemini` | `azure` | `ollama`)
- API key for active LLM provider (e.g. `OPENAI_API_KEY`)

**Optional env vars:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — Google OAuth
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` / `KAKAO_REDIRECT_URI` — Kakao OAuth
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` / `NAVER_REDIRECT_URI` — Naver OAuth
- `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` — SMTP
- `CORS_ORIGINS` — allowed origins (JSON array or comma-separated)
- `LOG_LEVEL` / `LOG_FORMAT` — logging

**Secrets location:**
- `.env` file (not committed; template at `apps/api/.env.example`)
- Production: `.env.prod` (template at `apps/api/.env.prod.example`)
- pydantic-settings loads via `apps/api/src/core/config.py` singleton

## Webhooks & Callbacks

**Incoming OAuth callbacks:**
- `GET /api/v1/auth/oauth/google/callback` — Google OAuth redirect
- `GET /api/v1/auth/oauth/kakao/callback` — Kakao OAuth redirect
- `GET /api/v1/auth/oauth/naver/callback` — Naver OAuth redirect

**Outgoing:**
- None (backend initiates OAuth flows via httpx but no outgoing webhooks)

**SSE (Server-Sent Events):**
- LLM token streaming uses `sse-starlette` >=2.1.0
- Fan-out via Redis pub/sub
- Consumed by frontend via EventSource (not yet wired — frontend uses mock auth)

---

*Integration audit: 2026-05-17*
