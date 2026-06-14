---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# INTEGRATIONS

외부 시스템 통합 목록과 설정 위치. 모든 자격증명/엔드포인트는 환경변수 → pydantic-settings(`apps/api/src/core/config.py`)를 경유한다. 예시값은 `apps/api/.env.example`, `apps/api/.env.prod.example`에 있다.

## LLM 프로바이더 (LangChain + LiteLLM)

다중 LLM 프로바이더를 `litellm`으로 라우팅한다. 지원 프로바이더(`LLMProvider` StrEnum, `apps/api/src/core/config.py`): `openai`, `anthropic`, `gemini`, `azure`, `ollama`. 프로바이더 교체는 `LLM_PROVIDER` 환경변수 + 해당 API 키 변경만으로 가능하다.

- **격리 경계**: `langchain_litellm` (`ChatLiteLLM`)을 임포트하는 곳은 `apps/api/src/infra/llm/provider_factory.py`의 `make_chat_litellm()` 단 한 곳이다. 나머지 코드는 `apps/api/src/domains/chat/ports.py`의 Protocol/ABC에 의존한다.
- **설정 파생**: `LLMSettings.as_litellm_kwargs()` / `litellm_model` (`apps/api/src/core/config.py`). 모델 식별자는 `<provider>/<model>` 형식 (예: `openai/gpt-4o-mini`, `anthropic/claude-...`, `gemini/...`, `azure/<deployment>`, `ollama/<model>`).
- **프로바이더별 자격증명** (`apps/api/src/core/config.py`):
  - OpenAI — `OPENAI_API_KEY`
  - Anthropic — `ANTHROPIC_API_KEY`
  - Gemini — `GEMINI_API_KEY`
  - Azure OpenAI — `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`(api_base), `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`(기본 `2024-08-01-preview`)
  - Ollama — `OLLAMA_BASE_URL`(기본 `http://localhost:11434`), API 키 불필요(litellm 센티넬 `"ollama"`)
- **생성 파라미터**: `LLM_DEFAULT_MODEL`(기본 `gpt-4o-mini`), `LLM_TEMPERATURE`(기본 0.7), `LLM_MAX_TOKENS`(기본 2048), `LLM_STREAMING`(기본 true).
- **클라이언트 래퍼**: `apps/api/src/domains/chat/llm_client.py` (`LLMClient`, `DefaultLLMClientFactory`, `get_llm_client` DI). `langchain_core.messages`는 `apps/api/src/domains/chat/llm_client.py`와 `apps/api/src/domains/novel/router/draft_router.py`에서 메시지 구성에 사용(의도적 설계).
- **재시도**: `tenacity`로 일시적 LLM 오류 재시도(`apps/api/pyproject.toml` 의존성).

## SSE 토큰 스트리밍 (`sse-starlette`)

LLM 응답을 SSE로 스트리밍한다. `EventSourceResponse`를 실제 반환하는 엔드포인트:

- `apps/api/src/domains/chat/router/chat_router.py:309` — `POST /chat/stream` (스트리밍 챗 컴플리션, `[DONE]` 센티넬).
- `apps/api/src/domains/chat/router/chat_router.py:544` — 추가 스트리밍 엔드포인트.
- `apps/api/src/domains/novel/router/draft_router.py:142` — `POST /novels/{novel_id}/chapters/{chapter_id}/draft` (챕터 AI 초안 생성 스트리밍).
- 서비스 레이어 생성기: `apps/api/src/domains/chat/service/chat_service.py:72`.

Redis는 SSE fan-out pub/sub 채널 용도로도 명시되어 있다(`apps/api/src/core/redis.py` docstring).

## 데이터베이스: PostgreSQL

- **드라이버**: async = `asyncpg`(`postgresql+asyncpg://`), Alembic sync = `psycopg2`(`postgresql+psycopg2://`). DSN 파생: `Settings.async_database_url` / `sync_database_url` (`apps/api/src/core/config.py`).
- **엔진/세션**: `apps/api/src/core/database.py` (SQLAlchemy async).
- **설정 변수**: `DATABASE_URL` 또는 `POSTGRES_HOST/PORT/USER/PASSWORD/DB`. Alembic 전용 `DATABASE_URL_SYNC`.
- **마이그레이션**: `apps/api/alembic/` (`env.py`는 sync DSN을 강제 — asyncpg DSN 거부), `apps/api/alembic.ini`.
- **개발 컨테이너**: `apps/api/docker-compose.yml`의 `postgres` 서비스, 이미지 `postgres:17-alpine`, `127.0.0.1:${POSTGRES_PORT:-5432}:5432`. (주의: 루트 `CLAUDE.md`는 "PostgreSQL 16"으로 기술하나 compose 파일 실제 이미지는 `postgres:17-alpine`이다. [높음])

## 캐시 / 데이터스토어: Redis

- **클라이언트**: `redis.asyncio` 풀, `apps/api/src/core/redis.py` (`get_redis_client`, `get_redis_dep`, `close_redis_client`). 앱 시작 시 lifespan에서 ping warm-up (`apps/api/src/main.py`).
- **용도**(`apps/api/src/core/redis.py` docstring): JWT 블랙리스트(jti + TTL), refresh 토큰 재사용 탐지, OAuth state nonce(짧은 TTL), 레이트 리미팅(slowapi), 일반 캐시, SSE fan-out pub/sub.
- **설정 변수**: `REDIS_URL` 또는 `REDIS_HOST/PORT/DB`. DSN 파생 `Settings.redis_dsn`.
- **개발 컨테이너**: `apps/api/docker-compose.yml`의 `redis` 서비스, 이미지 `redis:7-alpine`, `127.0.0.1:${REDIS_PORT:-6379}:6379`.

## 인증: JWT + OAuth (RBAC)

- **JWT**: `python-jose`, 알고리즘 `HS256`(`JWT_ALGORITHM`), 비밀키 `JWT_SECRET_KEY`. access 만료 15분, refresh 7일(`apps/api/src/core/config.py`). 블랙리스트는 Redis.
- **비밀번호 해싱**: Argon2 (`passlib[argon2]` + `argon2-cffi`).
- **OAuth 프로바이더** (`apps/api/src/domains/auth/oauth/`, `httpx`로 토큰 교환, state nonce는 CSRF 방어):
  - **Google** — `apps/api/src/domains/auth/oauth/google.py`. 엔드포인트: `accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`, `googleapis.com/oauth2/v3/userinfo`. 변수: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
  - **Kakao** — `apps/api/src/domains/auth/oauth/kakao.py`. 엔드포인트: `kauth.kakao.com/oauth/authorize`, `kauth.kakao.com/oauth/token`, `kapi.kakao.com/v2/user/me`. 변수: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`.
  - **Naver** — `apps/api/src/domains/auth/oauth/naver.py`. 엔드포인트: `nid.naver.com/oauth2.0/authorize`, `nid.naver.com/oauth2.0/token`, `openapi.naver.com/v1/nid/me`. 변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_REDIRECT_URI`.
- **프론트엔드 토큰 처리**: `apps/web/src/lib/api-client.ts` — `localStorage`의 `access_token`을 request 인터셉터가 `Authorization: Bearer`로 주입. 인증 라우트 가드 `apps/web/src/routes/_authenticated.tsx`.

## 이메일 (SMTP / Mailpit)

- **라이브러리**: `fastapi-mail` (`FastMail`, `ConnectionConfig`). 발송 헬퍼 `apps/api/src/domains/auth/email.py` (이메일 검증, 비밀번호 재설정 메일).
- **연결 설정**: `Settings.mail_connection_config` (`apps/api/src/core/config.py`)가 flat 설정에서 kwargs를 조립. 변수: `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_STARTTLS`, `MAIL_SSL_TLS`. `USE_CREDENTIALS`는 username 존재 여부로 자동 결정.
- **개발**: Mailpit. `apps/api/docker-compose.yml`의 `mailpit` 서비스, 이미지 `axllent/mailpit:latest`, SMTP `127.0.0.1:${MAILPIT_SMTP_PORT:-1025}:1025`, Web UI `127.0.0.1:${MAILPIT_UI_PORT:-8025}:8025`. 기본 `MAIL_SERVER=localhost`, `MAIL_PORT=1025`(익명 SMTP).
- **프로덕션**: 실제 SMTP relay 값을 환경변수로 주입(`docker-compose.prod.yml` / `.env.prod`).
- **프론트 연계**: 비밀번호 재설정 메일은 `FRONTEND_RESET_CONFIRM_URL_BASE`(기본 `http://localhost:3000/auth/reset-confirm`)에 토큰을 붙여 링크 생성.

## 헬스/레디니스 체크

`apps/api/src/main.py`의 `/health`, `/ready`. `/ready`는 PostgreSQL(`SELECT 1`), Redis(ping), Mailpit SMTP(220 배너 확인)에 대해 실제 네트워크 점검을 수행하고 모두 통과 시 200, 아니면 503을 반환한다. docker-compose healthcheck/로드밸런서용.

## 프론트엔드 ↔ 백엔드 계약

- 백엔드 OpenAPI 스펙(`apps/web/openapi.json`)으로부터 HeyAPI가 SDK(`apps/web/src/generated/`)를 생성한다(`pnpm generate:api`, 설정 `apps/web/openapi-ts.config.ts`).
- 개발 시 Vite가 `/api` → `http://localhost:8000`로 프록시(`apps/web/vite.config.ts`). 백엔드 라우터 prefix는 `/api/v1`(`apps/api/src/main.py`).

## 관측성

- `structlog` JSON 구조화 로깅 + correlation-id. 설정 `apps/api/src/core/logging.py`, 미들웨어 `apps/api/src/core/middleware.py`(응답 헤더 `X-Correlation-ID` expose). 외부 APM/트레이싱 익스포터는 발견되지 않았다. [높음]

## 미발견 / 부재 항목

- 결제, 객체 스토리지(S3 등), 외부 webhook, 푸시/SMS, 외부 분석/텔레메트리 SaaS 통합은 코드베이스에서 발견되지 않았다. [중간]
