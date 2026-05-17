# Phase 1: 인증 연동 - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

프론트엔드의 mock auth(`mock-auth-api.ts`)를 제거하고 실제 FastAPI JWT 백엔드와 연결한다.
토큰 저장, 세션 복원, 라우트 보호, 관리자 사용자 관리 UI를 포함한다.
새로운 백엔드 도메인이나 소설 관련 기능은 이 Phase의 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 토큰 저장 전략
- **D-01:** `access_token`과 `refresh_token` 모두 `localStorage`에 저장한다.
- **D-02:** 백엔드 변경 없음 — 기존 `TokenResponse(access_token, refresh_token)` 그대로 사용.
- **D-03:** httpOnly cookie 방식은 채택하지 않는다 (백엔드 CORS/Set-Cookie 수정 불필요).

### 라우트 가드 구현 방식
- **D-04:** TanStack Router의 `_authenticated.tsx` layout route (B 방식) 채택.
- **D-05:** `apps/web/src/routes/_authenticated.tsx`에 `beforeLoad`로 인증 체크 — 미인증 시 `/auth/login`으로 `redirect()`.
- **D-06:** Phase 2~4의 소설/챕터/세계관 라우트는 전부 `_authenticated/` 하위에 배치하여 가드 자동 상속.
- **D-07:** `apps/web/src/routes/auth/` (login, signup)는 `_authenticated` 밖에 위치 — 보호 없음.

### 세션 복원 전략
- **D-08:** 앱 마운트 시 `localStorage`에 `access_token`이 존재하면 `GET /api/v1/auth/me`를 호출하여 유저 정보를 복원한다.
- **D-09:** `/me` 성공 → `useAuthStore.setUser()` 호출하여 인증 상태 복원.
- **D-10:** `/me` 실패(401) → `localStorage` 토큰 삭제 + `useAuthStore.clearUser()` + `/auth/login` 리다이렉트.
- **D-11:** 복원 진행 중에는 앱 전체 또는 protected 영역에 로딩 상태(스피너)를 표시한다.
- **D-12:** 세션 복원 로직은 `__root.tsx` 또는 별도 `useInitAuth()` 훅으로 구현한다 (구체적 위치는 planner 판단).

### 관리자 페이지 UI 범위
- **D-13:** 백엔드 관리자 엔드포인트는 최소 3개만 추가한다:
  - `GET  /api/v1/admin/users` — 사용자 목록 (페이지네이션)
  - `POST /api/v1/admin/users/{id}/activate` — 계정 활성화
  - `POST /api/v1/admin/users/{id}/deactivate` — 계정 비활성화
- **D-14:** 모든 관리자 엔드포인트는 `require_permission("admin:users")` 의존성으로 보호한다 (기존 RBAC 패턴 재사용).
- **D-15:** 프론트엔드 관리자 라우트는 `_authenticated/admin/users.tsx` 형태로 추가한다.
- **D-16:** `apps/web/src/sample/users/` 샘플 UI를 레퍼런스로 참고하되, production 코드는 `features/admin/` 또는 `features/users/` 아래에 새로 작성한다.
- **D-17:** 사용자 상세 페이지, 계정 삭제, 역할 변경은 이 Phase에서 구현하지 않는다.

### Claude's Discretion
- `useInitAuth()` 훅의 정확한 위치(`__root.tsx` 인라인 vs 별도 훅 파일) — D-12 참고, planner가 기존 코드 패턴에 맞춰 결정.
- 로딩 스피너의 구체적인 컴포넌트 — 기존 UI 라이브러리(@base-ui/react, Radix) 활용하여 결정.
- 관리자 페이지 페이지네이션 방식(offset vs cursor) — AUTH-04 범위에서 planner 결정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항
- `.planning/REQUIREMENTS.md` §AUTH — AUTH-01, AUTH-02, AUTH-03, AUTH-04 전문
- `.planning/ROADMAP.md` §Phase 1 — Success Criteria 4개 항목

### 기존 프론트엔드 auth 코드 (교체/수정 대상)
- `apps/web/src/features/auth/lib/mock-auth-api.ts` — 제거 대상. 실제 API 호출로 교체
- `apps/web/src/features/auth/hooks/use-auth-mutation.ts` — `mutationFn`을 실제 API로 교체
- `apps/web/src/features/auth/store/auth.store.ts` — `AuthUser` 타입 확장 필요 (id, roles 등 추가)
- `apps/web/src/features/auth/types/auth.ts` — 타입 정의 확장 필요
- `apps/web/src/routes/__root.tsx` — 세션 복원 로직 추가 위치
- `apps/web/src/routes/auth/login.tsx` — 기존 라우트 유지, 위치만 확인
- `apps/web/src/routes/auth/signup.tsx` — 기존 라우트 유지

### 백엔드 auth 코드 (참조 및 확장 대상)
- `apps/api/src/domains/auth/router/auth_router.py` — 기존 엔드포인트 목록 및 패턴
- `apps/api/src/domains/auth/schemas/auth_schemas.py` — `TokenResponse`, `UserResponse` 스키마
- `apps/api/src/domains/auth/security.py` — `require_permission()` RBAC 패턴, `get_current_user` 의존성
- `apps/api/src/domains/auth/service/auth_service.py` — 서비스 레이어 패턴 참조
- `apps/api/src/domains/auth/repository/auth_repository.py` — 리포지토리 패턴 참조

### 아키텍처 패턴
- `.planning/codebase/ARCHITECTURE.md` — 레이어 구조, AppError 패턴, 프론트엔드 상태 분리 규칙
- `.planning/codebase/INTEGRATIONS.md` §Authentication — JWT TTL, Redis blacklist, OAuth 엔드포인트

### 샘플 레퍼런스 (production 코드 아님)
- `apps/web/src/sample/users/` — 관리자 사용자 목록 UI 참고용

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAuthStore` (`auth.store.ts`): `setUser()` / `clearUser()` 그대로 재사용. `AuthUser` 타입만 확장.
- `useLoginMutation()` / `useSignupMutation()` (`use-auth-mutation.ts`): useMutation 훅 구조 유지, `mutationFn`만 교체.
- `login-form.tsx` / `signup-form.tsx`: UI 컴포넌트 그대로 재사용 가능.
- `require_permission("admin:users")` (`security.py`): 관리자 엔드포인트 보호에 즉시 적용 가능.
- `_app_error_to_http()` (`auth_router.py`): 관리자 라우터에도 동일 패턴 적용.

### Established Patterns
- **백엔드 레이어**: Router → Service → Repository. Service는 `AppError` 서브클래스만 raise, `HTTPException` 직접 사용 금지.
- **프론트엔드 상태**: Zustand(클라이언트 상태) + React Query(서버 상태). React Context 사용 금지.
- **폼 검증**: `react-hook-form` + `zodResolver` + `zod` 스키마.
- **라우팅**: `createFileRoute()` 사용. `routeTree.gen.ts` 직접 편집 금지.
- **에러 피드백**: `sonner` 토스트 (`toast.success()`, `toast.error()`).

### Integration Points
- `apps/web/src/routes/__root.tsx` — 세션 복원 훅 마운트 위치
- `apps/web/src/routes/_authenticated.tsx` — 신규 생성. 모든 보호 라우트의 부모
- `apps/api/src/main.py` — 관리자 라우터 `include_router()` 등록 위치
- `apps/api/src/domains/auth/router/auth_router.py` — `GET /auth/me` 엔드포인트 확인 후 프론트엔드 연결

</code_context>

<specifics>
## Specific Ideas

- 세션 복원은 `useInitAuth()` 훅으로 분리하는 것이 선호됨 — `__root.tsx`에서 호출
- 관리자 엔드포인트는 별도 라우터 파일(`admin_router.py`)로 분리하여 `auth_router.py`와 혼재 방지 권장
- `_authenticated.tsx` layout route는 `beforeLoad`에서 `useAuthStore` 상태 대신 localStorage 토큰 존재 여부로 1차 체크, `/me` 복원 완료 여부로 2차 체크하는 구조 권장

</specifics>

<deferred>
## Deferred Ideas

- 사용자 상세 페이지, 계정 삭제, 역할 변경 — Phase 1 범위 초과. 필요 시 별도 Phase 삽입
- OAuth 소셜 로그인 프론트엔드 연결 (Google, Kakao, Naver) — 백엔드는 완성, 프론트엔드 연결은 이번 Phase 요구사항 없음. 후속 Phase에서 결정
- refresh token 자동 갱신 인터셉터 (access token 만료 시 자동 재발급) — Phase 1 MVP에서는 수동 재로그인으로 대응, 이후 개선

</deferred>

---

*Phase: 1-인증 연동*
*Context gathered: 2026-05-17*
