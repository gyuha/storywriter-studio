# Phase 2: 소설/챕터 관리 - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 소설 프로젝트를 생성·수정·삭제하고, 챕터를 추가하여 TipTap 에디터로 본문을 작성할 수 있는 전체 CRUD 레이어를 구축한다.
백엔드: `domains/novel/` 도메인 신규 추가. 프론트엔드: 소설 목록(카드 그리드), 소설 상세(챕터 목록+사이드바), 챕터 에디터(TipTap + 자동저장 + 글자수).
AI 연동, 세계관 컨텍스트 주입은 이 Phase의 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 백엔드 도메인 구조
- **D-01:** `domains/novel/` 단일 도메인으로 소설+챕터 모두 관리한다. `domains/auth/` 패턴 그대로 준수.
  - `domains/novel/router/novel_router.py` — 소설 + 챕터 라우터
  - `domains/novel/service/novel_service.py` — 소설 비즈니스 로직
  - `domains/novel/service/chapter_service.py` — 챕터 비즈니스 로직
  - `domains/novel/repository/novel_repository.py`
  - `domains/novel/repository/chapter_repository.py`
  - `domains/novel/models/novel_models.py` — SQLAlchemy ORM (Novel, Chapter 테이블)
  - `domains/novel/schemas/novel_schemas.py` — Pydantic 스키마
- **D-02:** `domains/novel`은 `domains/auth`나 `domains/chat`을 import하지 않는다. `core/`와 `domains/shared/`는 사용 가능.

### DB 스키마 설계
- **D-03:** `novels` 테이블 컬럼: `id(UUID PK)`, `user_id(FK→users)`, `title`, `genre`, `description`, `cover_image_url`, `created_at`, `updated_at`
- **D-04:** `chapters` 테이블 컬럼: `id(UUID PK)`, `novel_id(FK→novels)`, `title`, `content(TEXT)`, `order_key(REAL)`, `status(enum: draft/reviewing/done)`, `created_at`, `updated_at`
- **D-05:** 챕터 순서는 `order_key REAL` 컬럼으로 fractional indexing 구현 (새 챕터 삽입 시 앞뒤 order_key 평균값 사용).
- **D-06:** 소프트 딜리트 없음 — 소설 삭제 시 연관 챕터도 cascade delete.

### API 엔드포인트 구조
- **D-07:** 소설 CRUD — `POST/GET /api/v1/novels`, `GET/PUT/DELETE /api/v1/novels/{id}`
- **D-08:** 챕터 CRUD — `POST/GET /api/v1/novels/{novel_id}/chapters`, `GET/PUT/DELETE /api/v1/novels/{novel_id}/chapters/{id}`
- **D-09:** 챕터 순서 변경 — `PATCH /api/v1/novels/{novel_id}/chapters/{id}/reorder` (body: `{ order_key: float }`)
- **D-10:** 모든 엔드포인트는 `get_current_user` 의존성으로 보호 (인증된 사용자만 접근 가능).
- **D-11:** 소설 목록 조회 시 `user_id = current_user.id` 필터 — 본인 소설만 조회.

### 프론트엔드 라우팅 구조
- **D-12:** TanStack Router 파일 기반 라우팅, `_authenticated/` 하위에 배치 (D-06 from Phase 1).
  - `_authenticated/novels/index.tsx` — 소설 목록 (카드 그리드)
  - `_authenticated/novels/$novelId/index.tsx` — 소설 상세 + 챕터 목록
  - `_authenticated/novels/$novelId/chapters/$chapterId/edit.tsx` — 챕터 에디터
- **D-13:** URL 구조: `/novels`, `/novels/:novelId`, `/novels/:novelId/chapters/:chapterId/edit`

### 프론트엔드 상태 관리
- **D-14:** 서버 상태는 TanStack Query (`useQuery`, `useMutation`) 전담 — 소설/챕터 CRUD 모두.
- **D-15:** 에디터 로컬 상태(현재 편집 중 content, 저장 상태 인디케이터)는 React local state (`useState`). Zustand 불필요.
- **D-16:** 소설/챕터 feature 코드 위치: `apps/web/src/features/novel/` (컴포넌트, hooks, types, api).

### TipTap 에디터 설정
- **D-17:** TipTap 3.x 채택 (Phase 1 의사결정 승계, React 19 호환 확인됨).
- **D-18:** 지원 확장: `StarterKit`(Bold, Italic, Paragraph, Heading), `CharacterCount` (글자수 카운트용).
- **D-19:** 자동저장: `useDebounce` 훅으로 3초 debounce 후 `PATCH /chapters/{id}` 호출.
- **D-20:** 저장 상태 표시: 에디터 하단 상태바에 "저장됨" / "저장 중..." / "저장 실패" 텍스트 표시.
- **D-21:** 글자 수 표시: CharacterCount 확장으로 실시간 카운트. 5,000자 도달 시 카운터 색상 변경(초록색).

### 소설 목록 UI
- **D-22:** 카드 그리드 레이아웃 — `apps/web/src/sample/` 내 기존 컴포넌트를 레퍼런스로만 참고, production 코드는 `features/novel/` 에 새로 작성.
- **D-23:** 카드에 표시: 커버 이미지(없으면 기본 placeholder), 제목, 장르, 챕터 수, 최종 수정일.
- **D-24:** "새 소설 만들기" 버튼 → 모달 또는 인라인 폼 (planner 판단).

### 챕터 에디터 사이드바
- **D-25:** 에디터 페이지에 챕터 목록 사이드바 포함 (Phase 2 범위).
- **D-26:** 사이드바에서 챕터 선택 → URL 변경 → 에디터 content 교체.
- **D-27:** 드래그앤드롭 순서 변경: `@dnd-kit/core` + `@dnd-kit/sortable` 사용 (현재 미설치 — 패키지 추가 필요).

### 리서치 후 추가 결정
- **D-28:** 챕터 content 저장 포맷: TipTap `getJSON()` 결과를 `JSONB` 컬럼에 저장. Phase 4 AI 컨텍스트 추출에 유리.
- **D-29:** fractional indexing 재인덱스 엔드포인트 없음 — MVP 단계에서 간격 붕괴 시 수동 대응. `order_key` 초기값: 1, 2, 3... (정수), 삽입 시 앞뒤 평균값.

### Claude's Discretion
- 소설 생성 폼: 모달 vs 별도 페이지 — planner가 기존 modal-store 패턴 참고하여 결정.
- `@dnd-kit` 미설치 시 임시 대안 (up/down 버튼) 허용 여부 — planner 판단.
- 챕터 에디터 레이아웃(사이드바 너비, 에디터 영역 비율) — 기존 `apps/web/src/sample/` 참고.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항
- `.planning/REQUIREMENTS.md` §PROJ — PROJ-01, PROJ-02, PROJ-03, PROJ-04 전문
- `.planning/REQUIREMENTS.md` §CHAP — CHAP-01, CHAP-02, CHAP-03, CHAP-04, CHAP-05, CHAP-06 전문
- `.planning/ROADMAP.md` §Phase 2 — Success Criteria 4개 항목

### 이전 Phase 의사결정 (승계)
- `.planning/phases/01-auth-integration/01-CONTEXT.md` — D-04~D-07 (라우트 가드 패턴), D-06 (`_authenticated/` 배치 규칙)
- `.planning/ROADMAP.md` §Phase 1 완료 기준 — Phase 2는 Phase 1 완료를 전제

### 기존 백엔드 패턴 (참조)
- `apps/api/src/domains/auth/` — 전체 도메인 구조 패턴 (router/service/repository/models/schemas)
- `apps/api/src/domains/auth/router/auth_router.py` — FastAPI router, Pydantic 스키마 패턴
- `apps/api/src/domains/auth/service/auth_service.py` — AppError 기반 서비스 패턴
- `apps/api/src/domains/auth/security.py` — `get_current_user` 의존성 (소설 엔드포인트에 재사용)
- `apps/api/src/core/database.py` — AsyncSession 주입 패턴
- `apps/api/alembic/` — 마이그레이션 파일 위치 및 네이밍 패턴

### 기존 프론트엔드 패턴 (참조)
- `apps/web/src/features/auth/` — feature 디렉토리 구조 패턴
- `apps/web/src/features/auth/hooks/use-auth-mutation.ts` — useMutation 훅 패턴
- `apps/web/src/routes/_authenticated.tsx` — 인증 가드 layout route
- `apps/web/src/stores/modal-store.ts` — 모달 전역 상태 패턴
- `apps/web/src/sample/` — UI 레퍼런스 (production 코드 아님)

### 아키텍처 패턴
- `.planning/codebase/ARCHITECTURE.md` — 레이어 구조, 도메인 격리 규칙
- `apps/api/src/core/exceptions.py` — AppError 계층 구조

</canonical_refs>
