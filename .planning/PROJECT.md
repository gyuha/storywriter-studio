# StoryWriter Studio

## What This Is

AI 기반 웹소설 집필 에이전트 플랫폼. 작가가 소설 프로젝트를 생성하고, 캐릭터·장소·세계관 설정을 구조화된 데이터베이스로 관리하며, 챕터 에디터에서 AI가 해당 설정들을 컨텍스트로 참조하여 초안을 자동 생성하거나 집필을 보조한다. 일반 웹소설 작가가 주 대상이며, LiteLLM을 통한 다중 AI 모델을 지원한다.

## Current State

**Shipped:** v1.0 MVP (2026-05-26)

- FastAPI DDD 백엔드: `domains/auth`, `domains/novel`, `domains/world`, `domains/chat` 완성
- React 19 프론트엔드: `features/auth`, `features/novel`, `features/world`, `features/admin` 완성
- HeyAPI 생성 SDK로 백엔드-프론트엔드 완전 연결 (`src/generated/`)
- TipTap 에디터 + 자동저장 + fractional indexing 챕터 순서
- 캐릭터/장소/세계관/시간표/관계 데이터베이스 완성
- AI 초안 생성: 사이드패널 컨텍스트 선택 + SSE 스트리밍 완성
- Python 10,128 LOC + TypeScript 31,251 LOC

## Core Value

작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어, 세계관과 일관된 글을 AI가 생성한다.

*검증 결과: v1.0에서 구현 완료. 사이드패널 토글 → 시스템 프롬프트 자동 주입 → SSE 스트리밍 파이프라인 작동.*

## Requirements

### Validated

- ✓ FastAPI 백엔드 + React 19 프론트엔드 아키텍처 — 기존 코드
- ✓ 사용자 인증/회원가입 (JWT, Argon2, OAuth 기반) — 기존 코드
- ✓ LangChain + LiteLLM 기반 다중 AI 모델 연동 인프라 — 기존 코드
- ✓ PostgreSQL + Redis 인프라 — 기존 코드
- ✓ 프론트엔드-백엔드 실제 인증 연결 (mock 제거, HeyAPI SDK) — v1.0
- ✓ 소설 프로젝트 CRUD 및 목록 관리 — v1.0
- ✓ 챕터 CRUD, TipTap 에디터, 자동저장, 글자수, 순서/상태 관리 — v1.0
- ✓ 캐릭터/장소/세계관/시간표 데이터베이스 CRUD — v1.0
- ✓ 캐릭터 관계 관리 및 관계 그래프 시각화 — v1.0
- ✓ 스토리 비트 관리 — v1.0
- ✓ 챕터 에디터 사이드패널 (2-패널, 컨텍스트 토글) — v1.0
- ✓ AI 초안 생성 (SSE 스트리밍, read-only 전환, 취소) — v1.0
- ✓ 집필 통계 (총 글자수, 챕터별 현황) — v1.0
- ✓ 관리자 사용자 관리 UI — v1.0

### Active

- [ ] **AI-04**: 사용자가 AI 모델을 선택할 수 있다 (Claude Sonnet/GPT-4o 등) — v2
- [ ] **AI-05**: AI 생성 시 이전 챕터 요약이 컨텍스트에 자동 포함된다 (연속성 유지) — v2
- [ ] **QUAL-01**: 한국어 맞춤법 검사기 통합 (외부 API 연동) — v2
- [ ] **QUAL-02**: TXT 내보내기 (챕터별 또는 전체) — v2
- [ ] **ADV-03**: pgvector 기반 세계관 항목 의미 검색 (항목 200개 초과 시) — v2

### Out of Scope

- 출판/연재 플랫폼 직접 연동 — v1 범위 초과, 플랫폼 API 공개 여부 미확인
- 실시간 공동 집필 (다중 사용자 동시 편집) — 복잡도 높음, v2 이후
- 이미지/일러스트 생성 — 텍스트 집필에 집중
- 모바일 앱 (iOS/Android) — 웹 우선, 반응형으로 대응
- AI 자동완성 팝업 (인라인) — 집필 집중 방해, Pull 방식(버튼)만 지원
- 소셜 기능 (좋아요, 팔로우) — 집필 도구 정체성 유지

## Context

**v1.0 상태 (2026-05-26 기준):**
- `apps/api/` — FastAPI + DDD 구조 (domains/auth, novel, world, chat 완성)
- `apps/web/` — React 19 + TanStack Router + Zustand + React Query
- HeyAPI 생성 SDK: `apps/web/src/generated/` (openapi.json → sdk.gen.ts 자동 생성)
- TipTap 3.x 에디터: `immediatelyRender: false` 필수 (React 19 hydration 이슈 방지)
- 챕터 순서: fractional indexing (`order_key` float) + dnd-kit
- AI 파이프라인: `novel/router/draft_router.py` → langchain_core messages + SSE

**알려진 기술 부채:**
- `draft_router.py`가 novel 도메인에서 `langchain_core.messages`를 직접 임포트 (LLM 격리 일부 완화)
- Phase 1~4 SUMMARY.md 파일 미생성 (gsd-sdk 형식 문서화 누락)

## Constraints

- **Tech Stack**: FastAPI(Python 3.12) + React 19(TypeScript 5.8) — 유지
- **AI**: LangChain + LiteLLM — 이미 통합된 인프라 활용, 모델 교체 가능
- **DB**: PostgreSQL (SQLAlchemy async) + Redis — 유지
- **Auth**: JWT/OAuth 시스템 (Argon2 패스워드 해시) — 유지
- **i18n**: react-i18next 적용됨 — 한국어 우선

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastAPI DDD 구조로 소설 도메인 추가 | 기존 auth 도메인 패턴 재사용 | ✓ novel/world 도메인 패턴 일관성 확보 |
| HeyAPI 기반 OpenAPI SDK 자동 생성 | mock 제거, 타입 안전성 확보 | ✓ auth 연결 완료, API 타입 자동 동기화 |
| TipTap 3.x 에디터 채택 | React 19 호환 확인 | ✓ `immediatelyRender: false` 필수 |
| fractional indexing 챕터 순서 | DB 재인덱스 없이 순서 변경 가능 | ✓ order_key float, needsReindex 임계값 0.001 |
| 세계관 스키마: 정규화 컬럼 + JSONB 하이브리드 | 세계관 설정 자유 형식 지원 | ✓ 구조화 필드 + 자유 JSONB 공존 |
| AI 컨텍스트: Structured Prompt Injection | MVP — 항목 200개 미만에서 최적 | ✓ 사이드패널 토글 → 시스템 프롬프트 자동 주입 |
| draft_router: langchain_core 직접 사용 | chat 도메인 의존성 없이 novel에서 AI 구현 | ⚠ LLM 격리 원칙 일부 완화 — v2에서 chat 도메인 재사용 검토 |
| AI-04/05 v2 이연 | MVP 핵심 가치 우선 (컨텍스트 주입 + SSE 스트리밍) | ✓ 핵심 기능 안정 출시 |

## Evolution

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-26 after v1.0 milestone*
