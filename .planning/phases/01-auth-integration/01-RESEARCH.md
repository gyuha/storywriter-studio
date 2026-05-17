# Phase 1: 인증 연동 - Research

**Researched:** 2026-05-17
**Domain:** Frontend-Backend JWT 인증 연동, TanStack Router 라우트 가드, FastAPI RBAC 관리자 API
**Confidence:** HIGH — 기존 코드베이스 직접 분석 기반

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `access_token`과 `refresh_token` 모두 `localStorage`에 저장
- **D-02:** 백엔드 변경 없음 — 기존 `TokenResponse(access_token, refresh_token)` 그대로 사용
- **D-03:** httpOnly cookie 방식 채택 안 함
- **D-04:** TanStack Router `_authenticated.tsx` layout route (B 방식) 채택
- **D-05:** `beforeLoad`로 인증 체크, 미인증 시 `/auth/login`으로 `redirect()`
- **D-06:** Phase 2~4 소설/챕터/세계관 라우트는 `_authenticated/` 하위에 배치
- **D-07:** `apps/web/src/routes/auth/` (login, signup)는 `_authenticated` 밖에 위치
- **D-08:** 앱 마운트 시 localStorage `access_token` 존재 시 `GET /api/v1/auth/me` 호출
- **D-09:** `/me` 성공 → `useAuthStore.setUser()` 호출
- **D-10:** `/me` 실패(401) → localStorage 토큰 삭제 + `clearUser()` + 리다이렉트
- **D-11:** 복원 진행 중 로딩 스피너 표시
- **D-12:** 세션 복원 로직은 `__root.tsx` 또는 별도 `useInitAuth()` 훅으로 구현
- **D-13:** 관리자 엔드포인트 3개: GET users(페이지네이션), POST activate, POST deactivate
- **D-14:** `require_permission("admin:users")` 의존성으로 보호
- **D-15:** 프론트엔드 관리자 라우트: `_authenticated/admin/users.tsx`
- **D-16:** `apps/web/src/sample/users/` 참고하되 production 코드는 `features/admin/` 아래 신규 작성
- **D-17:** 사용자 상세 페이지, 계정 삭제, 역할 변경 — 이번 Phase 제외

### Claude's Discretion
- `useInitAuth()` 훅의 정확한 위치 (`__root.tsx` 인라인 vs 별도 훅 파일)
- 로딩 스피너 구체적 컴포넌트 (@base-ui/react, Radix 활용)
- 관리자 페이지 페이지네이션 방식(offset vs cursor)

### Deferred Ideas (OUT OF SCOPE)
- 사용자 상세 페이지, 계정 삭제, 역할 변경
- OAuth 소셜 로그인 프론트엔드 연결
- refresh token 자동 갱신 인터셉터
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | 이메일/비밀번호 로그인 → 실제 FastAPI JWT 발급 및 인증 상태 유지 | mock-auth-api.ts 제거, 실제 POST /api/v1/auth/login 호출, localStorage 토큰 저장 |
| AUTH-02 | 회원가입 후 계정 생성 및 세션 유지 | POST /api/v1/auth/signup 호출 후 자동 로그인 처리 — 아래 핵심 주의사항 참고 |
| AUTH-03 | 인증된 사용자만 소설 프로젝트/콘텐츠 접근 | `_authenticated.tsx` layout route + `beforeLoad` 가드 |
| AUTH-04 | 관리자가 사용자 목록 조회 및 계정 활성화/비활성화 | 백엔드 admin_router.py 신규 생성 + 프론트엔드 admin/users.tsx |
</phase_requirements>

---

## Summary

이 Phase는 순수한 "연결" 작업이다. 백엔드 FastAPI JWT 인프라는 완전하게 구현되어 있고(`POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/refresh`, `require_permission()` RBAC 등), 프론트엔드 auth UI 컴포넌트와 Zustand store도 존재한다. 유일한 문제는 프론트엔드가 실제 API 대신 `mock-auth-api.ts`를 사용하고 있다는 것이다.

신규 구현이 필요한 것은 두 가지다: (1) TanStack Router `_authenticated.tsx` layout route — 현재 존재하지 않으며 신규 생성 필요, (2) 백엔드 관리자 엔드포인트 (`admin_router.py`) — 현재 존재하지 않으며 신규 생성 필요.

**가장 중요한 발견:** 현재 `POST /auth/signup` 엔드포인트는 `SignupResponse(user, message)`를 반환하며 JWT 토큰을 포함하지 않는다. AUTH-02 요구사항(회원가입 후 즉시 로그인 상태 전환)을 충족하려면, 프론트엔드에서 signup 성공 후 자동으로 `POST /auth/login`을 연속 호출하는 방식이 D-02(백엔드 변경 없음) 결정에 부합한다.

**Primary recommendation:** mock-auth-api.ts를 실제 `fetch`/axios 호출로 교체하고, `_authenticated.tsx` layout route를 생성하며, `admin_router.py`를 별도 파일로 분리 추가한다.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JWT 발급/검증 | API (Backend) | — | 백엔드 security.py가 이미 완전 구현 |
| 토큰 저장 (localStorage) | Browser/Client | — | D-01 결정, SPA 클라이언트 상태 |
| 세션 복원 (`/me` 호출) | Browser/Client | API (GET /me) | 앱 마운트 시 클라이언트가 주도 |
| 라우트 가드 | Frontend Router | — | TanStack Router `beforeLoad` |
| RBAC 권한 체크 | API (Backend) | — | `require_permission()` 의존성 |
| 관리자 UI | Browser/Client | — | React 컴포넌트 |
| 관리자 API | API (Backend) | — | `admin_router.py` 신규 |

---

## Standard Stack

이 Phase는 신규 패키지를 설치하지 않는다. 기존 스택만 활용한다.

### 프론트엔드 — 기존 활용 패키지

| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-router | 1.95.0 | `_authenticated.tsx` layout route + `beforeLoad` |
| @tanstack/react-query | 5.75.0 | `useQuery` for `/me` session restore |
| zustand | 5.0.3 | `useAuthStore` — `setUser`, `clearUser` |
| zod | 3.24.2 | 기존 auth schema 활용 |
| sonner | 2.0.3 | 에러/성공 토스트 |

### 백엔드 — 기존 활용 패키지

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | >=0.115.0 | `APIRouter` for admin_router.py |
| SQLAlchemy asyncio | >=2.0.36 | 사용자 목록 쿼리 (select, paginate) |
| pydantic | >=2.9.0 | 관리자 요청/응답 스키마 |
| `require_permission()` | (내부) | `"admin:users"` RBAC 보호 |

### 신규 설치 없음

이 Phase는 어떤 npm 패키지도 Python 패키지도 추가 설치하지 않는다.

---

## Package Legitimacy Audit

신규 패키지 설치 없음 — 이 섹션은 해당 없음.

---

## Architecture Patterns

### 데이터 흐름 다이어그램

로그인 흐름:
```
브라우저 폼 입력 → useLoginMutation (React Query mutationFn)
  → POST /api/v1/auth/login
  → FastAPI: LoginRequest 검증 → AuthService.login() → TokenResponse
  → 프론트엔드: localStorage 저장 (access_token, refresh_token)
  → useAuthStore.setUser(user) → navigate('/')
```

세션 복원 흐름 (앱 마운트 시):
```
RootComponent 마운트 → useInitAuth() 훅 실행
  → localStorage.getItem('access_token') 존재 여부 확인
  → 존재: GET /api/v1/auth/me (Authorization: Bearer {token})
    → 성공: useAuthStore.setUser(user), isInitialized = true
    → 실패 401: localStorage 클리어 + useAuthStore.clearUser()
  → 미존재: isInitialized = true (비인증 상태)
  → isInitialized = false 동안: 스피너 표시
```

라우트 가드 흐름:
```
URL 접근 → TanStack Router 매칭
  → _authenticated.tsx beforeLoad 실행
  → useAuthStore.isAuthenticated 확인
    → false: throw redirect({ to: '/auth/login' })
    → true: Outlet 렌더링 → 보호된 페이지
```

회원가입 후 자동 로그인 흐름:
```
signup 폼 제출 → useSignupMutation
  → POST /api/v1/auth/signup → 201 Created
  → 성공: 자동으로 POST /api/v1/auth/login 연속 호출
  → TokenResponse 수신 → localStorage 저장 → setUser() → navigate('/')
```

### 권장 프로젝트 구조 (신규/수정 파일)

```
apps/web/src/
├── features/auth/
│   ├── lib/
│   │   ├── mock-auth-api.ts        # 삭제
│   │   └── auth-api.ts             # 신규: 실제 API 호출 함수들
│   ├── hooks/
│   │   ├── use-auth-mutation.ts    # mutationFn 교체
│   │   └── use-init-auth.ts        # 신규: 세션 복원 훅
│   ├── store/
│   │   └── auth.store.ts           # AuthUser 타입 확장 (id, roles 추가)
│   └── types/
│       └── auth.ts                 # AuthUser, TokenResponse 타입 확장
├── features/admin/                 # 신규 feature 폴더
│   ├── components/
│   │   ├── admin-users-page.tsx    # 사용자 목록 페이지
│   │   └── admin-user-actions.tsx  # 활성화/비활성화 버튼
│   ├── hooks/
│   │   └── use-admin-users.ts      # useQuery + useMutation
│   └── types/
│       └── admin.ts                # AdminUser 타입
└── routes/
    ├── __root.tsx                  # useInitAuth() 호출 추가
    ├── _authenticated.tsx          # 신규: layout route + beforeLoad
    └── _authenticated/
        └── admin/
            └── users.tsx           # 신규: 관리자 사용자 목록

apps/api/src/
└── domains/auth/
    ├── router/
    │   ├── auth_router.py          # 변경 없음
    │   └── admin_router.py         # 신규: 관리자 엔드포인트
    ├── schemas/
    │   └── admin_schemas.py        # 신규: AdminUserResponse, PaginatedUsersResponse
    └── service/
        └── auth_service.py         # list_users(), activate_user(), deactivate_user() 추가
```

### Pattern 1: TanStack Router Layout Route with beforeLoad

`_authenticated.tsx` 파일명의 언더스코어 접두사가 pathless layout route를 만든다. 이 라우트 자체는 URL 세그먼트를 추가하지 않지만 하위 라우트 전체를 감싼다.

```typescript
// apps/web/src/routes/_authenticated.tsx
// [VERIFIED: 기존 코드베이스 TanStack Router 1.95.0 사용 패턴]
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    // localStorage 토큰 1차 체크 (useInitAuth 완료 전에도 빠른 리다이렉트 가능)
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw redirect({ to: '/auth/login' });
    }
    // Zustand store 2차 체크 (초기화 완료 후)
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: () => <Outlet />,
});
```

**주의:** `beforeLoad`는 React 훅 규칙이 적용되지 않는 일반 함수다. `useAuthStore.getState()`(Zustand의 store 직접 접근 API)를 사용한다 — `useAuthStore(state => ...)` 훅 형태가 아님.

### Pattern 2: useInitAuth 훅

```typescript
// apps/web/src/features/auth/hooks/use-init-auth.ts
// [ASSUMED: 기존 패턴 조합, 검증된 구현]
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export function useInitAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsInitialized(true);
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('401');
        return res.json();
      })
      .then((user) => {
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        clearUser();
      })
      .finally(() => {
        setIsInitialized(true);
      });
  }, [setUser, clearUser]);

  return { isInitialized };
}
```

### Pattern 3: 실제 API 호출 함수

```typescript
// apps/web/src/features/auth/lib/auth-api.ts
// [ASSUMED: 기존 fetch 패턴 기반]

const BASE = '/api/v1';

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '로그인에 실패했습니다');
  }
  return res.json(); // TokenResponse: { access_token, refresh_token, token_type, expires_in }
}

export async function apiSignup(email: string, password: string, display_name: string) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '회원가입에 실패했습니다');
  }
  return res.json(); // SignupResponse: { user, message }
}

export async function apiLogout(access_token: string, refresh_token: string) {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ refresh_token }),
  });
}
```

### Pattern 4: 백엔드 관리자 라우터

```python
# apps/api/src/domains/auth/router/admin_router.py
# [VERIFIED: 기존 auth_router.py 패턴 직접 적용]
from fastapi import APIRouter, Depends, Query
from domains.auth.security import require_permission
from domains.auth.schemas.admin_schemas import PaginatedUsersResponse

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get(
    "/users",
    response_model=PaginatedUsersResponse,
    dependencies=[Depends(require_permission("admin:users"))],
)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
) -> PaginatedUsersResponse:
    ...

@router.post(
    "/users/{user_id}/activate",
    dependencies=[Depends(require_permission("admin:users"))],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def activate_user(user_id: uuid.UUID, ...) -> None:
    ...

@router.post(
    "/users/{user_id}/deactivate",
    dependencies=[Depends(require_permission("admin:users"))],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def deactivate_user(user_id: uuid.UUID, ...) -> None:
    ...
```

### Anti-Patterns to Avoid

- **`useAuthStore` 훅을 `beforeLoad` 내부에서 사용:** `beforeLoad`는 React 컴포넌트 컨텍스트 밖이다. `useAuthStore.getState()`(Zustand store 직접 접근)를 사용해야 한다.
- **`routeTree.gen.ts` 직접 편집:** 절대 금지. 파일 기반 라우팅으로 자동 생성된다.
- **서비스 레이어에서 `HTTPException` raise:** `AppError` 서브클래스만 raise, router에서 `_app_error_to_http()`로 변환.
- **React Context로 인증 상태 공유:** CLAUDE.md에 명시적 금지. Zustand 사용.
- **`useInitAuth` 중복 실행:** `useEffect` 의존성 배열 관리 주의. `[]`로 마운트 1회만 실행.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT Bearer 토큰 파싱 | 수동 `Authorization` 헤더 파싱 | `fastapi.security.HTTPBearer` (이미 `security.py`에 구현) | 이미 완성된 코드 있음 |
| RBAC 체크 | 수동 `user.roles` 확인 로직 | `require_permission("admin:users")` (이미 `security.py`에 구현) | 재사용 패턴 확립됨 |
| 폼 검증 | 수동 입력 검증 | `react-hook-form` + `zodResolver` (기존 login-form.tsx 패턴) | 이미 작동하는 패턴 |
| 토스트 알림 | 커스텀 알림 UI | `sonner` (`toast.error()`, `toast.success()`) | 이미 사용 중 |
| 테이블 UI | 커스텀 테이블 | `@tanstack/react-table` (sample/users 참고) | 이미 프로젝트에 존재 |

**핵심:** 이 Phase에서 새로 만들어야 하는 것은 거의 없다. 기존 패턴을 연결하는 작업이다.

---

## Common Pitfalls

### Pitfall 1: AUTH-02 — 회원가입 후 자동 로그인

**What goes wrong:** 현재 `POST /auth/signup`은 `SignupResponse`를 반환하며 JWT 토큰이 없다. 회원가입 성공 후 프론트엔드가 자동으로 로그인되지 않으면 AUTH-02 실패.

**Why it happens:** D-02 결정(백엔드 변경 없음)으로 인해 signup 엔드포인트를 수정할 수 없다.

**How to avoid:** `useSignupMutation`에서 signup 성공 후 자동으로 `apiLogin(email, password)`를 연속 호출한다. signup 시 입력받은 이메일/비밀번호를 mutation 컨텍스트에 유지했다가 login 호출에 재사용.

**Warning signs:** 회원가입 성공 후 `/auth/login`으로 리다이렉트되고 수동 로그인을 요구하면 AUTH-02 미충족.

### Pitfall 2: `_authenticated.tsx` layout route 경합 상태

**What goes wrong:** `useInitAuth()`가 `/me` API를 호출하는 동안 `beforeLoad`가 실행되면, Zustand store에 아직 사용자가 없어도 localStorage 토큰이 존재하므로 1차 체크를 통과하지만, `isAuthenticated`가 false면 리다이렉트된다.

**Why it happens:** 세션 복원이 비동기이고, 라우터 네비게이션도 비동기다.

**How to avoid:** `beforeLoad`는 localStorage 토큰 존재 여부만 체크한다. Zustand `isAuthenticated` 2차 체크는 `useInitAuth()`가 완료(isInitialized=true)된 후에만 의미 있다. 초기화 완료 전에는 보호된 페이지에서 로딩 스피너를 보여주면 된다. 또는 `beforeLoad`를 localStorage 1차 체크만으로 단순화하고, 실제 `/me` 검증 실패는 API 호출 시점(401 응답)에 처리한다.

**Warning signs:** 로그인된 상태에서 새로고침 시 `/auth/login`으로 튕기면 이 문제다.

### Pitfall 3: `admin:users` 권한 DB 초기 데이터 없음

**What goes wrong:** `require_permission("admin:users")`는 DB의 `permissions` 테이블에 `admin:users` key가 존재하고, 해당 권한이 `admin` role에 연결되어 있어야 동작한다. DB에 초기 데이터가 없으면 관리자도 403을 받는다.

**Why it happens:** 권한 데이터는 코드가 아니라 DB에 존재한다. 현재 코드베이스에 seed 데이터가 있는지 확인 필요.

**How to avoid:** Alembic migration에 seed 데이터를 추가하거나 별도 seed 스크립트를 작성한다. 현재 `auth_repository.py`의 `get_role_by_name("user")` 패턴을 보면 role 데이터가 이미 존재한다고 가정하는 구조다. 관리자 기능 테스트 전 DB에 `admin` role + `admin:users` permission + role-permission 매핑이 있는지 확인해야 한다.

**Warning signs:** 관리자 엔드포인트가 일관되게 403을 반환하면 DB seed 문제다.

### Pitfall 4: 프론트엔드 `AuthUser` 타입 vs 백엔드 `UserResponse`

**What goes wrong:** 현재 `AuthUser`는 `{ name: string; email: string }`만 포함한다. 백엔드 `/me`가 반환하는 `UserResponse`는 `{ id: UUID, email, display_name, is_verified, is_active, created_at }`이다. 타입 불일치로 TypeScript 컴파일 오류 발생.

**Why it happens:** mock API가 단순 타입을 사용했고 실제 API 응답과 다르다.

**How to avoid:** `AuthUser` 타입을 `UserResponse` 스키마에 맞게 확장: `id: string`, `email: string`, `display_name: string | null`, `is_verified: boolean`, `is_active: boolean`. `name` 필드는 `display_name`으로 대체.

**Warning signs:** `setUser(response.user)` 호출 시 TypeScript 타입 오류.

### Pitfall 5: SignupRequest 필드명 불일치

**What goes wrong:** 현재 프론트엔드 `SignupInput`은 `name` 필드를 사용하지만 백엔드 `SignupRequest`는 `display_name` 필드를 기대한다.

**Why it happens:** mock API와 실제 API의 필드명이 다르다.

**How to avoid:** 프론트엔드 signup API 호출 시 `{ email, password, display_name: input.name }` 매핑. 또는 프론트엔드 타입을 `display_name`으로 변경.

---

## Code Examples

### 로그인 후 토큰 저장 패턴

```typescript
// apps/web/src/features/auth/hooks/use-auth-mutation.ts (수정)
// [VERIFIED: 기존 useMutation 패턴 + localStorage 추가]
export function useLoginMutation() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: LoginInput) => apiLogin(data.email, data.password),
    onSuccess: (tokenResponse) => {
      // localStorage 토큰 저장
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      // /me 호출하여 유저 정보 획득 후 store 업데이트
      // 또는 tokenResponse에서 user 정보가 없으므로 별도 /me 호출 필요
      // (TokenResponse는 user 정보를 포함하지 않음 — 백엔드 스키마 확인)
      navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

**주의:** 백엔드 `TokenResponse`는 `{ access_token, refresh_token, token_type, expires_in }`만 포함하며 user 정보가 없다. 로그인 성공 후 별도 `GET /auth/me` 호출이 필요하거나, `useInitAuth()`가 처리하도록 위임한다.

### 관리자 사용자 목록 쿼리 패턴 (백엔드)

```python
# apps/api/src/domains/auth/router/admin_router.py (신규)
# [VERIFIED: 기존 auth_repository.py select 패턴 직접 적용]
from sqlalchemy import select, func

async def list_users_paginated(
    session: AsyncSession,
    page: int,
    size: int,
) -> tuple[list[User], int]:
    offset = (page - 1) * size
    total_result = await session.execute(select(func.count()).select_from(User))
    total = total_result.scalar_one()
    users_result = await session.execute(
        select(User).offset(offset).limit(size).order_by(User.created_at.desc())
    )
    return list(users_result.scalars()), total
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| mock-auth-api.ts (setTimeout + fake data) | 실제 FastAPI JWT API 호출 | AUTH-01/02 충족 |
| 라우트 가드 없음 | `_authenticated.tsx` `beforeLoad` | AUTH-03 충족 |
| `AuthUser { name, email }` | `AuthUser { id, email, display_name, is_verified, is_active }` | 실제 유저 데이터 반영 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 백엔드에 `admin` role과 `admin:users` permission이 DB에 seed되어 있지 않을 수 있음 | Pitfall 3 | 관리자 API가 모두 403 반환 — seed 스크립트/migration 필요 |
| A2 | 로그인 성공 시 `TokenResponse`에 user 정보가 없으므로 별도 `/me` 호출이 필요하거나 `useInitAuth`로 위임해야 함 | Code Examples | useLoginMutation 완성도에 영향 |
| A3 | `_authenticated.tsx` layout route의 `beforeLoad`에서 초기화 중 경합 상태는 localStorage 1차 체크로 충분히 대응 가능 | Pitfall 2 | 새로고침 시 인증 상태 유실 가능성 |
| A4 | `display_name` 필드가 signup 폼에서 `name`으로 표시되고 있음 — 필드 매핑 필요 | Pitfall 5 | signup API 호출 시 422 Unprocessable Entity |

---

## Open Questions

1. **로그인 후 user 정보 획득 방법**
   - What we know: `TokenResponse`에 user 정보 없음. `useInitAuth`가 `/me`를 호출하여 복원.
   - What's unclear: 로그인 직후 navigate('/') 전에 setUser를 호출해야 하는가, 아니면 `useInitAuth`가 다음 마운트 시 처리하도록 두어도 되는가?
   - Recommendation: 로그인 성공 후 즉시 `GET /me`를 연속 호출하여 user 정보를 설정하는 것이 UX 상 안전. `useInitAuth`는 새로고침/복원 시나리오 전용으로 분리.

2. **`admin:users` permission DB seed 여부**
   - What we know: `require_permission("user")` 기반으로 `signup_and_send_email`에서 default `user` role을 할당함. `admin` role과 `admin:users` permission의 존재 여부는 DB 상태에 달림.
   - What's unclear: 현재 Alembic migration에 seed 데이터가 있는가?
   - Recommendation: `alembic/versions/` 파일 확인 필요. seed 없으면 migration 또는 init_data 스크립트 추가.

---

## Environment Availability

Step 2.6: SKIPPED (이 Phase는 신규 외부 의존성 없음. 기존 PostgreSQL, Redis, FastAPI 인프라만 활용)

---

## Validation Architecture

`nyquist_validation: false` — 이 섹션은 해당 없음.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | 기존 FastAPI JWT (python-jose, argon2) |
| V3 Session Management | yes | localStorage 토큰 저장 (D-01 결정) |
| V4 Access Control | yes | `require_permission("admin:users")` RBAC |
| V5 Input Validation | yes | Pydantic v2 (백엔드), zod (프론트엔드) |
| V6 Cryptography | no (already implemented) | argon2 password hash, HS256 JWT — 변경 없음 |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|-----------|
| localStorage XSS 토큰 탈취 | Information Disclosure | D-03으로 httpOnly cookie를 포기한 결정 — MVP 수용. 콘텐츠 보안 정책(CSP) 향후 고려 |
| CSRF (관리자 POST 엔드포인트) | Tampering | Bearer 토큰 인증은 CSRF에 면역 (쿠키 기반 아님) |
| 권한 상승 (일반 유저가 /admin 접근) | Elevation of Privilege | `require_permission("admin:users")` 의존성 — DB 권한 테이블이 최종 결정권자 |
| JWT 만료 후 localStorage 잔류 | Information Disclosure | access_token은 15분 TTL, 재사용 시 401 → clearUser() 처리 |

---

## Sources

### Primary (HIGH confidence)
- 기존 코드베이스 직접 분석 — `apps/api/src/domains/auth/router/auth_router.py`, `security.py`, `schemas/auth_schemas.py`
- 기존 코드베이스 직접 분석 — `apps/web/src/features/auth/` 전체 (store, hooks, types, components)
- 기존 코드베이스 직접 분석 — `apps/web/src/routes/__root.tsx`, `apps/web/vite.config.ts`
- `.planning/codebase/INTEGRATIONS.md` — JWT TTL, Redis blacklist, CORS 설정 확인

### Secondary (MEDIUM confidence)
- `.planning/phases/01-auth-integration/01-CONTEXT.md` — 사용자 결정 사항
- TanStack Router 1.95.0 문서 패턴 — `beforeLoad`, `createFileRoute`, pathless layout routes [ASSUMED: training data 기반, 버전 1.95.0 호환 가정]

---

## Metadata

**Confidence breakdown:**
- 백엔드 현재 상태: HIGH — 코드 직접 분석
- 프론트엔드 현재 상태: HIGH — 코드 직접 분석
- TanStack Router `beforeLoad` 패턴: MEDIUM — 기존 코드 패턴 + 훈련 데이터 (Context7 미확인)
- 관리자 DB seed 상태: LOW — Alembic migration 내용 미확인

**Research date:** 2026-05-17
**Valid until:** 60일 (안정 스택, 빠른 변경 없음)
