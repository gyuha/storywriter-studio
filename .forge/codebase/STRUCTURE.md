---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# STRUCTURE

모노레포 루트는 `/Users/gyuha/workspace/storywriter-studio`다. 두 앱이 `apps/` 아래에 있다: `apps/api/`(FastAPI 백엔드), `apps/web/`(React 19 프론트엔드). 루트에는 `Taskfile.yml`, `CLAUDE.md`, `package.json`이 있다.

## Repository top level

```
/Users/gyuha/workspace/storywriter-studio/
  apps/
    api/        # FastAPI 백엔드 (uv, Python 3.12)
    web/        # React 19 프론트엔드 (pnpm)
  Taskfile.yml
  CLAUDE.md     # 루트 프로젝트 지침
  package.json
  .forge/codebase/   # 본 매핑 문서 위치
```

## Backend layout (`apps/api/`)

소스는 `apps/api/src/` 아래 src 레이아웃이다. 도메인은 `apps/api/src/domains/<name>/`에 위치하며 각 도메인은 동일한 하위 폴더 구조를 갖는다.

```
apps/api/src/
  main.py            # FastAPI 앱 팩토리, 미들웨어/라우터 등록, lifespan, Limiter
  __main__.py        # python -m 실행 진입점
  core/              # 횡단 관심사 (도메인 import 금지)
    config.py        # 설정 싱글톤 (pydantic-settings, lru_cache)
    database.py      # async SQLAlchemy 엔진/세션
    exceptions.py    # AppError 계층 + 전역 예외 핸들러 등록
    logging.py       # structlog 설정
    middleware.py    # CorrelationIdMiddleware
    redis.py         # Redis 풀, JWT 블랙리스트
  infra/
    llm/
      provider_factory.py   # langchain_litellm.ChatLiteLLM 유일 import 지점
  domains/
    shared/          # DDD 기반 타입 (Entity, AggregateRoot), events, types
    auth/            # 인증, JWT, OAuth, RBAC, 사용자 관리
    novel/           # 소설, 챕터, 스토리 비트, AI 초안
    world/           # 캐릭터, 장소, 관계, 타임라인, 세계관 설정
    chat/            # LLM 채팅 (ports.py Protocol 기반)
```

### Per-domain structure

각 도메인은 `router/ · service/ · repository/ · models/ · schemas/`로 구성된다(`apps/api/src/domains/auth/`가 표준 템플릿). `chat`은 추가로 LLM 격리용 파일(`ports.py`, `container.py`, `llm_client.py`, `llm_factory.py`)을 가진다.

| Domain | 주요 파일 위치 |
|--------|------|
| `auth` | router: `auth_router.py`, `admin_router.py` / service: `auth_service.py` / repository: `auth_repository.py` / models: `auth_models.py` / schemas: `auth_schemas.py`, `admin_schemas.py` / 추가: `email.py`, `security.py`, `oauth/{google,kakao,naver}.py` |
| `novel` | router: `novel_router.py`, `draft_router.py`, `story_beat_router.py` / service: `novel_service.py`, `chapter_service.py` / repository: `novel_repository.py`, `chapter_repository.py` / models: `novel_models.py` / schemas: `novel_schemas.py` |
| `world` | router: `world_router.py`, `character_router.py`, `location_router.py`, `relationship_router.py`, `timeline_router.py`, `world_setting_router.py` / service·repository는 character/location/relationship/timeline/world_setting 별로 분리 / models: `world_models.py` / schemas: `world_schemas.py` |
| `chat` | router: `chat_router.py` / service: `chat_service.py` / repository: `chat_repository.py` / models: `chat_models.py` / schemas: `chat_schemas.py` / 격리: `ports.py`, `container.py`, `llm_client.py`, `llm_factory.py` |
| `shared` | `base.py`(Entity/AggregateRoot), `events.py`, `types.py` |

`world` 라우터는 `world_router.py`가 prefix `/novels/{novel_id}`로 하위 라우터들을 include하는 집합 구조다(`apps/api/src/domains/world/router/world_router.py:28-33`). `novel` 라우터는 prefix `/novels`로 `draft_router`, `story_beat_router`를 include한다(`apps/api/src/domains/novel/router/novel_router.py:55-57`).

### Backend naming conventions

- 모듈: `snake_case` — 파일명에 도메인 접두 (`<name>_router.py`, `<name>_service.py`, `<name>_repository.py`, `<name>_models.py`, `<name>_schemas.py`).
- 클래스: `PascalCase` (`AuthService`, `ChatService`). Pydantic 스키마는 `<Entity><Role>` (`SignupRequest`, `UserResponse`).
- 상수: `UPPER_SNAKE_CASE`. `StrEnum` 값은 소문자.
- 프라이빗 헬퍼는 `_` 접두 (`_app_error_to_http`, `_register_routers`). async/sync 동일 이름(`async_` 접두 없음).
- 라인 길이 100, 더블 쿼트, 스페이스 인덴트(ruff + mypy strict).

## Frontend layout (`apps/web/`)

소스는 `apps/web/src/` 아래에 있다. 경로 별칭 `@/*` → `./src/*`.

```
apps/web/src/
  main.tsx           # 앱 엔트리 (RouterProvider, i18n/api-client import)
  routes/            # TanStack Router 파일 기반 라우팅
    __root.tsx       # 루트 라우트 (AppProviders, Toaster, Modals, useInitAuth)
    _authenticated.tsx          # 인증 게이트 (access_token 없으면 /auth/login redirect)
    _authenticated/
      index.tsx
      admin/users.tsx
      novels/index.tsx
      novels/$novelId/index.tsx
      novels/$novelId/characters/index.tsx
      novels/$novelId/lorebook/index.tsx
      novels/$novelId/world/index.tsx
      novels/$novelId/chapters/$chapterId/edit.tsx
    auth/login.tsx, auth/signup.tsx
    sample/          # 개발 참고용 UI (프로덕션 아님)
    routeTree.gen.ts # 자동 생성 — 편집 금지
  features/          # 도메인별 피처 (auth, novel, world, admin)
  generated/         # HeyAPI 생성 SDK — 편집 금지
  providers/
    app-providers.tsx  # QueryClientProvider
  stores/            # Zustand 전역 슬라이스
    modal-store.ts, modal.types.ts
  components/        # 공용 컴포넌트 (ui/, layout/, dev/)
  hooks/  lib/  styles/
  sample/            # 참고용 UI 컴포넌트 (프로덕션 아님)
```

### Feature structure (`apps/web/src/features/`)

현재 피처: `auth`, `novel`, `world`, `admin`. 각 피처는 `components/`, `hooks/`, `lib/`, `types/`를 갖고 필요 시 `store/`(Zustand), `schema/`(Zod)를 둔다.

```
apps/web/src/features/<domain>/
  components/   # React 컴포넌트 (PascalCase는 컴포넌트명, 파일은 kebab-case)
  hooks/        # useQuery/useMutation 래퍼 (use-*.ts)
  lib/          # API 호출 함수, generated SDK 래핑 (*-api.ts)
  types/        # TypeScript 타입
  store/         # Zustand 슬라이스 (auth 등 필요한 피처만)
  schema/        # Zod 폼 검증 스키마 (*.schema.ts)
```

피처별 실제 구성:
- `auth` — `store/auth.store.ts`(useAuthStore), `schema/auth.schema.ts`, `lib/auth-api.ts`, `hooks/use-auth-mutation.ts`, `hooks/use-init-auth.ts`.
- `novel` — 챕터 에디터(`components/chapter-editor.tsx`), 자동저장 훅(`hooks/use-chapter-autosave.ts`), AI 초안 훅(`hooks/use-ai-draft.ts`), 정렬 유틸(`lib/order-key.ts`), `lib/{novel,chapter,beat}-api.ts`.
- `world` — 캐릭터 그래프(`components/character-graph.tsx`), `schema/`, `lib/world-api.ts`, `hooks/use-world-{queries,mutations}.ts`.
- `admin` — `components/`, `hooks/`, `types/`(store/schema 없음).

### Generated SDK (`apps/web/src/generated/`)

HeyAPI(`@hey-api/openapi-ts`)가 백엔드 `openapi.json`으로부터 생성한다. 직접 편집 금지이며 `pnpm generate:api`로 재생성한다.

```
apps/web/src/generated/
  index.ts        # SDK 함수 + 타입 재export
  sdk.gen.ts      # 엔드포인트별 함수 (예: listNovelsApiV1NovelsGet)
  types.gen.ts    # 요청/응답 타입 (NovelResponse, ChapterCreate 등)
  client.gen.ts   # 클라이언트 인스턴스
  client/  core/  # 런타임 클라이언트
```

### Frontend naming conventions

- React 컴포넌트 파일: `PascalCase.tsx` 명칭의 컴포넌트지만 파일명은 `kebab-case.tsx`(예: `chapter-editor.tsx`). 비컴포넌트 모듈: `kebab-case.ts`.
- Stores: `<name>.store.ts`. Zod 스키마: `<name>.schema.ts`. API 래퍼: `<name>-api.ts`.
- Hooks: `use` 접두 `camelCase`(파일은 `use-*.ts`). 상수: `UPPER_SNAKE_CASE`.
- 기본 export 금지 — named export만 사용.
- Biome: 스페이스 인덴트(2), 라인 100, 싱글 쿼트, trailing comma `es5`.

## Where things live (quick reference)

| 찾는 것 | 위치 |
|--------|------|
| 새 백엔드 도메인 추가 시 본보기 | `apps/api/src/domains/auth/` |
| 백엔드 라우터 등록 | `apps/api/src/main.py` `_register_routers()` |
| AppError 정의 | `apps/api/src/core/exceptions.py` |
| LLM 프로바이더 어댑터 | `apps/api/src/infra/llm/provider_factory.py` |
| Chat LLM 포트/DI | `apps/api/src/domains/chat/ports.py`, `container.py` |
| 프론트 라우트 정의 | `apps/web/src/routes/` (`routeTree.gen.ts` 자동 생성) |
| 인증 게이트 | `apps/web/src/routes/_authenticated.tsx` |
| 전역 모달 스택 | `apps/web/src/stores/modal-store.ts` |
| 인증 Zustand 슬라이스 | `apps/web/src/features/auth/store/auth.store.ts` |
| API 클라이언트(Bearer 주입) | `apps/web/src/lib/api-client.ts` |
| 라우터 인스턴스 | `apps/web/src/lib/router.ts` |
| 생성된 백엔드 SDK | `apps/web/src/generated/` |
