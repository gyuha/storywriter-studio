# Phase 1: 인증 연동 - Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 13 (신규/수정 대상)
**Analogs found:** 12 / 13

---

## File Classification

| 신규/수정 파일 | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|----------------|---------------|
| `apps/web/src/features/auth/lib/auth-api.ts` | utility | request-response | `apps/web/src/features/auth/lib/mock-auth-api.ts` | exact (교체) |
| `apps/web/src/features/auth/hooks/use-auth-mutation.ts` | hook | request-response | 자기 자신 (mutationFn만 교체) | exact (수정) |
| `apps/web/src/features/auth/hooks/use-init-auth.ts` | hook | request-response | `apps/web/src/features/auth/hooks/use-auth-mutation.ts` | role-match |
| `apps/web/src/features/auth/store/auth.store.ts` | store | event-driven | 자기 자신 (타입 확장만) | exact (수정) |
| `apps/web/src/features/auth/types/auth.ts` | utility | — | 자기 자신 (타입 확장) | exact (수정) |
| `apps/web/src/routes/__root.tsx` | route | request-response | 자기 자신 (훅 호출 추가) | exact (수정) |
| `apps/web/src/routes/_authenticated.tsx` | route | request-response | `apps/web/src/routes/auth/login.tsx` | role-match |
| `apps/web/src/routes/_authenticated/admin/users.tsx` | route | request-response | `apps/web/src/routes/sample/users/index.tsx` | role-match |
| `apps/web/src/features/admin/components/admin-users-page.tsx` | component | request-response | `apps/web/src/sample/users/components/users-page.tsx` | exact |
| `apps/web/src/features/admin/hooks/use-admin-users.ts` | hook | CRUD | `apps/web/src/features/auth/hooks/use-auth-mutation.ts` | role-match |
| `apps/web/src/features/admin/types/admin.ts` | utility | — | `apps/web/src/features/auth/types/auth.ts` | role-match |
| `apps/api/src/domains/auth/router/admin_router.py` | router | CRUD | `apps/api/src/domains/auth/router/auth_router.py` | exact |
| `apps/api/src/domains/auth/schemas/admin_schemas.py` | model | — | `apps/api/src/domains/auth/schemas/auth_schemas.py` | exact |

---

## Pattern Assignments

---

### `apps/web/src/features/auth/lib/auth-api.ts` (utility, request-response)

**Analog:** `apps/web/src/features/auth/lib/mock-auth-api.ts` (교체 대상이지만 함수 시그니처는 유지)

**현재 mock 패턴** (lines 1-16):
```typescript
import type { AuthResponse, LoginInput, SignupInput } from '../types/auth';

export async function mockLogin(input: LoginInput): Promise<AuthResponse> { ... }
export async function mockSignup(input: SignupInput): Promise<AuthResponse> { ... }
```

**신규 실제 API 패턴** — 이 패턴으로 교체:
```typescript
// Named exports only (CLAUDE.md 규칙)
// 에러는 throw new Error(message) — 호출자가 onError로 처리

const BASE = '/api/v1';

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? '로그인에 실패했습니다');
  }
  return res.json();
}

export async function apiGetMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('401');
  return res.json();
}

export async function apiLogout(accessToken: string, refreshToken: string): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
```

**핵심 주의:** 백엔드 `TokenResponse`에 user 정보 없음 — 로그인 후 user 정보는 `/me` 별도 호출 필요 (RESEARCH.md Open Question 1 참조).

---

### `apps/web/src/features/auth/hooks/use-auth-mutation.ts` (hook, request-response)

**Analog:** 자기 자신 — `mutationFn`과 `onSuccess` 로직만 교체

**현재 패턴** (lines 1-31):
```typescript
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { mockLogin, mockSignup } from '../lib/mock-auth-api';
import { useAuthStore } from '../store/auth.store';
import type { LoginInput, SignupInput } from '../types/auth';

export function useLoginMutation() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: LoginInput) => mockLogin(data),
    onSuccess: (response) => {
      setUser(response.user);
      navigate({ to: '/' });
    },
  });
}
```

**교체 후 패턴** — 이 구조를 유지하며 내부만 변경:
```typescript
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { apiLogin, apiGetMe, apiSignup, apiLogout } from '../lib/auth-api';
import { useAuthStore } from '../store/auth.store';
import type { LoginInput, SignupInput } from '../types/auth';

export function useLoginMutation() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const tokenResponse = await apiLogin(data.email, data.password);
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      const user = await apiGetMe(tokenResponse.access_token);
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다');
    },
  });
}

export function useSignupMutation() {
  const navigate = useNavigate();

  return useMutation({
    // AUTH-02: signup 성공 후 자동 login 연속 호출 (D-02: 백엔드 변경 없음)
    mutationFn: async (data: SignupInput) => {
      await apiSignup(data.email, data.password, data.name);
      // signup 성공 후 즉시 login 호출하여 TokenResponse 획득
      const tokenResponse = await apiLogin(data.email, data.password);
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    },
    onSuccess: () => {
      toast.success('가입이 완료되었습니다!');
      navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다');
    },
  });
}
```

**toast 패턴** — `onError`에 `toast.error()` 추가 (현재 코드에 누락됨).

---

### `apps/web/src/features/auth/hooks/use-init-auth.ts` (hook, request-response)

**Analog:** `apps/web/src/features/auth/hooks/use-auth-mutation.ts` (같은 hooks 폴더, useAuthStore 접근 패턴 동일)

**Imports 패턴** — use-auth-mutation.ts lines 1-6 기반:
```typescript
import { useEffect, useState } from 'react';
import { apiGetMe } from '../lib/auth-api';
import { useAuthStore } from '../store/auth.store';
```

**Core 패턴** (RESEARCH.md Pattern 2 기반, 기존 useEffect 관용구 적용):
```typescript
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

    apiGetMe(token)
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
  }, []); // 마운트 1회만 실행 — 의존성 배열 비워야 함

  return { isInitialized };
}
```

---

### `apps/web/src/features/auth/store/auth.store.ts` (store, event-driven)

**Analog:** 자기 자신 — 구조 유지, `AuthUser` 타입만 교체

**현재 패턴** (lines 1-16):
```typescript
import { create } from 'zustand';
import type { AuthUser } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ isAuthenticated: true, user }),
  clearUser: () => set({ isAuthenticated: false, user: null }),
}));
```

**변경사항:** `AuthUser` 타입만 확장 (아래 types/auth.ts 참조). store 구조 자체는 동일.

**`useAuthStore.getState()` 사용 패턴** — `_authenticated.tsx`의 `beforeLoad`에서 React 훅 컨텍스트 밖에서 Zustand 접근 시:
```typescript
// React 컴포넌트 밖에서 사용 — 훅 호출 금지
const { isAuthenticated } = useAuthStore.getState();
```

---

### `apps/web/src/features/auth/types/auth.ts` (utility, —)

**Analog:** 자기 자신 + 백엔드 `UserResponse` 스키마 (`auth_schemas.py` lines 25-36)

**현재 타입** (lines 1-21):
```typescript
export interface AuthUser {
  name: string;   // 삭제
  email: string;
}
```

**백엔드 `UserResponse`** (`auth_schemas.py` lines 25-36):
```python
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    is_verified: bool
    is_active: bool
    created_at: datetime
```

**교체 후 타입** (백엔드 응답과 1:1 대응):
```typescript
export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface UserResponse extends AuthUser {}

// LoginInput / SignupInput 유지 (폼 스키마와 연동)
export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;       // 폼에서 수집 → display_name으로 매핑하여 API 전송
  email: string;
  password: string;
  confirmPassword: string;
}
```

---

### `apps/web/src/routes/__root.tsx` (route, request-response)

**Analog:** 자기 자신 — `useInitAuth()` 호출만 추가

**현재 패턴** (lines 1-25):
```typescript
import { ThemeToggle } from '@/components/theme-toggle';
import Modals from '@/components/ui/modal/modal-manager';
import { Toaster } from '@/components/ui/sonner';
import { AppProviders } from '@/providers/app-providers';
import { isSamplePath } from '@/sample/layout/navigation';
import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <AppProviders>
      {isSamplePath(pathname) ? null : <ThemeToggle className="fixed top-4 right-4 z-50" />}
      <Outlet />
      <Modals />
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppProviders>
  );
}
```

**수정 패턴** — `useInitAuth()` 훅 호출 추가, 스피너 렌더링:
```typescript
import { useInitAuth } from '@/features/auth/hooks/use-init-auth';

// RootComponent 내부 변경
function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isInitialized } = useInitAuth();

  if (!isInitialized) {
    return (
      <AppProviders>
        <div className="flex h-screen items-center justify-center">
          {/* 기존 UI 라이브러리 스피너 — 구체 컴포넌트는 planner 결정 */}
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      ...기존 JSX 유지...
    </AppProviders>
  );
}
```

**주의:** `AppProviders`(QueryClientProvider)는 스피너 상태에서도 감싸야 함. `useInitAuth`는 React Query 없이 순수 `fetch` + `useEffect`를 사용하므로 QueryClient 밖에서도 동작함.

---

### `apps/web/src/routes/_authenticated.tsx` (route, request-response)

**Analog:** `apps/web/src/routes/auth/login.tsx` (createFileRoute 패턴 동일)

**login.tsx 패턴** (lines 1-7):
```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
});
```

**`_authenticated.tsx` 패턴** — `beforeLoad` + pathless layout route:
```typescript
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    // 1차 체크: localStorage 토큰 존재 여부 (빠른 리다이렉트)
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw redirect({ to: '/auth/login' });
    }
    // 2차 체크: Zustand store isAuthenticated
    // 주의: beforeLoad는 React 훅 컨텍스트 밖 — useAuthStore.getState() 사용
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      // useInitAuth()가 아직 완료 전일 수 있음
      // localStorage 토큰 존재하는데 isAuthenticated=false면 초기화 중
      // → 통과시키고 페이지에서 isInitialized 대기
    }
  },
  component: () => <Outlet />,
});
```

**경합 상태 처리:** RESEARCH.md Pitfall 2 참조 — `beforeLoad`는 localStorage 1차 체크만으로 단순화. 실제 `/me` 검증은 `useInitAuth`가 처리하고, 401 발생 시 clearUser + 리다이렉트.

---

### `apps/web/src/routes/_authenticated/admin/users.tsx` (route, request-response)

**Analog:** `apps/web/src/routes/sample/users/index.tsx` (동일 패턴)

**sample/users/index.tsx 패턴** (lines 1-6):
```typescript
import { UsersPage } from '@/sample/users/components/users-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sample/users/')({
  component: UsersPage,
});
```

**admin/users.tsx 패턴** (동일 구조):
```typescript
import { AdminUsersPage } from '@/features/admin/components/admin-users-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
});
```

---

### `apps/web/src/features/admin/components/admin-users-page.tsx` (component, request-response)

**Analog:** `apps/web/src/sample/users/components/users-page.tsx` (UI 구조 참조)

**sample UsersPage 패턴** (lines 1-69):
```typescript
// 헤더 + DataTable + DataTablePagination 구조
import { DataTable } from '@/sample/users/components/data-table/data-table';
import { DataTablePagination } from '@/sample/users/components/data-table/data-table-pagination';

export function UsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">...</h1>
        </div>
      </header>
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <DataTable columns={columns} data={users} ... />
      </section>
    </div>
  );
}
```

**AdminUsersPage 패턴** — sample 구조를 따르되, 데이터는 `useAdminUsers` 훅에서 가져오고, actions에 활성화/비활성화 버튼 추가:
```typescript
import { useAdminUsers, useActivateUser, useDeactivateUser } from '../hooks/use-admin-users';

export function AdminUsersPage() {
  const { data, isLoading, isError } = useAdminUsers({ page: 1, size: 20 });

  // DataTable 구조는 sample/users와 동일
  // columns 정의에서 actions 셀에 activate/deactivate 버튼 추가
}
```

**i18n:** `useTranslation()` 훅 사용 — sample/users/components/users-page.tsx line 16 패턴 유지.

---

### `apps/web/src/features/admin/hooks/use-admin-users.ts` (hook, CRUD)

**Analog:** `apps/web/src/features/auth/hooks/use-auth-mutation.ts` (useQuery + useMutation 패턴)

**use-auth-mutation.ts imports 패턴** (lines 1-6):
```typescript
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
```

**use-admin-users.ts 패턴**:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const BASE = '/api/v1';

function getAuthHeader() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAdminUsers(params: { page: number; size: number }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/admin/users?page=${params.page}&size=${params.size}`,
        { headers: getAuthHeader() }
      );
      if (!res.ok) throw new Error('사용자 목록을 불러오지 못했습니다');
      return res.json(); // PaginatedUsersResponse
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${BASE}/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('활성화에 실패했습니다');
    },
    onSuccess: () => {
      toast.success('계정이 활성화되었습니다');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
```

---

### `apps/web/src/features/admin/types/admin.ts` (utility, —)

**Analog:** `apps/web/src/features/auth/types/auth.ts` (동일 패턴)

**패턴**:
```typescript
export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  size: number;
}
```

---

### `apps/api/src/domains/auth/router/admin_router.py` (router, CRUD)

**Analog:** `apps/api/src/domains/auth/router/auth_router.py` — 완전 동일 패턴

**Imports 패턴** (auth_router.py lines 19-57):
```python
from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError, NotFoundError
from domains.auth.models import User
from domains.auth.schemas.admin_schemas import AdminUserResponse, PaginatedUsersResponse
from domains.auth.security import get_current_user, require_permission

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])
```

**`_app_error_to_http()` 패턴** (auth_router.py lines 76-80) — 동일하게 복사:
```python
def _app_error_to_http(exc: AppError) -> HTTPException:
    from fastapi import HTTPException
    headers = None
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}
    return HTTPException(status_code=exc.status_code, detail=exc.message, headers=headers)
```

**RBAC 의존성 패턴** (security.py lines 385-415):
```python
# require_permission() 팩토리 사용 — dependencies= 파라미터로 전달
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
```

**페이지네이션 쿼리 패턴** (RESEARCH.md Code Examples 기반, auth_repository.py select 패턴):
```python
# auth_repository.py lines 59-65 기반 — select + where + scalars() 패턴
offset = (page - 1) * size
total_result = await session.execute(select(func.count()).select_from(User))
total = total_result.scalar_one()
users_result = await session.execute(
    select(User).offset(offset).limit(size).order_by(User.created_at.desc())
)
users = list(users_result.scalars())
```

**활성화/비활성화 패턴** (auth_repository.py lines 93-94 update 패턴):
```python
@router.post(
    "/users/{user_id}/activate",
    dependencies=[Depends(require_permission("admin:users"))],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def activate_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
) -> None:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise _app_error_to_http(NotFoundError("User not found"))
    await session.execute(update(User).where(User.id == user_id).values(is_active=True))
    await session.commit()
```

**main.py 등록 패턴** (main.py lines 226-232):
```python
# apps/api/src/main.py _register_routers() 에 추가
try:
    from domains.auth.router.admin_router import router as admin_router
    application.include_router(admin_router, prefix="/api/v1")
    logger.debug("router_registered", prefix="/api/v1/admin")
except ImportError:
    logger.debug("admin_router_not_found")
```

---

### `apps/api/src/domains/auth/schemas/admin_schemas.py` (model, —)

**Analog:** `apps/api/src/domains/auth/schemas/auth_schemas.py` — 동일 Pydantic 패턴

**auth_schemas.py Pydantic 패턴** (lines 25-36):
```python
class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    is_verified: bool
    is_active: bool
    created_at: datetime
```

**admin_schemas.py 패턴**:
```python
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    """관리자용 사용자 응답 — UserResponse와 동일 필드."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    is_verified: bool
    is_active: bool
    created_at: datetime


class PaginatedUsersResponse(BaseModel):
    """GET /admin/users 페이지네이션 응답."""

    items: list[AdminUserResponse]
    total: int
    page: int
    size: int
```

---

## Shared Patterns

### 인증 헤더 (Bearer Token)

**Source:** `apps/api/src/domains/auth/security.py` lines 272-293

백엔드에서 Bearer 토큰 검증은 `HTTPBearer` + `get_current_user` 의존성이 처리. 프론트엔드에서는 모든 인증 필요 API 호출에 아래 패턴:

```typescript
// apps/web/src/features/admin/hooks/use-admin-users.ts 내부 헬퍼
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

### 에러 처리 (백엔드)

**Source:** `apps/api/src/domains/auth/router/auth_router.py` lines 76-80

모든 라우터에서 동일:
```python
def _app_error_to_http(exc: AppError) -> HTTPException:
    headers = None
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}
    return HTTPException(status_code=exc.status_code, detail=exc.message, headers=headers)
```

Service에서 `AppError` 서브클래스 raise → Router에서 `_app_error_to_http()`로 변환. `HTTPException` 직접 raise 금지.

### 에러 처리 (프론트엔드)

**Source:** `apps/web/src/features/auth/hooks/use-auth-mutation.ts` lines 1-31

모든 mutation에서 동일:
```typescript
onError: (error) => {
  toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
},
```

### TanStack Router 파일 기반 라우트

**Source:** `apps/web/src/routes/auth/login.tsx` lines 1-7

```typescript
// 파일명이 URL 세그먼트 결정 — routeTree.gen.ts 직접 편집 금지
export const Route = createFileRoute('/경로')({
  component: ComponentName,
});
```

Pathless layout route (`_authenticated.tsx`): 언더스코어 접두사가 URL 세그먼트 제외. `beforeLoad`로 가드 구현.

### Zustand Store 패턴

**Source:** `apps/web/src/features/auth/store/auth.store.ts` lines 1-16

```typescript
// 컴포넌트 내부: 훅 사용
const setUser = useAuthStore((state) => state.setUser);

// React 컨텍스트 밖 (beforeLoad 등): getState() 사용
const { isAuthenticated } = useAuthStore.getState();
```

### SQLAlchemy Async 쿼리

**Source:** `apps/api/src/domains/auth/repository/auth_repository.py` lines 59-65, 93-99

```python
# 단건 조회
result = await session.execute(select(User).where(User.id == user_id))
user = result.scalar_one_or_none()

# 업데이트
await session.execute(update(User).where(User.id == user_id).values(is_active=True))
await session.commit()  # repository가 아닌 router/service에서 commit
```

---

## No Analog Found

| 파일 | Role | Data Flow | 이유 |
|------|------|-----------|------|
| (없음) | — | — | 모든 파일에 충분한 analog 존재 |

**참고:** `use-init-auth.ts`는 role-match analog만 존재하지만, RESEARCH.md Pattern 2에 충분히 구체적인 구현 예시가 있으므로 플래너가 직접 구현 가능.

---

## Metadata

**Analog search scope:** `apps/web/src/`, `apps/api/src/`
**Files scanned:** 35+
**Pattern extraction date:** 2026-05-17

**핵심 발견 사항:**
1. 백엔드 router/service/repository/schema 레이어는 `auth_router.py` 패턴을 그대로 복제하면 됨
2. 프론트엔드 모든 파일은 기존 auth 코드 구조를 유지하며 내부(mutationFn, 타입)만 교체
3. sample/users UI는 admin 페이지의 직접적인 구조 참조 가능 — `@tanstack/react-table`, `DataTable`, `Badge` 등 이미 프로젝트에 존재
4. `useAuthStore.getState()`는 `beforeLoad` 안에서 Zustand에 접근하는 유일한 올바른 방법
5. `admin:users` DB seed 여부는 Alembic migration에서 별도 확인 필요 (RESEARCH.md Pitfall 3)
