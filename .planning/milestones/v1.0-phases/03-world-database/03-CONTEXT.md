# Phase 3: 세계관 데이터베이스 - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 소설의 캐릭터·장소·세계관 설정·시간표/연표를 구조화된 데이터베이스로 관리할 수 있도록 한다.
백엔드: `domains/world/` 신규 도메인 추가 (캐릭터/장소/세계관설정/시간표/인간관계 5개 테이블). 프론트엔드: `/novels/:novelId/world` 탭 기반 세계관 관리 페이지 (이름/유형 검색·필터링 포함).
AI 컨텍스트 주입, 사이드패널, SSE 스트리밍은 이 Phase의 범위 밖이다. (Phase 4 담당)
캐릭터 관계 그래프 시각화(ADV-01)와 pgvector 의미 검색(ADV-03)은 v2 범위이며 이 Phase에서 구현하지 않는다.

</domain>

<decisions>
## Implementation Decisions

### 백엔드 도메인 구조
- **D-01:** `domains/world/` 단일 도메인으로 캐릭터·장소·세계관설정·시간표·인간관계 모두 관리한다. `domains/novel/`과 동일한 DDD 패턴 준수.
  - `domains/world/router/world_router.py` — 모든 세계관 엔티티 라우터
  - `domains/world/service/character_service.py`, `location_service.py`, `world_setting_service.py`, `timeline_service.py`
  - `domains/world/repository/character_repository.py`, `location_repository.py`, `world_setting_repository.py`, `timeline_repository.py`
  - `domains/world/models/world_models.py` — 모든 세계관 테이블 ORM
  - `domains/world/schemas/world_schemas.py` — Pydantic 요청/응답 스키마
- **D-02:** `domains/world`는 `domains/auth`, `domains/novel`, `domains/chat`을 import하지 않는다. `core/`와 `domains/shared/`는 사용 가능.
- **D-03:** 모든 엔드포인트는 `get_current_user` 의존성으로 보호. 조회 시 `novel_id + current_user` 소유권 검증 필수.

### DB 스키마 설계
- **D-04:** 엔티티별 별도 테이블 4개 + 인간관계 중간 테이블 1개 (총 5개 테이블):

  **characters 테이블:**
  `id(UUID PK)`, `novel_id(FK→novels)`, `name(VARCHAR)`, `appearance(TEXT, nullable)`, `personality(TEXT, nullable)`, `background(TEXT, nullable)`, `role(VARCHAR, nullable)`, `summary(TEXT, nullable)`, `created_at`, `updated_at`

  **locations 테이블:**
  `id(UUID PK)`, `novel_id(FK→novels)`, `name(VARCHAR)`, `description(TEXT, nullable)`, `location_relation(TEXT, nullable)`, `summary(TEXT, nullable)`, `created_at`, `updated_at`

  **world_settings 테이블:**
  `id(UUID PK)`, `novel_id(FK→novels)`, `name(VARCHAR)`, `type(StrEnum)`, `content(JSONB)`, `summary(TEXT, nullable)`, `created_at`, `updated_at`
  → `type` 열거: `magic_system`, `nation_faction`, `history`, `rule`

  **timelines 테이블:**
  `id(UUID PK)`, `novel_id(FK→novels)`, `event_name(VARCHAR)`, `event_date(VARCHAR, nullable)`, `description(TEXT, nullable)`, `chapter_id(FK→chapters, nullable)`, `created_at`, `updated_at`

  **character_relationships 테이블:**
  `id(UUID PK)`, `novel_id(FK→novels)`, `character_id_a(FK→characters)`, `character_id_b(FK→characters)`, `type(StrEnum)`, `description(TEXT, nullable)`, `created_at`, `updated_at`
  → `type` 열거: `lover`, `enemy`, `ally`, `family`

- **D-05:** 소프트 딜리트 없음. 소설 삭제 시 cascade delete (Phase 2 D-06 패턴 승계).
- **D-06:** 세계관 설정(world_settings)의 `content` 컬럼은 JSONB 자유 형식 — 타입별 추가 필드를 구조화 없이 저장. (STATE.md 기결정: "정규화 컬럼 + JSONB 하이브리드")
- **D-07:** `summary` 컬럼은 Phase 4 AI 컨텍스트 주입 시 짧은 설명문으로 사용된다 — 모든 엔티티에 포함. nullable, 최대 500자 권장.

### API 엔드포인트 구조
- **D-08:** 캐릭터 CRUD:
  - `POST   /api/v1/novels/{novel_id}/characters`
  - `GET    /api/v1/novels/{novel_id}/characters?name=&search=`
  - `GET    /api/v1/novels/{novel_id}/characters/{id}`
  - `PUT    /api/v1/novels/{novel_id}/characters/{id}`
  - `DELETE /api/v1/novels/{novel_id}/characters/{id}`

- **D-09:** 장소 CRUD:
  - `POST/GET /api/v1/novels/{novel_id}/locations?name=`
  - `GET/PUT/DELETE /api/v1/novels/{novel_id}/locations/{id}`

- **D-10:** 세계관 설정 CRUD:
  - `POST/GET /api/v1/novels/{novel_id}/world-settings?type=&name=`
  - `GET/PUT/DELETE /api/v1/novels/{novel_id}/world-settings/{id}`

- **D-11:** 시간표/연표 CRUD:
  - `POST/GET /api/v1/novels/{novel_id}/timelines`
  - `GET/PUT/DELETE /api/v1/novels/{novel_id}/timelines/{id}`

- **D-12:** 인간관계 CRUD:
  - `POST   /api/v1/novels/{novel_id}/characters/{id}/relationships`
  - `GET    /api/v1/novels/{novel_id}/characters/{id}/relationships`
  - `PUT/DELETE /api/v1/novels/{novel_id}/characters/{id}/relationships/{rel_id}`

- **D-13:** 검색/필터링은 백엔드 쿼리 파라미터로 구현 — `name`(부분 일치, ILIKE), `type`(정확 일치). 프론트엔드 클라이언트 필터링 없음. 항목 수 무관하게 서버 필터 일관성 유지.

### 프론트엔드 라우팅 구조
- **D-14:** TanStack Router 파일 기반, `_authenticated/` 하위에 배치:
  - `_authenticated/novels/$novelId/world/index.tsx` — 세계관 메인 페이지 (탭 UI)
  - URL: `/novels/:novelId/world`
  - 탭 구성: 캐릭터 | 장소 | 세계관 설정 | 시간표
  - 인간관계는 캐릭터 탭 내 서브섹션으로 표시 (별도 탭 불필요)

- **D-15:** feature 코드 위치: `apps/web/src/features/world/`
  - `components/` — 엔티티별 카드/리스트/폼 컴포넌트
  - `hooks/` — `use-world-query.ts`, `use-world-mutation.ts`
  - `schema/` — `world.schema.ts` (zod)
  - `types/` — `world.ts` (TypeScript 인터페이스)
  - `lib/` — API 함수

### 프론트엔드 상태 관리
- **D-16:** 서버 상태는 TanStack Query 전담. 각 엔티티별 useQuery/useMutation 훅으로 분리.
- **D-17:** 검색어/필터 상태는 React local state (`useState`). URL query param으로 동기화하지 않음 (MVP).
- **D-18:** 폼 상태는 `react-hook-form` + `zodResolver` + `zod` 스키마.

### 세계관 항목 생성/수정 UI
- **D-19:** 생성/수정 폼은 모달 방식으로 구현한다 — `modal-store.ts` 패턴 재사용 (Phase 1 D-16 참조).
- **D-20:** 각 탭 내 항목 목록은 카드 그리드가 아닌 테이블/리스트 형태 — 항목이 많을 때 스캔 효율 우선.
- **D-21:** 항목 삭제는 confirm 다이얼로그 후 실행 (base-ui 또는 radix Dialog 사용).

### Claude's Discretion
- `world_router.py` 내 라우터를 단일 파일로 유지할지 엔티티별 분리할지 — planner가 파일 크기 판단하여 결정.
- 캐릭터 관계 목록의 UI 표시 방식 (탭 내 인라인 섹션 vs 캐릭터 상세 모달 내 하위 섹션) — planner 판단.
- `summary` 필드 자동 생성(AI) vs 수동 입력 — Phase 3에서는 수동 입력만. Phase 4에서 AI 자동 생성 고려.
- 시간표 `event_date` 컬럼 타입: 작가가 "3년차 봄" 같은 자유 형식도 입력 가능해야 하므로 `VARCHAR`로 유지. planner가 validation 방식 결정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항
- `.planning/REQUIREMENTS.md` §WORLD — WORLD-01, WORLD-02, WORLD-03, WORLD-04, WORLD-05, WORLD-06 전문
- `.planning/ROADMAP.md` §Phase 3 — Goal, Success Criteria 4개 항목

### 이전 Phase 의사결정 (승계)
- `.planning/phases/01-auth-integration/01-CONTEXT.md` — D-04~D-07 (라우트 가드 패턴, `_authenticated/` 배치 규칙)
- `.planning/phases/02-novel-chapter-management/02-CONTEXT.md` — D-01~D-02 (도메인 격리 규칙), D-06 (소프트 딜리트 없음, cascade), D-10 (`get_current_user`), D-14~D-16 (상태 관리, 피처 코드 위치)
- `.planning/STATE.md` §Decisions — "세계관 스키마를 정규화 컬럼 + JSONB 하이브리드로 결정" (기확정)

### 기존 백엔드 패턴 (참조)
- `apps/api/src/domains/novel/` — 전체 novel 도메인 구조 (world 도메인의 직접 참조 패턴)
- `apps/api/src/domains/auth/security.py` — `get_current_user` 의존성 (소유권 검증에 재사용)
- `apps/api/src/core/exceptions.py` — AppError 계층 구조 (NotFoundError, ForbiddenError 사용)
- `apps/api/src/core/database.py` — AsyncSession 주입 패턴
- `apps/api/alembic/versions/` — 마이그레이션 네이밍 패턴 참조

### 기존 프론트엔드 패턴 (참조)
- `apps/web/src/features/novel/` — feature 디렉토리 구조 패턴 (world 피처의 직접 참조 패턴)
- `apps/web/src/stores/modal-store.ts` — 모달 전역 상태 패턴 (생성/수정 폼에 재사용)
- `apps/web/src/routes/_authenticated.tsx` — 인증 가드 layout route
- `apps/web/src/components/ui/` — Radix/shadcn-style primitives (Dialog, Button, Input 등)

### 아키텍처 패턴
- `.planning/codebase/ARCHITECTURE.md` — 레이어 구조, 도메인 격리 규칙, AppError 패턴
- `.planning/codebase/STRUCTURE.md` — 새 도메인/피처 추가 위치 가이드

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `domains/novel/router/novel_router.py` — 라우터 패턴, `get_current_user` 소유권 체크 방식 그대로 복사
- `domains/novel/service/novel_service.py` — AppError 기반 서비스 패턴 (NotFoundError, ForbiddenError)
- `apps/web/src/stores/modal-store.ts` — `openModal`, `closeModal` — 세계관 항목 생성/수정 모달에 즉시 적용
- `apps/web/src/features/novel/hooks/` — useMutation 훅 패턴 — 세계관 CRUD 훅에 동일 구조 적용
- `apps/web/src/components/ui/` — Dialog, Button, Input, Table 컴포넌트 — 폼/목록 UI에 재사용

### Established Patterns
- **백엔드 레이어**: Router → Service → Repository. Service는 AppError만 raise.
- **도메인 격리**: `domains/world`는 `core/`와 `domains/shared/`만 import 가능.
- **프론트엔드 상태**: Zustand(클라이언트 UI) + React Query(서버 상태). React Context 사용 금지.
- **폼 검증**: `react-hook-form` + `zodResolver` + `zod` 스키마.
- **라우팅**: `createFileRoute()` 사용. `routeTree.gen.ts` 직접 편집 금지.
- **에러 피드백**: `sonner` 토스트.
- **StrEnum 패턴**: Python `StrEnum` (Phase 2 챕터 상태에서 사용됨) — `world_settings.type`, `character_relationships.type`에 동일 패턴 적용.

### Integration Points
- `apps/api/src/main.py` — `_register_routers()`에 world_router `include_router()` 등록 위치
- `apps/web/src/routes/_authenticated/novels/$novelId/` — 기존 소설 상세 라우트 하위에 `world/` 라우트 추가
- `apps/api/alembic/versions/` — 신규 마이그레이션 파일 추가 (`uv run alembic revision --autogenerate`)

</code_context>

<specifics>
## Specific Ideas

- Phase 4 AI 컨텍스트 주입을 위해 모든 엔티티에 `summary` 컬럼을 포함한다. 플래너는 이 컬럼이 Phase 4에서 시스템 프롬프트에 직접 주입될 텍스트임을 인식해야 한다.
- `world_settings.content` JSONB는 타입별로 다른 필드를 저장할 수 있도록 자유 형식으로 유지. 예: magic_system은 `{"rules": [...], "limitations": "..."}` 형태.
- 시간표의 `event_date`는 작가의 자유로운 날짜 표현("3년차 봄", "왕국력 152년")을 위해 VARCHAR 타입으로 유지.
- 캐릭터 관계는 대칭적이지 않을 수 있음 (A→B = 연인, B→A = 집착) — `character_id_a`, `character_id_b` 방향성 보존.

</specifics>

<deferred>
## Deferred Ideas

- 캐릭터 관계 그래프 시각화 (ADV-01) — v2 범위. 이 Phase에서는 테이블/리스트만 표시.
- pgvector 기반 세계관 항목 의미 검색 (ADV-03) — v2 범위. Phase 3는 ILIKE 검색만.
- `summary` 필드 AI 자동 생성 — Phase 4에서 AI 파이프라인 구축 후 추가 고려.
- 세계관 항목 간 연결 (예: 특정 장소가 특정 세계관 설정에 속함) — v2 범위. MVP에서는 단방향 필터만.
- 스토리 비트 관리 (ADV-02) — v2 범위.

</deferred>

---

*Phase: 3-세계관 데이터베이스*
*Context gathered: 2026-05-17*
