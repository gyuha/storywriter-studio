# Retrospective: StoryWriter Studio

## Milestone: v1.0 — StoryWriter Studio MVP

**Shipped:** 2026-05-26
**Phases:** 4 | **Plans:** 13

### What Was Built

1. **인증 연동** — HeyAPI SDK로 mock 제거, 실제 FastAPI JWT 연결, 관리자 사용자 관리 UI
2. **소설/챕터 관리** — 소설 CRUD, TipTap 에디터 + debounce 자동저장, fractional indexing 챕터 순서, dnd-kit drag-and-drop
3. **세계관 데이터베이스** — 캐릭터/장소/세계관설정/시간표/관계 완전한 CRUD, 캐릭터 관계 그래프, 스토리 비트, 집필 통계
4. **에디터 사이드패널 + AI 초안 생성** — 2-패널 레이아웃, 세계관 컨텍스트 토글, SSE 스트리밍 AI 초안 생성

### What Worked

- **GSD 워크플로우**: Plan → Execute → Review → Retro 사이클이 Phase당 명확한 체크포인트로 작동했다. 코드 리뷰에서 Critical/Important/Minor 분류가 실행 우선순위를 명확히 했다.
- **HeyAPI SDK 자동 생성**: openapi.json → TypeScript 타입 자동 동기화로 프론트엔드-백엔드 타입 불일치 오류가 없었다.
- **FastAPI DDD 패턴 일관성**: auth 도메인의 Router/Service/Repository 패턴을 novel/world 도메인에 그대로 재사용하여 학습 비용 최소화.
- **fractional indexing**: float order_key + needsReindex(0.001 임계값) 패턴으로 DB 재인덱스 없이 순서 변경 구현.

### What Was Inefficient

- **SUMMARY.md 미생성**: 각 Plan 완료 후 gsd-sdk 형식 SUMMARY.md를 생성하지 않아 milestone.complete 시 자동 통계 수집이 불가능했다. 수동으로 진행.
- **요구사항 체크박스 미업데이트**: REQUIREMENTS.md의 체크박스를 Phase 완료 후 갱신하지 않아 마일스톤 클로즈 시 "모두 Pending" 상황 발생.
- **draft_router 격리 결정 지연**: AI 초안 생성 구현 시 chat 도메인 재사용 vs. novel 도메인 직접 구현 결정을 실행 중에 했다. Plan 단계에서 명확히 결정했어야 했다.

### Patterns Established

- TipTap `immediatelyRender: false` — React 19 hydration 오류 방지 필수
- `langchain_core.messages` — chat/novel 도메인에서 메시지 구성용으로 허용 (langchain_litellm만 격리)
- API 호출 패턴: `features/*/lib/*-api.ts` 래퍼 → `throwOnError()` → React Query

### Key Lessons

1. **SUMMARY.md를 Plan 완료 직후 생성한다** — gsd-sdk milestone.complete가 이 파일에 의존함. 나중에 몰아서 하면 컨텍스트가 사라짐.
2. **요구사항 체크박스를 Phase 완료 시 즉시 업데이트한다** — 마일스톤 클로즈 시 검증이 가능해짐.
3. **LLM 격리 범위를 Plan 단계에서 결정한다** — "langchain_litellm만 격리" vs. "langchain_core도 격리" 결정이 구현 방향을 좌우함.
4. **Phase 4 AI-04/05를 v2로 이연한 것은 올바른 결정이었다** — MVP 핵심 가치(컨텍스트 주입 + SSE)를 안정적으로 출시하고, 모델 선택/이전 챕터 요약은 v2에서 추가.

### Cost Observations

- 4 Phases, 9일 (2026-05-17 ~ 2026-05-26)
- 총 77 커밋 (feat: 20, fix: ~15, docs/chore: ~42)
- Python 10,128 LOC + TypeScript 31,251 LOC = 41,379 LOC

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | LOC | Timeline | Key Pattern |
|-----------|--------|-------|-----|----------|-------------|
| v1.0 MVP | 4 | 13 | ~41k | 9 days | HeyAPI + TipTap + fractional indexing |
