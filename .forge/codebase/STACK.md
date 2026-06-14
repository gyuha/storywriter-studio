---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# STACK

StoryWriter Studio는 모노레포다. `apps/api/` (FastAPI 백엔드, src 레이아웃 DDD)와 `apps/web/` (React 19 프론트엔드). 프론트엔드는 HeyAPI가 생성한 SDK(`apps/web/src/generated/`)로 백엔드를 호출한다.

## Languages & Runtimes

- **Python 3.12** — 백엔드. `requires-python = ">=3.12"` (`apps/api/pyproject.toml`). mypy/ruff target도 `py312`.
- **TypeScript 5.8** — 프론트엔드. `typescript@^5.8.3` (`apps/web/package.json`), strict 모드 (`apps/web/tsconfig.json`).
- **Node.js >=18.17.0, pnpm >=10.0.0** — 프론트엔드 빌드/개발. `engines` + `packageManager: pnpm@10.28.2` (`apps/web/package.json`).
- **uv** — 백엔드 패키지/의존성 관리. `[tool.uv]` (`apps/api/pyproject.toml`), 락파일 `apps/api/uv.lock`.

## Backend Frameworks & Key Dependencies

선언 위치: `apps/api/pyproject.toml` (`[project].dependencies`).

- **웹 프레임워크**: `fastapi[standard]>=0.115.0`, `uvicorn[standard]>=0.30.0`, `python-multipart>=0.0.12`. 앱 팩토리: `apps/api/src/main.py` (`create_app()`, lifespan, CORS, slowapi).
- **검증/설정**: `pydantic>=2.9.0`, `pydantic-settings>=2.5.0`, `email-validator>=2.2.0`. 설정 싱글톤: `apps/api/src/core/config.py` (`lru_cache` 기반 `get_settings()`).
- **DB / ORM**: `sqlalchemy[asyncio]>=2.0.36`, `alembic>=1.14.0`, `asyncpg>=0.30.0` (async 드라이버), `psycopg2-binary>=2.9.9` (Alembic 전용 sync 드라이버). 엔진/세션: `apps/api/src/core/database.py`. 마이그레이션: `apps/api/alembic/` + `apps/api/alembic.ini`.
- **Auth / 보안**: `python-jose[cryptography]>=3.3.0` (JWT, 기본 알고리즘 HS256 — `apps/api/src/core/config.py`의 `jwt_algorithm`), `passlib[argon2]>=1.7.4` + `argon2-cffi>=23.1.0` (Argon2 비밀번호 해싱).
- **캐시/Pub-Sub**: `redis[hiredis]>=5.2.0`. 클라이언트 풀: `apps/api/src/core/redis.py` (`redis.asyncio`).
- **HTTP 클라이언트**: `httpx>=0.27.0` — OAuth 토큰 교환에 사용 (`apps/api/src/domains/auth/oauth/*.py`).
- **이메일**: `fastapi-mail>=1.4.2` — `apps/api/src/domains/auth/email.py`.
- **관측성/로깅**: `structlog>=24.4.0` — 설정 `apps/api/src/core/logging.py`, correlation-id 미들웨어 `apps/api/src/core/middleware.py`. `print()` 금지 (ruff `T20`).
- **레이트 리미팅**: `slowapi>=0.1.9` — `apps/api/src/main.py`의 `Limiter(key_func=_get_user_key)`, Redis 백엔드, per-user/per-IP.
- **스트리밍/LLM**: `sse-starlette>=2.1.0` (SSE 토큰 스트리밍), `langchain>=0.3.0` + `langchain-core>=0.3.0` + `langchain-community>=0.3.0`, `langchain-litellm>=0.2.0` (`ChatLiteLLM` 어댑터), `litellm>=1.50.0` (멀티 프로바이더 라우팅), `tenacity>=8.5.0` (LLM 일시 오류 재시도). 자세한 통합은 INTEGRATIONS.md 참조.

## Frontend Frameworks & Key Dependencies

선언 위치: `apps/web/package.json`.

- **UI 프레임워크**: `react@^19.0.0` + `react-dom@^19.0.0`. 엔트리 `apps/web/src/main.tsx`, 루트 라우트 `apps/web/src/routes/__root.tsx`.
- **라우팅**: `@tanstack/react-router@^1.95.0` (파일 기반 라우팅). 생성 파일 `apps/web/src/routeTree.gen.ts` (편집 금지). 라우트 디렉터리 `apps/web/src/routes/`.
- **서버 상태**: `@tanstack/react-query@^5.75.0` — `useQuery`/`useMutation`.
- **클라이언트 상태**: `zustand@^5.0.3` + `immer@^11.1.4`. 스토어 `apps/web/src/stores/`, `apps/web/src/features/*/store/`.
- **폼/검증**: `react-hook-form@^7.55.0` + `@hookform/resolvers@^4.1.3` + `zod@^3.24.2`.
- **스타일링**: `tailwindcss@^4.0.0` + `@tailwindcss/vite`, `tailwind-merge@^2.6.0` + `clsx@^2.1.1` + `class-variance-authority@^0.7.1`, `tw-animate-css@^1.4.0`.
- **UI 프리미티브**: `@base-ui/react@^1.4.1`, `radix-ui@^1.4.3` + `@radix-ui/react-*`, `lucide-react@^0.487.0` (아이콘), `cmdk@^1.1.1` (커맨드 팔레트), `sonner@^2.0.3` (토스트), `recharts@^3.8.1` (차트), `react-day-picker@^10.0.0`, `@tanstack/react-table@^8.21.3`, `react-focus-lock@^2.13.7`.
- **에디터**: `@tiptap/react@^3.23.4` + `@tiptap/starter-kit` + `@tiptap/extension-character-count` + `@tiptap/extension-link` + `@tiptap/pm`. 챕터 에디터 `apps/web/src/features/novel/components/chapter-editor.tsx`.
- **드래그 앤 드롭**: `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (챕터 순서 정렬).
- **애니메이션**: `motion@^11.18.0` (Framer Motion).
- **API SDK**: `@hey-api/client-fetch@^0.13.1` (런타임 fetch 클라이언트). 생성 SDK `apps/web/src/generated/`. 클라이언트 설정/인터셉터 `apps/web/src/lib/api-client.ts`.
- **i18n**: `i18next@^26.0.10` + `react-i18next@^17.0.7`가 의존성에 선언되어 있으나, 프로덕션 `apps/web/src/`에서는 `initReactI18next`/`useTranslation` 사용처가 발견되지 않았고 i18n 코드는 `apps/web/src/sample/i18n/`(참고용)에만 존재한다. [중간]
- **기타 유틸**: `date-fns@^4.1.0`, `use-debounce@^10.1.1`, `@faker-js/faker@^10.4.0` (목 데이터), `@fontsource-variable/inter@^5.1.1`.

## Build / Dev Tooling

### 백엔드

- **빌드 백엔드**: `hatchling`, src 레이아웃 (`[tool.hatch.build.targets.wheel] packages = ["src"]`) — `apps/api/pyproject.toml`.
- **린터/포매터**: `ruff>=0.8.0`. line-length 100, target py312, 활성 룰셋 `E,W,F,I,N,UP,B,C4,SIM,ANN,S,T20,PT,RUF`. format: double quote, space indent, lf. 설정 `[tool.ruff]` (`apps/api/pyproject.toml`).
- **타입 체커**: `mypy>=1.13.0`, `strict = true`, 플러그인 `pydantic.mypy` + `sqlalchemy.ext.mypy.plugin`.
- **테스트**: `pytest>=8.3.0` + `pytest-asyncio>=0.24.0` (`asyncio_mode = "auto"`) + `pytest-cov>=5.0.0` (`--cov-fail-under=70`), `anyio>=4.6.0`, `fakeredis>=2.26.0` (인메모리 Redis 스텁). 마커: `unit`, `integration`, `e2e`. 테스트 트리 `apps/api/tests/`.
- **사전 커밋**: `pre-commit>=4.0.0` + `detect-secrets>=1.5.0`. 설정 `apps/api/.pre-commit-config.yaml`, 베이스라인 `apps/api/.secrets.baseline`.
- **태스크 러너**: `apps/api/Justfile`, `apps/api/Taskfile.yml`, 루트 `/Users/gyuha/workspace/storywriter-studio/Taskfile.yml`.

### 프론트엔드

- **번들러/개발 서버**: `vite@^6.0.0` + `@vitejs/plugin-react@^4.3.4`. 설정 `apps/web/vite.config.ts` — 개발 서버 포트 3000, `/api` → `http://localhost:8000` 프록시.
- **Vite 플러그인**: `@tanstack/router-plugin@^1.95.0` (라우트 트리 생성, autoCodeSplitting), `@tailwindcss/vite@^4.0.0`, `vite-tsconfig-paths@^5.1.4` (`@/*` → `./src/*`).
- **린터/포매터**: `@biomejs/biome@^1.9.4`. space indent(2), lineWidth 100, single quote, trailing comma `es5`. 설정 `apps/web/biome.json` (`src/routeTree.gen.ts`, `src/generated/**` 무시).
- **TypeScript**: strict, target ES2022, moduleResolution Bundler, `noEmit`. 설정 `apps/web/tsconfig.json`, `apps/web/tsconfig.node.json`.
- **API 코드 생성**: `@hey-api/openapi-ts@^0.97.1`. 설정 `apps/web/openapi-ts.config.ts` — 입력 `apps/web/openapi.json`, 출력 `apps/web/src/generated/`, 플러그인 `@hey-api/typescript`, `@hey-api/sdk`, `@hey-api/client-fetch`. 스크립트 `pnpm generate:api`.
- **스크립트** (`apps/web/package.json`): `dev`(vite), `build`(`tsc -b && vite build`), `preview`, `typecheck`(`tsc --noEmit`), `lint`/`lint:fix`(biome), `format`(biome).
- **컴포넌트 메타**: `apps/web/components.json` (shadcn 계열 구성).

## Deployment / Container

- **백엔드 Docker**: 멀티스테이지 빌드 `apps/api/Dockerfile` (`python:3.12-slim-bookworm` 기반). 개발 인프라 `apps/api/docker-compose.yml`, 프로덕션 오버레이 `apps/api/docker-compose.prod.yml`. 서버는 uvicorn, 워커 수 `WORKERS` 환경변수로 제어 (`apps/api/src/main.py`).

## Configuration Approach

- **백엔드**: 모든 설정은 환경변수 또는 `.env`로 주입되고 pydantic-settings가 로드한다. 단일 진실 공급원 `apps/api/src/core/config.py`의 `Settings`/`LLMSettings`. 예시 파일 `apps/api/.env.example`, `apps/api/.env.prod.example`. DSN(`async_database_url`, `sync_database_url`, `redis_dsn`)과 메일/LLM kwargs는 computed property로 파생된다.
- **프론트엔드**: Vite `VITE_*` prefix 관례. 런타임 API base URL은 `apps/web/src/lib/api-client.ts`에서 `client.setConfig({ baseUrl: '' })`로 설정(개발 시 vite 프록시 경유), `access_token`은 `localStorage`에서 읽어 request 인터셉터가 `Authorization: Bearer` 헤더로 주입.
