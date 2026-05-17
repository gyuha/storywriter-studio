# External Integrations

**Analysis Date:** 2026-05-17

## APIs & External Services

**LLM Providers (backend — one active at a time, switched via `LLM_PROVIDER`):**
- OpenAI — GPT-4o, GPT-4o-mini, etc.
  - SDK/Client: `litellm` + `langchain-litellm` (`apps/api/src/infra/llm/provider_factory.py`)
  - Auth: `OPENAI_API_KEY`
  - Model string format: `openai/<model>`
- Anthropic — Claude 3.5 Sonnet, Claude 3.5 Haiku, etc.
  - SDK/Client: `litellm` + `langchain-litellm`
  - Auth: `ANTHROPIC_API_KEY`
  - Model string format: `anthropic/<model>`
- Google Gemini — gemini-1.5-flash, gemini-2.0-flash, etc.
  - SDK/Client: `litellm` + `langchain-litellm`
  - Auth: `GEMINI_API_KEY`
  - Model string format: `gemini/<model>`
- Azure OpenAI
  - SDK/Client: `litellm` + `langchain-litellm`
  - Auth: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`
  - Model string format: `azure/<deployment>`
- Ollama (local inference — no API key)
  - SDK/Client: `litellm` + `langchain-litellm`
  - Auth: none (local)
  - Config: `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
  - Model string format: `ollama/<model>`

All LLM routing is encapsulated in `apps/api/src/infra/llm/provider_factory.py` (`make_chat_litellm()`) and `apps/api/src/core/config.py` (`LLMSettings.as_litellm_kwargs()`). Changing `LLM_PROVIDER` in `.env` is the only switch needed.

## Data Storage

**Databases:**
- PostgreSQL 16 (primary relational database)
  - Connection: `DATABASE_URL` (async, `postgresql+asyncpg://`) or component vars `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - Sync DSN for migrations: `DATABASE_URL_SYNC` (`postgresql+psycopg2://`)
  - Client: SQLAlchemy 2.0 async ORM (`apps/api/src/core/database.py`)
  - Migrations: Alembic (`apps/api/alembic/`)
  - Dev: Docker container via `apps/api/docker-compose.yml` (`postgres:16-alpine`)
  - Async driver: asyncpg; Sync driver (Alembic only): psycopg2-binary

**File Storage:**
- Local filesystem only — no object storage (S3/GCS/etc.) detected

**Caching / Pub-Sub:**
- Redis 7
  - Connection: `REDIS_URL` or component vars `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`
  - Client: `redis[hiredis]` (`apps/api/src/core/redis.py`)
  - Uses: JWT blacklist, refresh token reuse detection, rate limiting (slowapi), OAuth state nonce, SSE fan-out channel
  - Dev: Docker container via `apps/api/docker-compose.yml` (`redis:7-alpine`)

## Authentication & Identity

**Auth Implementation (custom, no third-party auth SaaS):**
- JWT access + refresh tokens (`apps/api/src/domains/auth/security.py`)
  - Library: `python-jose[cryptography]` (HS256)
  - Access token TTL: `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (default: 15 min)
  - Refresh token TTL: `JWT_REFRESH_TOKEN_EXPIRE_DAYS` (default: 7 days)
  - Rotation + reuse detection via Redis blacklist
  - Secrets: `JWT_SECRET_KEY`, `SECRET_KEY`
- Password hashing: Argon2 via `passlib[argon2]` + `argon2-cffi`

**OAuth Providers (social login):**
- Google OAuth 2.0 (`apps/api/src/domains/auth/oauth/google.py`)
  - Config: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - Callback: `GET /api/v1/auth/oauth/google/callback`
- Kakao OAuth (`apps/api/src/domains/auth/oauth/kakao.py`)
  - Config: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`
  - Callback: `GET /api/v1/auth/oauth/kakao/callback`
- Naver OAuth (`apps/api/src/domains/auth/oauth/naver.py`)
  - Config: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_REDIRECT_URI`
  - Callback: `GET /api/v1/auth/oauth/naver/callback`
- HTTP client for OAuth flows: `httpx` (`apps/api/src/domains/auth/oauth/`)

**Frontend Auth (mock only):**
- `apps/web/src/features/auth/lib/mock-auth-api.ts` — frontend uses mock auth calls; no real API connection wired in current frontend code
- Auth state via Zustand store: `apps/web/src/features/auth/store/auth.store.ts`

## Email

**Transactional Email:**
- Library: `fastapi-mail` >=1.4.2 (`apps/api/src/domains/auth/email.py`)
- Dev: Mailpit local SMTP server (Docker container, `axllent/mailpit:latest`)
  - SMTP: `localhost:1025` (mapped from `MAILPIT_SMTP_PORT`)
  - Web UI: `http://localhost:8025` (mapped from `MAILPIT_UI_PORT`)
- Production: Any SMTP provider (AWS SES, SendGrid, Postmark, etc.)
  - Config: `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_STARTTLS`, `MAIL_SSL_TLS`
- Connection assembled in `apps/api/src/core/config.py` (`settings.mail_connection_config`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, etc.)

**Logs:**
- structlog >=24.4.0 (`apps/api/src/core/logging.py`)
  - Format: JSON (default) or console (set `LOG_FORMAT=console`)
  - Level: `LOG_LEVEL` env var (default: `INFO`)
  - Correlation ID injected per-request via `CorrelationIdMiddleware` (`apps/api/src/core/middleware.py`)

**Health Endpoints:**
- `GET /health` — service liveness check
- `GET /ready` — readiness check; verifies PostgreSQL, Redis, and SMTP connectivity
- Both defined in `apps/api/src/main.py`

## CI/CD & Deployment

**Containerization:**
- Docker multi-stage build (`apps/api/Dockerfile`)
- Docker Compose for dev infrastructure (`apps/api/docker-compose.yml`)
- Production overlay: `apps/api/docker-compose.prod.yml`

**CI Pipeline:**
- None detected in repository (no GitHub Actions, GitLab CI, etc.)

**Hosting:**
- Not specified — Dockerfile is self-contained; deploy anywhere that runs Docker

## Environment Configuration

**Required env vars (backend):**
- `SECRET_KEY` — application secret (generate: `openssl rand -hex 32`)
- `JWT_SECRET_KEY` — JWT signing secret (must differ from `SECRET_KEY`)
- `DATABASE_URL` or `POSTGRES_*` component vars — PostgreSQL connection
- `DATABASE_URL_SYNC` — Alembic sync DSN
- `REDIS_URL` or `REDIS_*` component vars — Redis connection
- `LLM_PROVIDER` — active LLM provider (`openai` | `anthropic` | `gemini` | `azure` | `ollama`)
- LLM API key matching active provider (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / etc.)
- OAuth credentials for any enabled providers

**Secrets location:**
- `.env` file at `apps/api/` (never committed; templated from `apps/api/.env.example`)
- Production: `apps/api/.env.prod` (templated from `apps/api/.env.prod.example`)

## Webhooks & Callbacks

**Incoming:**
- OAuth callback endpoints (backend):
  - `GET /api/v1/auth/oauth/google/callback`
  - `GET /api/v1/auth/oauth/kakao/callback`
  - `GET /api/v1/auth/oauth/naver/callback`

**Outgoing:**
- None detected

## Streaming

**LLM Token Streaming:**
- Protocol: Server-Sent Events (SSE)
- Library: `sse-starlette` >=2.1.0 (backend)
- Fan-out channel: Redis pub/sub
- Controlled by: `LLM_STREAMING=true` env var (default enabled)
- Chat domain SSE streaming: `apps/api/src/domains/chat/`

---

*Integration audit: 2026-05-17*
