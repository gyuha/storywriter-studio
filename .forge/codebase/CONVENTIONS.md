---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# CONVENTIONS

코드 스타일과 툴링 규약. 백엔드(`apps/api/`, Python 3.12)와 프론트엔드(`apps/web/`, TypeScript 5.8) 양쪽을 다룬다.

## 백엔드 — Python (`apps/api/`)

### Ruff (린터 + 포매터)

설정 출처: `apps/api/pyproject.toml` (`[tool.ruff]`).

- `target-version = "py312"`, `line-length = 100`, `src = ["src"]`
- 포맷: `quote-style = "double"`, `indent-style = "space"`, `line-ending = "lf"`
- 활성 룰셋 (`[tool.ruff.lint] select`):
  - `E`, `W` (pycodestyle), `F` (Pyflakes), `I` (isort), `N` (pep8-naming),
    `UP` (pyupgrade), `B` (flake8-bugbear), `C4` (comprehensions), `SIM` (simplify),
    `ANN` (annotations / 타입 힌트), `S` (bandit 보안), `T20` (print 금지),
    `PT` (pytest-style), `RUF` (Ruff 고유)
- 전역 ignore: `ANN401` (프레임워크/LLM 경계의 동적 kwargs), `S101` (assert), `B008` (FastAPI DI 기본값 호출)
- per-file-ignores: `tests/**`는 `S101 ANN T20 ...` 등 완화, `alembic/**`·`scripts/**`도 별도 완화. `src/core/config.py`는 `S104`, `src/domains/auth/oauth/*.py`는 `S105`.

### Mypy (정적 타입 검사)

설정 출처: `apps/api/pyproject.toml` (`[tool.mypy]`).

- `python_version = "3.12"`, `strict = true`, `mypy_path = ["src"]`, `explicit_package_bases = true`
- 플러그인: `pydantic.mypy`, `sqlalchemy.ext.mypy.plugin`
- strict 완화: `disallow_any_generics = false`, `warn_return_any = false` (프로토타입 반복용)
- `ignore_missing_imports = true` 대상 모듈: `fastapi_mail.*`, `passlib.*`, `jose.*`, `alembic.*`, `redis.*`, `slowapi.*`, `langchain*.*`, `litellm.*`

실행 명령: `uv run ruff check .` / `uv run ruff format .` / `uv run mypy src/`

### 네이밍 패턴

- 모듈: `snake_case` — 도메인 파일은 `<name>_router.py`, `<name>_service.py`, `<name>_repository.py`, `<name>_models.py`, `<name>_schemas.py` 형태. 예: `apps/api/src/domains/novel/router/novel_router.py`, `apps/api/src/domains/novel/service/novel_service.py`.
- 클래스: `PascalCase` — `AuthService`, `NovelService`, `AppError`.
- 상수: `UPPER_SNAKE_CASE`. `StrEnum` 서브클래스는 소문자 값 (`LLMProvider.openai`).
- private 헬퍼: `_` prefix — `_app_error_to_http`, `_get_novel_service`, `_error_response`.
- 비동기 함수는 동기 함수와 동일한 이름 사용 (`async_` prefix 없음).

### Pydantic 스키마 네이밍

`<Entity><Role>` 규약. 출처: `apps/api/src/domains/auth/schemas/auth_schemas.py` 헤더 docstring과 실제 클래스.

- `<Entity>Response` — 응답 바디 (`UserResponse`, `NovelResponse`, `AdminUserResponse`). 절대 `hashed_password` 미포함.
- `<Entity>Create` — 생성 요청 바디 (`NovelCreate`, `ChapterCreate`).
- `<Entity>Update` — 수정 요청 바디 (`NovelUpdate`, `ChapterUpdate`).
- `<Entity>Request` — create/update에 안 맞는 일반 요청 (`SignupRequest`, `ChapterReorderRequest`).

### Pydantic v2 패턴

- ORM 연동 응답 모델: `model_config = {"from_attributes": True}` 또는 `ConfigDict(from_attributes=True)`. 예: `UserResponse`, `AdminUserResponse` (`apps/api/src/domains/auth/schemas/admin_schemas.py`).
- 필드 제약: `Field(min_length=8, max_length=128)` (`SignupRequest.password`).
- 정규화: `@field_validator("email", mode="before")` + `@classmethod`. 예: `SignupRequest.normalize_email` — 입력을 `strip().lower()` 후 `EmailStr` 검증.
- `EmailStr` 사용 (email-validator 의존성으로 활성화).

### 에러 처리

`AppError` 계층 — 정의 출처: `apps/api/src/core/exceptions.py`.

- 베이스: `AppError(Exception)` — `message`, `status_code` 보유 (기본 400).
- 서브클래스: `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `ForbiddenError` (403).
- **Service 레이어**: `AppError` 서브클래스를 raise. `HTTPException`을 절대 직접 raise하지 않음. 예: `NovelService` (`apps/api/src/domains/novel/service/novel_service.py`)는 `NotFoundError`, `ForbiddenError` raise.
- **Router 레이어**: `try/except AppError`로 잡아 `_app_error_to_http(e)`로 변환. 출처: `apps/api/src/domains/novel/router/novel_router.py:77` — `HTTPException(status_code=error.status_code, detail=error.message)`. 패턴: `except AppError as e: raise _app_error_to_http(e) from e`.
- 전역 핸들러 (`register_exception_handlers`, 동일 파일): `HTTPException`, `RequestValidationError`(422, `_sanitize_validation_errors`로 직렬화 불가 객체 제거), 처리되지 않은 `Exception`(500, 안전 메시지)을 처리. 모든 응답에 `X-Correlation-ID` 헤더 포함.

```
Service raises AppError → Router catches → _app_error_to_http() → HTTPException
                                              ↓ (전역 핸들러)
                          HTTPException / RequestValidationError / Exception → JSONResponse
```

### 로깅

- `structlog` 사용, `print()` 금지 (`T20` ruff 룰로 강제).
- 모듈 단위 로거: `logger = structlog.get_logger(__name__)`.
- 이벤트 형식: `logger.info("event_name", key=value)`. 출처: `apps/api/src/domains/auth/service/auth_service.py` — `logger.info("user_created", user_id=str(user.id), email=...)`, `logger.info("email_verified", user_id=...)`, `logger.warning(...)`.
- 프로덕션은 JSON, 개발은 콘솔 포맷.

## 프론트엔드 — TypeScript (`apps/web/`)

### Biome (린터 + 포매터, ESLint+Prettier 대체)

설정 출처: `apps/web/biome.json`.

- 스키마: `@biomejs/biome` 1.9.4
- `organizeImports.enabled = true`
- 린터: `rules.recommended = true`
- 포매터: `indentStyle: "space"`, `indentWidth: 2`, `lineWidth: 100`
- JS 포매터: `quoteStyle: "single"`, `trailingCommas: "es5"`
- 무시 대상: `node_modules`, `dist`, `.superpowers`, `src/routeTree.gen.ts`, `src/generated/**`

실행 명령 (`apps/web/package.json` scripts): `pnpm lint` (`biome check .`), `pnpm lint:fix` (`biome check --write .`), `pnpm format` (`biome format --write .`).

### TypeScript 설정

출처: `apps/web/tsconfig.json`.

- `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `jsx: react-jsx`
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules: true`, `noEmit: true`
- 경로 별칭: `@/*` → `./src/*`
- 타입 체크: `pnpm typecheck` (`tsc --noEmit`); 빌드는 `tsc -b && vite build`.

### 네이밍 패턴

- React 컴포넌트 파일: `PascalCase.tsx`.
- 비컴포넌트 모듈: `kebab-case.ts` — `novel-api.ts`, `use-novel-mutations.ts`, `order-key.ts`, `modal-store.ts`.
- Zustand 스토어: `<name>-store.ts` (예: `apps/web/src/stores/modal-store.ts`). 타입은 `modal.types.ts`.
- 훅: `camelCase`, `use` prefix — `useCreateNovelMutation`, `useChapterAutosave`. 파일명은 `use-*.ts`.
- Zod 스키마: `<name>-schema.ts` (sample 영역에서 관측, 예: `schema/sign-in-schema.ts`).
- **Named exports만 사용** (default export 없음). 예: `apps/web/src/features/novel/hooks/use-novel-mutations.ts`, `apps/web/src/features/novel/lib/novel-api.ts` 모두 named export.

### 피처 구조

`apps/web/src/features/<domain>/` (현재: `auth`, `novel`, `world`, `admin`):

```
components/   React 컴포넌트
hooks/        useQuery / useMutation 래퍼 (use-*.ts)
lib/          generated SDK 래핑 API 호출 (*-api.ts)
store/        Zustand 슬라이스 (필요 시에만)
types/        TypeScript 타입
schema/       Zod 스키마 (폼 검증)
```

### API 호출 패턴

`features/*/lib/*-api.ts`에서 generated SDK(`@/generated/sdk.gen`)를 래핑. 출처: `apps/web/src/features/novel/lib/novel-api.ts`.

```ts
const { data, error } = await someGeneratedSdkFn({ ... });
if (error) throwOnError(error);   // error 객체를 Error로 변환
return data as SomeType;
```

`throwOnError`는 백엔드 응답의 `detail` 필드를 파싱한다 — string이면 그대로, array면 첫 항목의 `.msg`, 그 외엔 기본 메시지(`'오류가 발생했습니다'`)로 `Error`를 throw. `src/generated/`와 `src/routeTree.gen.ts`는 자동 생성물 — 직접 편집 금지.

### 에러 처리 (프론트엔드)

- 뮤테이션 에러: `useMutation`의 `onError`에서 `toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')`. 출처: `apps/web/src/features/novel/hooks/use-novel-mutations.ts`.
- 성공 토스트: `onSuccess`에서 `sonner`의 `toast.success(...)` + `queryClient.invalidateQueries(...)`로 캐시 무효화.
- `sonner` 토스트 사용; React Query `useMutation`의 `isError`/`error` 상태로 폼 단위 에러도 표시.

### 상태 관리

- **Zustand** — 클라이언트 전역 상태 (`src/stores/`, `src/features/*/store/`). `create<T>()(devtools(...))` 패턴. 출처: `apps/web/src/stores/modal-store.ts`.
- **React Query** — 서버 상태 / 비동기 데이터 (`useQuery`, `useMutation`).
- 피처 간 공유 상태에 React Context 사용 금지 — Zustand 슬라이스로 대체.

### 폼

- `react-hook-form` + `@hookform/resolvers`의 `zodResolver`로 모든 폼 검증.
- Tailwind 클래스는 `cn()` 유틸(`clsx` + `tailwind-merge`)로 결합.
- 애니메이션은 `motion/react`.
