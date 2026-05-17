---
quick_id: 260517-raw
title: "apps/web에 HeyAPI 적용하여 타입 안전 API 클라이언트 자동 생성"
status: planned
date: 2026-05-17
files_modified:
  - apps/web/package.json
  - apps/web/openapi-ts.config.ts
  - apps/web/src/lib/api-client.ts
  - apps/web/src/generated/ (생성 디렉토리)
  - apps/web/src/features/auth/lib/auth-api.ts
  - apps/web/src/features/novel/lib/novel-api.ts
  - apps/web/src/features/novel/lib/chapter-api.ts
  - apps/web/src/features/admin/hooks/use-admin-users.ts
  - apps/web/src/features/auth/hooks/use-auth-mutation.ts
  - apps/web/src/features/auth/hooks/use-init-auth.ts
autonomous: true
---

<objective>
FastAPI가 자동 노출하는 `/openapi.json` 스펙을 기반으로 `@hey-api/openapi-ts`가
타입 안전 클라이언트를 자동 생성하도록 구성하고, 현재 수작업으로 작성된 fetch 기반
API 클라이언트(auth-api.ts, novel-api.ts, chapter-api.ts, use-admin-users.ts)를
생성된 클라이언트로 교체한다.

목적: 수동 타입 정의와 fetch 보일러플레이트를 제거하여 백엔드 변경이 프론트엔드 타입에
자동 반영되는 구조를 만든다.

산출물:
- apps/web/openapi-ts.config.ts (코드 생성 설정)
- apps/web/src/generated/ (자동 생성 클라이언트 — git 추적 여부 결정 필요)
- apps/web/src/lib/api-client.ts (HeyAPI 클라이언트 초기화 — base URL, 인증 인터셉터)
- 기존 *-api.ts 파일들은 생성된 클라이언트 함수 호출로 교체
</objective>

<tasks>

<task id="1" type="auto">
  <name>태스크 1: HeyAPI 설치 및 코드 생성 설정</name>
  <files>
    apps/web/package.json,
    apps/web/openapi-ts.config.ts,
    apps/web/src/generated/ (생성됨)
  </files>
  <action>
    1. `@hey-api/openapi-ts`와 `@hey-api/client-fetch`를 설치한다.
       - `@hey-api/openapi-ts`는 devDependency (코드 생성 CLI)
       - `@hey-api/client-fetch`는 dependency (런타임 HTTP 클라이언트)

    2. `apps/web/openapi-ts.config.ts`를 생성한다.
       - `input`: `http://localhost:8000/openapi.json` (FastAPI dev 서버)
       - `output.path`: `src/generated`
       - `output.format`: `prettier` 또는 `false` (biome 프로젝트이므로 false 권장)
       - `client`: `@hey-api/client-fetch`
       - `plugins`: `['@hey-api/sdk', '@hey-api/typescript']` — TanStack Query 플러그인은 사용하지 않음 (기존 훅 구조 유지)

    3. `package.json` scripts에 `"generate:api": "openapi-ts"` 추가.

    4. FastAPI dev 서버가 실행 중인 상태에서 `pnpm run generate:api`를 실행하여
       `src/generated/` 하위에 파일이 생성되는지 확인.
       생성 실패 시 `input`을 로컬 파일 경로로 변경하는 대안 사용:
       `http://localhost:8000/openapi.json`을 curl로 먼저 저장하여 `input: './openapi.json'`로 지정.

    주의: biome가 `src/generated/`를 lint하면 자동 생성 코드에서 오류가 발생한다.
    `apps/web/biome.json`에 `"ignore": ["src/generated/**"]` 패턴을 추가해야 한다.
  </action>
  <verify>
    ls apps/web/src/generated/ 로 services.gen.ts, types.gen.ts 등 파일 존재 확인.
    `pnpm --filter storywriter-studio-web typecheck` 오류 없음.
  </verify>
  <done>
    src/generated/ 디렉토리에 타입과 서비스 함수가 포함된 파일이 생성되어 있고,
    TypeScript 컴파일 오류 없음.
  </done>
</task>

<task id="2" type="auto">
  <name>태스크 2: HeyAPI 클라이언트 초기화 및 인증 인터셉터 설정</name>
  <files>
    apps/web/src/lib/api-client.ts
  </files>
  <action>
    `apps/web/src/lib/api-client.ts`를 새로 생성한다.

    이 파일의 역할:
    - `@hey-api/client-fetch`의 `createClient`로 싱글턴 클라이언트 인스턴스 생성
    - `baseUrl`: `''` (Vite dev proxy `/api/v1` → `http://localhost:8000/api/v1` 경로 유지)
      - 기존 코드가 `/api/v1`을 BASE로 사용 중이므로 baseUrl은 비워두고 생성된 서비스가
        경로 prefix를 포함하는 구조인지 확인 후 결정.
      - FastAPI의 openapi.json에서 서버 URL을 확인하여 baseUrl 결정.
    - 요청 인터셉터: `localStorage.getItem('access_token')`이 존재하면
      `Authorization: Bearer {token}` 헤더를 자동으로 추가.

    패턴:
    ```
    import { createClient } from '@hey-api/client-fetch';

    export const apiClient = createClient({
      baseUrl: '/api/v1',
    });

    apiClient.interceptors.request.use((request) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    });
    ```

    주의: `@hey-api/client-fetch` v0.x와 v1.x의 interceptors API가 다르다.
    설치된 버전의 공식 문서를 확인하여 정확한 인터셉터 등록 방법을 사용할 것.
    생성된 `src/generated/` 내 services 함수는 기본적으로 default export된 클라이언트를
    사용하므로, `setConfig` 또는 `client` 파라미터로 커스텀 클라이언트를 주입하는 방법도 확인.
  </action>
  <verify>
    `pnpm --filter storywriter-studio-web typecheck` 오류 없음.
    api-client.ts에서 TypeScript 타입 오류 없이 컴파일됨.
  </verify>
  <done>
    src/lib/api-client.ts가 존재하고, 인증 토큰 자동 주입 인터셉터가 설정되어 있음.
  </done>
</task>

<task id="3" type="auto">
  <name>태스크 3: 기존 수동 API 클라이언트를 생성된 클라이언트로 교체</name>
  <files>
    apps/web/src/features/auth/lib/auth-api.ts,
    apps/web/src/features/novel/lib/novel-api.ts,
    apps/web/src/features/novel/lib/chapter-api.ts,
    apps/web/src/features/admin/hooks/use-admin-users.ts,
    apps/web/src/features/auth/hooks/use-auth-mutation.ts,
    apps/web/src/features/auth/hooks/use-init-auth.ts,
    apps/web/src/features/novel/types/novel.ts,
    apps/web/src/features/auth/types/auth.ts
  </files>
  <action>
    생성된 `src/generated/` 파일의 함수명과 타입명을 확인한 후 아래 파일들을 교체한다.

    **auth-api.ts 교체:**
    - `apiLogin` → 생성된 `loginAuthLoginPost` (또는 실제 생성 함수명) 호출로 교체.
      단, TokenResponse를 localStorage에 저장하는 로직은 훅 레이어(use-auth-mutation.ts)에
      그대로 유지하므로 auth-api.ts의 래퍼 함수 자체는 유지하되 내부를 생성 함수로 교체.
    - `apiGetMe` → 생성된 me 조회 함수로 교체.
    - `apiSignup`, `apiLogout` 동일하게 교체.

    **novel-api.ts 교체:**
    - `apiGetNovels`, `apiCreateNovel`, `apiGetNovel`, `apiUpdateNovel`, `apiDeleteNovel`
      → 각각 생성된 함수로 교체.
    - 기존 `handleResponse` 유틸리티 제거 (HeyAPI가 처리).

    **chapter-api.ts 교체:**
    - `apiGetChapters`, `apiCreateChapter`, `apiGetChapter`, `apiUpdateChapter`,
      `apiReorderChapter`, `apiDeleteChapter` → 생성된 함수로 교체.

    **use-admin-users.ts 교체:**
    - 파일 내에 직접 작성된 fetch 로직을 생성된 admin users 서비스 함수로 교체.
    - `getAuthHeader()` 로컬 함수 제거 (인터셉터가 처리).

    **타입 교체 전략:**
    - `src/features/auth/types/auth.ts`와 `src/features/novel/types/novel.ts`의 타입들이
      `src/generated/types.gen.ts`에 동일하게 생성된 경우, 훅/컴포넌트 파일의 import를
      생성된 타입으로 변경하고 수동 타입 파일은 삭제한다.
    - 이름이 다르거나 구조가 다를 경우, 생성된 타입을 re-export하는 방식으로 호환성 유지.

    **에러 처리 통일:**
    HeyAPI는 기본적으로 4xx/5xx에서 throw하지 않고 `{ data, error }` 구조로 반환한다.
    기존 훅들은 `error instanceof Error ? error.message` 패턴을 사용하므로,
    각 api 함수 래퍼에서 `if (error) throw new Error(error.detail ?? '오류가 발생했습니다')`
    패턴으로 변환하여 훅 레이어 변경을 최소화한다.

    **변경 금지 범위:**
    - use-auth-mutation.ts, use-novel-mutations.ts, use-novel-queries.ts,
      use-chapter-mutations.ts, use-chapter-queries.ts의 비즈니스 로직은 변경하지 않음.
    - localStorage 토큰 관리 로직은 그대로 유지.
  </action>
  <verify>
    1. `pnpm --filter storywriter-studio-web typecheck` 오류 없음.
    2. `pnpm --filter storywriter-studio-web build` 성공.
    3. `grep -r "const BASE = '/api/v1'" apps/web/src/features/` 결과 없음
       (수동 BASE 상수 제거 확인).
    4. `grep -r "fetch(" apps/web/src/features/` 결과 없음
       (수동 fetch 호출 제거 확인).
  </verify>
  <done>
    모든 기존 수동 fetch 호출이 생성된 HeyAPI 서비스 함수로 교체되고,
    TypeScript 컴파일 및 프로덕션 빌드가 모두 성공함.
  </done>
</task>

</tasks>

<success_criteria>
1. `pnpm run generate:api` 실행 시 `src/generated/`에 파일 생성됨.
2. `pnpm --filter storywriter-studio-web typecheck` 오류 없음.
3. `pnpm --filter storywriter-studio-web build` 성공.
4. 수동 fetch 보일러플레이트(`const BASE`, `getAuthHeaders`, `handleResponse`)가
   features/ 내에 남아있지 않음.
5. 앱 실행 후 로그인, 소설 목록 조회, 챕터 편집 기능이 정상 동작함 (수동 확인).
</success_criteria>

---

## 사전 파악 사항 (탐색 결과 요약)

**현재 수동 API 파일 목록:**
- `src/features/auth/lib/auth-api.ts` — apiLogin, apiSignup, apiGetMe, apiLogout (4개 함수)
- `src/features/novel/lib/novel-api.ts` — CRUD 5개 함수 + getAuthHeaders, handleResponse
- `src/features/novel/lib/chapter-api.ts` — CRUD+reorder 6개 함수 + 동일 유틸리티
- `src/features/admin/hooks/use-admin-users.ts` — fetch 로직이 훅 안에 직접 작성됨 (별도 api 파일 없음)

**HeyAPI 도입 전 없는 것:**
- `@hey-api/openapi-ts` — 미설치
- `@hey-api/client-fetch` — 미설치
- `openapi-ts.config.ts` — 없음
- `src/generated/` — 없음

**FastAPI OpenAPI 엔드포인트:** `/openapi.json` (main.py 확인됨)

**주의점:**
- `use-admin-users.ts`는 별도 api 파일 없이 훅 내부에 fetch가 있어 교체 범위에 포함.
- `auth-api.ts`의 `apiLogin`은 토큰 반환만 담당 — localStorage 저장은 훅(use-auth-mutation.ts)이 처리. 이 분리 구조는 교체 후에도 유지.
- biome lint가 생성 코드에 적용되면 오류 발생 → `biome.json` ignore 설정 필요.
