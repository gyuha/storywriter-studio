# Phase 4: 에디터 사이드패널 + AI 초안 생성 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 4-에디터 사이드패널 + AI 초안 생성
**Areas discussed:** 구현 현황 분석 (Phase 완료 상태로 기존 코드 기반 문서화)

---

## 문서화 방식

Phase 4는 ROADMAP.md 기준 이미 완료(✅ Done, 2026-05-20) 상태이므로, 사용자와의 질문/답변 방식이 아닌 기존 코드 분석을 통한 결정 사항 문서화 방식으로 진행했다.

| 분석 대상 | 결과 |
|-----------|------|
| `editor-layout.tsx` | 2-패널 레이아웃, 테마 토글, 집필 모드 — 완전 구현 |
| `editor-right-panel.tsx` | 4탭 사이드패널, AI 컨텍스트 토글 — 완전 구현 |
| `use-ai-draft.ts` | SSE 스트리밍 클라이언트, AbortController 취소 — 완전 구현 |
| `draft_router.py` | 백엔드 SSE 엔드포인트, 세계관 컨텍스트 주입 — 코드 완성, main.py 미등록 |

**발견된 미완료 항목:** `draft_router`가 `apps/api/src/main.py`에 등록되지 않아 API가 실제로 노출되지 않는 상태.

---

## 에디터 레이아웃

분석 기반 결정 (사용자 선택 없음 — 구현 코드에서 추출).

**결정 내용:**
- 전체화면 고정 레이아웃 (`position: fixed; inset: 0`)
- NavRail + ChapterPanel(272px) + 에디터 + RightPanel(320px) 4-구역 구성
- CSS custom property(`--sw-*`) 기반 테마 시스템

---

## AI 초안 생성 흐름

분석 기반 결정.

**결정 내용:**
- `fetch()` + ReadableStream 방식 SSE (EventSource 미사용 — POST body 전달 필요)
- 에디터 끝에 `insertContent()` 방식 텍스트 삽입
- `readOnly` prop으로 생성 중 편집 비활성화
- `AbortController`로 취소 처리

---

## 모델 선택 연동

프론트엔드 UI는 구현됐으나 백엔드 전달 미구현. MVP 수용.

| 옵션 | 설명 | 채택 |
|------|------|------|
| 환경변수 고정 (현재 구현) | `LLM_PROVIDER` 환경변수로 서버 모델 고정 | ✓ (MVP) |
| per-request 모델 오버라이드 | `DraftRequest.model` 필드 + ChatService 개선 필요 | — v2 |

**Notes:** ChatService와 LLMClientProtocol이 현재 per-request 모델 오버라이드를 지원하지 않아 v2로 연기.

---

## Claude's Discretion

- 사이드패널 너비(320px), 챕터패널 너비(272px) 조정 — 플래너 판단
- 교정/채팅 탭 목업 → 실제 연동 전략 — v2 플래너 판단
- AI 에러 시 sonner toast 추가 여부 — 플래너 판단

## Deferred Ideas

- 프론트엔드 모델 선택 → 백엔드 실제 전달 (v2)
- 맞춤법 검사 탭 실제 연동 (v2, QUAL-01)
- 채팅 탭 AI 대화 실제 연동 (v2)
- pgvector 의미 검색 기반 컨텍스트 자동 추천 (v2, ADV-03)
