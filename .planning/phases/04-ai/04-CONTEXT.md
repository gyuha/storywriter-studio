# Phase 4: 에디터 사이드패널 + AI 초안 생성 - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

챕터 에디터에 우측 사이드패널을 추가하여 세계관 항목(캐릭터/장소/세계관설정)을 AI 컨텍스트로 선택하고, "AI 초안 생성" 버튼으로 SSE 스트리밍 방식의 챕터 초안을 생성한다.

**프론트엔드:** 2-패널 에디터 레이아웃 (에디터 + 사이드패널), 캐릭터·배경/설정·채팅·교정 4개 탭, AI 컨텍스트 토글 체크박스, SSE 스트리밍 수신 훅, 모델 선택 UI.

**백엔드:** `POST /api/v1/novels/{novel_id}/chapters/{chapter_id}/draft` SSE 엔드포인트, 세계관 컨텍스트 시스템 프롬프트 조립, 이전 챕터 내용 자동 포함.

**범위 밖:** 인라인 AI 자동완성 팝업, pgvector 의미 검색, 맞춤법 검사 실제 연동.

**구현 상태:** ROADMAP.md 기준 완료(✅). 프론트엔드 UI 및 SSE 클라이언트, 백엔드 draft 엔드포인트 모두 코드 작성 완료. 단, `draft_router`가 `apps/api/src/main.py`에 미등록 상태.

</domain>

<decisions>
## Implementation Decisions

### 에디터 레이아웃
- **D-01:** 에디터 페이지는 `position: fixed; inset: 0` 전체화면 레이아웃. 구성: NavRail(좌단) + ChapterPanel(272px) + 메인 에디터 + EditorRightPanel(320px).
- **D-02:** 집필 모드(`focusMode`) 토글 시 NavRail, ChapterPanel, RightPanel을 숨기고 순수 에디터만 표시.
- **D-03:** 테마 (라이트/다크) 전환은 CSS custom property(`--sw-*` 토큰)로 구현. `LIGHT_TOKENS`/`DARK_TOKENS` 객체를 컨테이너 인라인 스타일에 주입.

### 사이드패널 탭 구성
- **D-04:** 우측 패널 4탭: `캐릭터` | `배경/설정` | `교정` | `채팅`. 기본 활성 탭은 `background`.
- **D-05:** 캐릭터 탭 — `useCharacters(novelId)` 훅으로 전체 캐릭터 목록 조회. 각 항목에 체크박스("포함") 제공.
- **D-06:** 배경/설정 탭 — `useLocations(novelId)` + `useWorldSettings(novelId)` 두 쿼리 병합 표시. 장소/세계관설정 구분 헤더 포함.
- **D-07:** 교정 탭 — MVP 단계 UI 목업. 실제 맞춤법 검사 API 미연동 (v2 범위).
- **D-08:** 채팅 탭 — UI 목업만 구현. 실제 AI 채팅 연동은 v2 범위.

### AI 컨텍스트 선택
- **D-09:** 컨텍스트 선택 상태는 `EditorLayout`의 `useState<Record<string, ContextItem['type']>>` 로컬 상태. 엔티티 id → type 매핑.
- **D-10:** 선택된 항목은 `generate()` 호출 시 `context_items: ContextItem[]` 배열로 백엔드에 전달.

### AI 초안 생성 (프론트엔드)
- **D-11:** `useAiDraft` 훅이 SSE 수신 담당. `fetch()` + `ReadableStream` + `TextDecoder` 방식 (EventSource API 미사용 — POST body 전달을 위해).
- **D-12:** SSE 수신 중 에디터는 `readOnly={aiGenerating}` prop으로 편집 비활성화.
- **D-13:** AI 생성 취소: `AbortController.abort()` 호출 → fetch 중단.
- **D-14:** 스트리밍 텍스트는 에디터 커서 끝(end)에 `insertContent(data)` 방식으로 삽입.
- **D-15:** SSE 이벤트 포맷: `data: <텍스트청크>` 청크 이벤트, `data: [DONE]` 종료 sentinel, `event: error` 에러 이벤트.

### AI 초안 생성 (백엔드)
- **D-16:** 엔드포인트: `POST /api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`. `draft_router.py`에 구현, `prefix="/api/v1/novels"`로 등록 필요.
- **D-17:** 시스템 프롬프트 구성 순서:
  1. 역할 지시문
  2. `## 세계관 컨텍스트` — 선택된 캐릭터/장소/세계관설정 summary
  3. `## 이전 챕터 내용` — `include_prev_summary=true` 시 직전 챕터 텍스트 앞 1000자
  4. `## 현재 챕터 제목`
  5. 분량 지시 (500~800자)
- **D-18:** 이전 챕터 내용 추출: TipTap JSON → `_extract_text()` 재귀 함수로 텍스트 추출. `content.type == "text"` 노드의 `.text` 필드 수집.
- **D-19:** LLM 호출은 `ChatService.stream()` — `get_chat_service` DI 패턴 재사용. `infra/llm/provider_factory.py` 격리 유지.
- **D-20:** 모델 선택 (Claude/GPT/Gemini): 프론트엔드 UI에서 선택하지만 현재 백엔드에 전달되지 않음. 서버의 `LLM_PROVIDER` 환경변수가 실제 모델 결정. — **미결 사항** (상세 하단 참조).

### 모델 선택 연동 (미결)
- **D-21:** MVP 결정 — 프론트엔드 모델 선택 UI는 존재하지만 실제 백엔드 모델 전환 미구현. `DraftRequest`에 `model: str | None` 필드 추가 후 `ChatService`에 모델 오버라이드 전달이 필요하나, `ChatService` 및 `LLMClientProtocol`이 현재 모델 오버라이드를 지원하지 않음.
  - **결정:** MVP에서는 프론트엔드 모델 선택 UI를 유지하되, 백엔드 모델은 서버 환경변수(`LLM_PROVIDER`)로 고정. 모델 선택 실제 연동은 v2 개선 항목.

### draft_router 등록 (미완료 확인)
- **D-22:** `apps/api/src/main.py`의 `_register_routers()`에 `draft_router` import 및 `include_router(draft_router, prefix="/api/v1/novels")` 추가 필요. 현재 미등록으로 API 엔드포인트 미노출 상태.

### Claude's Discretion
- `EditorRightPanel`의 탭 너비(현재 320px) 및 `ChapterPanel` 너비(현재 272px) — 조정 가능.
- 교정 탭, 채팅 탭의 목업 UI 완성도 — MVP 단계에서는 현재 상태(정적 UI) 유지.
- `useAiDraft`에서 SSE 에러 이벤트 수신 시 사용자 피드백 방식 (현재 console.error만 — sonner toast 추가 고려).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항
- `.planning/REQUIREMENTS.md` §EDITOR — EDIT-01, EDIT-02, EDIT-03, EDIT-04
- `.planning/REQUIREMENTS.md` §AI — AI-01, AI-02, AI-03, AI-04, AI-05
- `.planning/ROADMAP.md` §Phase 4 — Goal, Success Criteria 4개 항목

### 이전 Phase 의사결정 (승계)
- `.planning/phases/02-novel-chapter-management/02-CONTEXT.md` — D-17~D-21 (TipTap 에디터 패턴, JSON 저장 포맷, debounce 자동저장)
- `.planning/phases/03-world-database/03-CONTEXT.md` — D-07 (`summary` 컬럼은 AI 컨텍스트 주입용으로 설계됨), D-08~D-12 (세계관 API 엔드포인트), D-16 (React Query 서버 상태 패턴)
- `.planning/STATE.md` §Decisions — "AI 컨텍스트 전략 — MVP는 Structured Prompt Injection"

### 기존 백엔드 패턴 (참조)
- `apps/api/src/domains/chat/router/chat_router.py` — SSE EventSourceResponse 패턴, ChatService 의존성 주입, `_event_gen()` 구조
- `apps/api/src/domains/chat/container.py` — `get_chat_service` DI 패턴
- `apps/api/src/domains/chat/service/chat_service.py` — `stream()` 메서드 시그니처
- `apps/api/src/domains/novel/router/draft_router.py` — **구현 완료된 draft 라우터** (main.py 미등록 주의)
- `apps/api/src/infra/llm/provider_factory.py` — LLM provider 격리 (이 파일만 langchain_litellm import)
- `apps/api/src/main.py` — `_register_routers()` 함수 (draft_router 등록 위치)

### 기존 프론트엔드 패턴 (참조)
- `apps/web/src/features/novel/components/editor-layout.tsx` — **구현 완료된 에디터 레이아웃**
- `apps/web/src/features/novel/components/editor-right-panel.tsx` — **구현 완료된 사이드패널**
- `apps/web/src/features/novel/hooks/use-ai-draft.ts` — **구현 완료된 AI 초안 훅**
- `apps/web/src/features/world/hooks/use-world-queries.ts` — `useCharacters`, `useLocations`, `useWorldSettings` 훅
- `apps/web/src/features/novel/components/chapter-editor.tsx` — TipTap 에디터, `readOnly` prop, `editorRef`

### 아키텍처 패턴
- `.planning/codebase/ARCHITECTURE.md` — 레이어 구조, 도메인 격리, LLM 격리 규칙
- `.planning/codebase/STACK.md` — `sse-starlette`, `langchain-litellm` 패키지 확인

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/domains/chat/container.py` — `get_chat_service` — draft_router에서 동일하게 사용 중
- `apps/api/src/domains/world/repository/` — `CharacterRepository`, `LocationRepository`, `WorldSettingRepository` — draft_router에서 컨텍스트 조회에 직접 사용
- `apps/web/src/features/world/hooks/use-world-queries.ts` — `useCharacters`, `useLocations`, `useWorldSettings` — editor-right-panel에서 사용 중
- `apps/web/src/stores/modal-store.ts` — 필요 시 모달 패턴 재사용 가능

### Established Patterns
- **SSE 스트리밍:** `EventSourceResponse` + async generator + `yield {"data": chunk}` + `yield {"data": "[DONE]"}` — chat_router 패턴과 동일
- **SSE 클라이언트:** `fetch()` + `ReadableStream.getReader()` + `TextDecoder` — EventSource API 대신 사용 (POST body 전달 필요)
- **LLM 격리:** `ChatService.stream()` 만 호출 — `langchain_litellm` 직접 import 금지
- **에디터 ref 패턴:** `useRef<Editor | null>` + `editorRef.current.commands.insertContent()` — use-ai-draft 패턴

### Integration Points
- `apps/api/src/main.py` `_register_routers()` — draft_router 등록 추가 필요 (`prefix="/api/v1/novels"`)
- `apps/web/src/routes/_authenticated/novels/$novelId/chapters/$chapterId/edit.tsx` — EditorLayout 마운트 지점
- `apps/api/src/domains/novel/router/novel_router.py` — 기존 novel 라우터 패턴 참조

</code_context>

<specifics>
## Specific Ideas

- `draft_router.py`의 `prefix` 등록 시 `/api/v1/novels`로 설정해야 함 — 엔드포인트가 `/{novel_id}/chapters/{chapter_id}/draft`로 정의되어 있으므로 최종 URL은 `/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`가 됨.
- 이전 챕터 요약은 `include_prev_summary=true` 기본값, TipTap JSON에서 순수 텍스트 추출 후 1000자 제한 — 긴 챕터도 안전하게 처리.
- 프론트엔드 모델 선택 드롭다운에 `claude`, `gpt`, `gemini` 3개 옵션 존재하나, 실제 백엔드 모델은 `LLM_PROVIDER` 환경변수 고정. MVP 수용 결정.

</specifics>

<deferred>
## Deferred Ideas

- 프론트엔드 모델 선택 → 백엔드 실제 전달 (per-request 모델 오버라이드) — `ChatService` + `LLMClientProtocol` 개선 필요, v2 범위.
- 맞춤법 검사 탭 실제 연동 (부산대/네이버 API) — v2 범위 (QUAL-01).
- 채팅 탭 AI 대화 실제 연동 — v2 범위.
- pgvector 의미 검색 기반 컨텍스트 자동 추천 (ADV-03) — 항목 200개 이상 시 고려, v2 범위.
- AI 생성 중 에러 시 sonner toast 피드백 개선 — 현재 console.error만 존재.

</deferred>

---

*Phase: 4-에디터 사이드패널 + AI 초안 생성*
*Context gathered: 2026-05-21*
