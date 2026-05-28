# Milestones: StoryWriter Studio

## v1.0 MVP — Shipped 2026-05-26

**Version:** v1.0
**Name:** StoryWriter Studio MVP
**Status:** ✅ SHIPPED
**Date:** 2026-05-26
**Phases:** 1–4 | **Plans:** 13

### Delivered

AI 기반 웹소설 집필 에이전트 플랫폼의 핵심 기능 전체 구현 완료. 작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어 세계관과 일관된 초안을 AI가 생성한다.

### Stats

- **Timeline:** 9일 (2026-05-17 → 2026-05-26)
- **Commits:** ~77 (feat: 20, fix: ~15, docs/chore: ~42)
- **LOC:** Python 10,128 + TypeScript 31,251 = 41,379

### Key Accomplishments

1. HeyAPI SDK 기반 백엔드-프론트엔드 타입 자동 동기화로 mock 완전 제거
2. TipTap 3.x 에디터 + debounce 자동저장 + fractional indexing 챕터 순서 관리
3. 캐릭터/장소/세계관설정/시간표/관계 5종 세계관 데이터베이스 완성
4. 2-패널 에디터 레이아웃 + 세계관 컨텍스트 토글 + SSE 스트리밍 AI 초안 생성
5. FastAPI DDD 구조 (`domains/auth`, `novel`, `world`, `chat`) 4개 도메인 완성
6. 집필 통계 + 관리자 사용자 관리 UI 포함

### Known Deferred Items

| Category | Item | Deferred To |
|----------|------|-------------|
| Feature | AI-04: 사용자 AI 모델 선택 | v2 |
| Feature | AI-05: 이전 챕터 요약 자동 포함 | v2 |
| Feature | QUAL-01: 한국어 맞춤법 검사기 | v2 |
| Feature | QUAL-02: TXT 내보내기 | v2 |
| Feature | ADV-03: pgvector 의미 검색 | v2 |
| Tech Debt | draft_router.py langchain_core 직접 임포트 | v2 |

### Archive

- Roadmap: [.planning/milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)
- Requirements: [.planning/milestones/v1.0-REQUIREMENTS.md](.planning/milestones/v1.0-REQUIREMENTS.md)
- Git tag: `v1.0`
