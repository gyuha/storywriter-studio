# StoryWriter Studio

## What This Is

AI 기반 웹소설 집필 에이전트 플랫폼. 작가가 소설 프로젝트를 생성하고, 캐릭터·장소·세계관 설정을 데이터베이스로 관리하며, 챕터 에디터에서 AI가 해당 설정들을 컨텍스트로 참조하여 초안을 자동 생성하거나 집필을 보조한다. 일반 웹소설 작가가 주 대상이며, 다중 AI 모델을 지원한다.

## Core Value

작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어, 세계관과 일관된 글을 AI가 생성한다.

## Requirements

### Validated

- ✓ FastAPI 백엔드 + React 19 프론트엔드 아키텍처 — 기존 코드
- ✓ 사용자 인증/회원가입 (JWT, Argon2, OAuth 기반) — 기존 코드
- ✓ LangChain + LiteLLM 기반 다중 AI 모델 연동 인프라 — 기존 코드
- ✓ PostgreSQL + Redis 인프라 — 기존 코드

### Active

- [ ] 소설 프로젝트 생성/수정/삭제 및 목록 관리
- [ ] 챕터(회차) 생성, 순서 관리, 상태(초안/완성) 관리
- [ ] 캐릭터 데이터베이스 (이름, 외형, 성격, 관계, 등장 챕터)
- [ ] 장소 데이터베이스 (이름, 설명, 지도/위치 관계)
- [ ] 세계관 설정 데이터베이스 (매직체계, 국가/세력, 역사, 규칙)
- [ ] 시간표/연표 데이터베이스 (사건, 날짜, 챕터 연결)
- [ ] 인간관계 매핑 (캐릭터 간 관계 그래프)
- [ ] 스토리 비트 관리 (전체 플롯, 긴장 포인트, 복선)
- [ ] 챕터 에디터 — 리치 텍스트 편집 기능
- [ ] 챕터 에디터 — AI 초안 자동 생성 (설정 컨텍스트 자동 주입)
- [ ] 챕터 에디터 — 사이드패널 (관련 캐릭터·장소·설정 노출 및 선택 삽입)
- [ ] 다중 AI 모델 선택 (사용자가 Claude / GPT 등 선택 가능)
- [ ] 프론트엔드 ↔ 백엔드 API 실제 연동 (현재 mock 상태)

### Out of Scope

- 출판/연재 플랫폼 직접 연동 — v1 범위 초과, 별도 Phase로 고려
- 실시간 공동 집필 (다중 사용자 동시 편집) — 복잡도 높음, v2 이후
- 이미지/일러스트 생성 — 텍스트 집필에 집중
- 모바일 앱 (iOS/Android) — 웹 우선

## Context

**기존 코드베이스 상태 (2026-05-17 기준):**
- `apps/api/` — FastAPI + DDD 구조 (domains/auth 완성, domains/chat 기초)
- `web/` — React 19 + TanStack Router + Zustand + React Query
- 프론트엔드의 auth는 현재 mock API 함수 사용 중 (실제 백엔드 미연결)
- `web/src/sample/` — 대시보드/태스크/사용자/설정/채팅 UI 샘플 존재 (production 코드 아님)
- LangChain + LiteLLM으로 다중 AI 모델 지원 인프라 완성
- `domains/chat/` 에 hexagonal architecture 패턴 적용됨

**개발 우선순위:**
- 백엔드-프론트엔드 연동 먼저 확립 후 도메인 기능 추가
- 소설 도메인은 auth 패턴을 참조하여 `domains/story/`, `domains/chapter/`, `domains/world/` 등으로 확장

## Constraints

- **Tech Stack**: FastAPI(Python 3.12) + React 19(TypeScript 5.8) — 기존 스택 유지
- **AI**: LangChain + LiteLLM — 이미 통합된 인프라 활용, 모델 교체 가능
- **DB**: PostgreSQL (SQLAlchemy async) + Redis — 기존 인프라 유지
- **Auth**: 기존 JWT/OAuth 시스템 재사용, 소설 도메인에 RBAC 확장
- **i18n**: react-i18next 적용됨 — 한국어 우선

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FastAPI DDD 구조로 소설 도메인 추가 | 기존 auth 도메인 패턴 재사용 — 학습 비용 최소화 | — Pending |
| 다중 AI 모델 지원 (LiteLLM 라우팅) | 사용자가 Claude/GPT 선택 가능 — LiteLLM 이미 통합 | — Pending |
| 사이드패널 컨텍스트 자동 주입 방식 | AI 생성 시 관련 설정을 시스템 프롬프트에 자동 포함 | — Pending |
| 챕터 에디터 — 리치 텍스트 라이브러리 선택 | TipTap 또는 Lexical 검토 필요 (기존 UI 라이브러리 스택 고려) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

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
*Last updated: 2026-05-17 after initialization*
