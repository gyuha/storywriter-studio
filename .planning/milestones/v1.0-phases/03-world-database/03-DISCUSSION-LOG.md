# Phase 3: 세계관 데이터베이스 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 3-세계관 데이터베이스
**Mode:** autonomous (no AskUserQuestion — decisions made by Claude based on prior context)
**Areas discussed:** 백엔드 도메인 구조, DB 스키마 설계, 프론트엔드 UI 구조, 검색/필터링 구현

---

## 백엔드 도메인 구조

| Option | Description | Selected |
|--------|-------------|----------|
| `domains/world/` 단일 도메인 | novel 패턴과 동일 — 학습 비용 최소화, 도메인 격리 유지 | ✓ |
| 엔티티별 별도 도메인 (`domains/character/`, 등) | 도메인 경계가 명확해지나 초기 세팅 비용 증가 | |

**선택:** `domains/world/` 단일 도메인
**근거:** `domains/novel/`이 소설+챕터를 단일 도메인으로 잘 관리하고 있음. 세계관 엔티티들도 novel_id로 묶인 응집력 있는 도메인이므로 동일 패턴 적용이 자연스러움.

---

## DB 스키마 설계

| Option | Description | Selected |
|--------|-------------|----------|
| 엔티티별 별도 테이블 5개 | characters, locations, world_settings, timelines, character_relationships | ✓ |
| 공통 WorldItem 테이블 + type 컬럼 | 단일 테이블 - 유연하나 컬럼 낭비, Phase 4 컨텍스트 쿼리 복잡 | |

**선택:** 엔티티별 별도 테이블
**근거:** Phase 4에서 AI 컨텍스트 주입 시 엔티티 유형별로 다른 필드를 쿼리해야 하므로 정규화가 유리. STATE.md 기결정("정규화 컬럼 + JSONB 하이브리드") 과도 일치.

**world_settings.content:** JSONB 자유 형식 — 타입별 추가 필드를 유연하게 저장. STATE.md 기결정 승계.

**character_relationships:** 방향성 있는 중간 테이블 (`character_id_a`, `character_id_b`). A→B 관계가 B→A와 다를 수 있음을 보존.

---

## 프론트엔드 UI 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 탭 기반 단일 라우트 `/novels/:novelId/world` | 탭으로 캐릭터/장소/설정/시간표 전환 — 소설 컨텍스트 유지 | ✓ |
| 엔티티별 별도 라우트 | `/novels/:novelId/characters`, `/novels/:novelId/locations` 등 | |

**선택:** 탭 기반 단일 라우트
**근거:** 소설 상세 페이지 하위에서 세계관 항목 간 이동이 잦으므로 탭 전환이 UX 상 자연스러움. 별도 라우트는 네비게이션 오버헤드 증가.

**폼 방식:**
| Option | Description | Selected |
|--------|-------------|----------|
| 모달 방식 | `modal-store.ts` 패턴 재사용 — Phase 1에서 확립 | ✓ |
| 별도 상세 페이지 | 더 많은 필드 표시 가능하나 Context 전환 비용 | |

**선택:** 모달 방식. `modal-store.ts` 패턴이 이미 확립되어 있고 Phase 1에서 관리자 UI에 사용됨.

**목록 UI:**
- 카드 그리드 대신 테이블/리스트 형태 — 항목 스캔 효율 우선.

---

## 검색/필터링 구현

| Option | Description | Selected |
|--------|-------------|----------|
| 백엔드 쿼리 파라미터 | `name`(ILIKE), `type`(exact) — 서버 필터, 확장성 있음 | ✓ |
| 프론트엔드 클라이언트 필터 | 전체 목록 로드 후 브라우저에서 필터 — 항목 수 적을 땐 빠르나 일관성 낮음 | |

**선택:** 백엔드 쿼리 파라미터
**근거:** 항목 수가 많아져도 성능이 안정적. pgvector 의미 검색(v2)으로 전환 시 패턴 일관성 유지. WORLD-06 요구사항이 "검색·필터링"을 명시하므로 서버 레벨 구현이 적절.

---

## Claude's Discretion

- `world_router.py` 단일 파일 vs 엔티티별 분리 — planner가 파일 크기 보고 결정
- 캐릭터 관계 목록 UI — 캐릭터 탭 내 인라인 섹션 또는 캐릭터 상세 모달 내 하위 섹션
- `summary` 필드 validation 방식 — 500자 이하 권장이나 planner 판단
- 시간표 `event_date` validation — VARCHAR 자유 형식 유지, 입력 검증 방식은 planner 결정

---

## Deferred Ideas

- 캐릭터 관계 그래프 시각화 (ADV-01) — v2 범위
- pgvector 의미 검색 (ADV-03) — v2 범위
- `summary` 필드 AI 자동 생성 — Phase 4 이후 고려
- 세계관 항목 간 연결 그래프 — v2 범위
- 스토리 비트 관리 (ADV-02) — v2 범위
