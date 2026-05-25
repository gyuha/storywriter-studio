# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit 단독 실행
pnpm lint         # Biome check
pnpm lint:fix     # Biome 자동 수정
pnpm format       # Biome 포맷만 적용
pnpm generate:api # openapi.json → src/generated/ 재생성
```

> **pnpm 전용** — npm/yarn 사용 금지.

## 아키텍처

### 라우팅

TanStack Router 파일 기반 라우팅. `src/routeTree.gen.ts`는 자동 생성 — 절대 편집 금지. 새 라우트 파일을 `src/routes/` 아래에 만들면 dev 서버가 자동으로 routeTree를 갱신한다.

- `_authenticated.tsx` — `localStorage`에 `access_token`이 없으면 `/auth/login`으로 redirect. 인증이 필요한 모든 라우트는 `_authenticated/` 하위에 위치한다.
- `src/routes/sample/` — 개발 참고용 UI. 프로덕션 코드 아님.

### 피처 구조

```
src/features/<domain>/
  components/   # React 컴포넌트
  hooks/        # useQuery / useMutation 래퍼
  lib/          # API 호출 함수 (generated SDK 래핑)
  store/        # Zustand 슬라이스 (필요할 때만)
  types/        # TypeScript 타입
  schema/       # Zod 스키마 (폼 검증용)
```

현재 피처: `auth`, `novel`, `world`, `admin`

### API 클라이언트

`src/generated/`는 HeyAPI가 `openapi.json`으로부터 자동 생성. 절대 직접 편집 금지. Backend OpenAPI 스펙이 바뀌면 `pnpm generate:api`로 재생성한다.

API 호출 패턴 — 반드시 `features/*/lib/*-api.ts` 래퍼를 통해 사용한다:

```ts
const { data, error } = await someGeneratedSdkFn({ ... });
if (error) throwOnError(error);   // error 객체를 Error로 변환
return data as SomeType;
```

`src/lib/api-client.ts` — `localStorage`에서 `access_token`을 읽어 `Authorization: Bearer` 헤더를 자동 주입.

### 상태 관리

- **Zustand** — 클라이언트 전역 상태 (`src/stores/`, `src/features/*/store/`)
- **React Query** — 서버 상태 및 비동기 데이터 (`useQuery`, `useMutation`)
- React Context로 피처 간 상태를 공유하지 않는다. 대신 Zustand 슬라이스를 만든다.

### 모달 시스템

`src/stores/modal-store.ts`의 `useModal` — 스택 기반 모달 매니저.

```ts
const { openModal, closeModal } = useModal();
openModal(<MyModal />, false);   // JSX, string, 또는 ModalProps 전달 가능
closeModal();                     // 스택에서 가장 위 모달 제거
```

### 챕터 에디터 (Tiptap)

`src/features/novel/components/chapter-editor.tsx`

- 콘텐츠는 **JSON 객체**로 저장/전달 (`getJSON()` 사용, `getHTML()` 금지).
- `immediatelyRender: false` — React 19 hydration 오류 방지를 위해 **필수**.
- 3초 debounce 자동저장: `useChapterAutosave` → `SaveStatus` ('idle' | 'saving' | 'saved' | 'error').

### 챕터 순서 정렬

`src/features/novel/lib/order-key.ts` — `order_key` float 기반 분수 정렬.

- `calcOrderKey(reordered, targetIndex)` — drag-and-drop 후 새 `order_key` 계산.
- `needsReindex(chapters)` — 인접 키 간격이 `0.001` 미만이면 전체 재인덱스 필요.
