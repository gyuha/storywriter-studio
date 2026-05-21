# Phase 4: 에디터 사이드패널 + AI 초안 생성 - Research

**작성일:** 2026-05-21
**도메인:** SSE 스트리밍 / TipTap 에디터 통합 / FastAPI 라우터 등록
**신뢰도:** HIGH — 모든 주요 파일을 직접 코드베이스에서 확인

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 에디터 페이지는 `position: fixed; inset: 0` 전체화면 레이아웃. 구성: NavRail(좌단) + ChapterPanel(272px) + 메인 에디터 + EditorRightPanel(320px).
- **D-02:** 집필 모드(`focusMode`) 토글 시 NavRail, ChapterPanel, RightPanel을 숨기고 순수 에디터만 표시.
- **D-03:** 테마(라이트/다크) 전환은 CSS custom property(`--sw-*` 토큰)로 구현. `LIGHT_TOKENS`/`DARK_TOKENS` 객체를 컨테이너 인라인 스타일에 주입.
- **D-04:** 우측 패널 4탭: `캐릭터` | `배경/설정` | `교정` | `채팅`. 기본 활성 탭은 `background`.
- **D-05:** 캐릭터 탭 — `useCharacters(novelId)` 훅으로 전체 캐릭터 목록 조회. 각 항목에 체크박스("포함") 제공.
- **D-06:** 배경/설정 탭 — `useLocations(novelId)` + `useWorldSettings(novelId)` 두 쿼리 병합 표시. 장소/세계관설정 구분 헤더 포함.
- **D-07:** 교정 탭 — MVP 단계 UI 목업. 실제 맞춤법 검사 API 미연동 (v2 범위).
- **D-08:** 채팅 탭 — UI 목업만 구현. 실제 AI 채팅 연동은 v2 범위.
- **D-09:** 컨텍스트 선택 상태는 `EditorLayout`의 `useState<Record<string, ContextItem['type']>>` 로컬 상태.
- **D-10:** 선택된 항목은 `generate()` 호출 시 `context_items: ContextItem[]` 배열로 백엔드에 전달.
- **D-11:** `useAiDraft` 훅이 SSE 수신 담당. `fetch()` + `ReadableStream` + `TextDecoder` 방식.
- **D-12:** SSE 수신 중 에디터는 `readOnly={aiGenerating}` prop으로 편집 비활성화.
- **D-13:** AI 생성 취소: `AbortController.abort()` 호출.
- **D-14:** 스트리밍 텍스트는 에디터 커서 끝(end)에 `insertContent(data)` 방식으로 삽입.
- **D-15:** SSE 이벤트 포맷: `data: <텍스트청크>` / `data: [DONE]` / `event: error`.
- **D-16:** 엔드포인트: `POST /api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`. `prefix="/api/v1/novels"` 등록 필요.
- **D-17:** 시스템 프롬프트 구성 순서: 역할 지시문 → 세계관 컨텍스트 → 이전 챕터 내용 → 챕터 제목 → 분량 지시.
- **D-18:** TipTap JSON → `_extract_text()` 재귀로 텍스트 추출.
- **D-19:** LLM 호출은 `ChatService.stream()` — DI 패턴 재사용.
- **D-20/D-21:** MVP에서 프론트엔드 모델 선택 UI는 존재하나 백엔드 모델은 `LLM_PROVIDER` 환경변수로 고정.
- **D-22:** `main.py`의 `_register_routers()`에 `draft_router` 미등록 — **이것이 이 Phase의 핵심 미완료 작업**.

### Claude's Discretion

- `EditorRightPanel`의 탭 너비(현재 320px) 및 `ChapterPanel` 너비(현재 272px) — 조정 가능.
- 교정/채팅 탭의 목업 UI 완성도 — MVP 단계에서는 현재 상태(정적 UI) 유지.
- `useAiDraft`에서 SSE 에러 이벤트 수신 시 사용자 피드백 방식 (현재 console.error만 — sonner toast 추가 고려).

### Deferred Ideas (OUT OF SCOPE)

- 프론트엔드 모델 선택 → 백엔드 실제 전달 (per-request 모델 오버라이드) — v2 범위.
- 맞춤법 검사 탭 실제 연동 — v2 범위 (QUAL-01).
- 채팅 탭 AI 대화 실제 연동 — v2 범위.
- pgvector 의미 검색 기반 컨텍스트 자동 추천 — v2 범위.
- AI 생성 중 에러 시 sonner toast 피드백 개선.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | 설명 | 연구 지원 |
|----|------|-----------|
| EDIT-01 | 챕터 에디터는 좌측 에디터 + 우측 사이드패널의 2-패널 레이아웃으로 표시된다 | `editor-layout.tsx` 구현 완료. 검증만 필요. |
| EDIT-02 | 사이드패널에 현재 챕터에 관련된 캐릭터/장소/세계관 항목이 목록으로 표시된다 | `editor-right-panel.tsx` + `use-world-queries.ts` 구현 완료. API 연결 검증 필요. |
| EDIT-03 | 사용자가 사이드패널에서 개별 항목을 "AI 컨텍스트에 포함" 토글로 선택/제외할 수 있다 | 체크박스 + `selectedContext` 상태 구현 완료. |
| EDIT-04 | 선택된 컨텍스트 항목의 요약이 AI 생성 요청 시 시스템 프롬프트에 자동으로 포함된다 | `draft_router.py` 구현 완료. `main.py` 등록 필요. |
| AI-01 | 사용자가 "AI 초안 생성" 버튼을 클릭하면 AI가 챕터 초안을 작성한다 | 버튼 + `useAiDraft.generate()` 구현 완료. 백엔드 라우터 등록 후 동작. |
| AI-02 | AI 생성 결과가 SSE로 에디터에 실시간 스트리밍된다 | `fetch()` + `ReadableStream` 방식 구현 완료. |
| AI-03 | AI 생성 중에는 에디터가 read-only 상태로 전환되고 취소 버튼이 표시된다 | `readOnly={aiGenerating}` + `AIToast` + `AbortController` 구현 완료. |
| AI-04 | 사용자가 AI 모델을 선택할 수 있다 (UI만, 실제 전환은 v2) | 모델 드롭다운 UI 구현 완료. 백엔드 전달은 MVP에서 생략 (D-21). |
| AI-05 | AI 생성 시 이전 챕터 요약이 컨텍스트에 자동으로 포함된다 | `include_prev_summary=true` 기본값, `_extract_text()` 구현 완료. |
</phase_requirements>

---

## Summary

Phase 4는 거의 완료 상태이다. 프론트엔드 에디터 레이아웃(`editor-layout.tsx`), 사이드패널(`editor-right-panel.tsx`), SSE 클라이언트 훅(`use-ai-draft.ts`), 백엔드 draft 라우터(`draft_router.py`)가 모두 코드 작성 완료 상태다. 실제 미완료 작업은 단 하나 — `apps/api/src/main.py`의 `_register_routers()` 함수에 `draft_router`를 import하고 `application.include_router(draft_router, prefix="/api/v1/novels")`를 추가하는 것이다.

단, 직접 코드 분석을 통해 추가로 발견한 사항들이 있다. `openapi.json`에는 draft 엔드포인트(`/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`)가 이미 포함되어 있고, HeyAPI가 생성한 `sdk.gen.ts`에도 `generateDraftApiV1NovelsNovelIdChaptersChapterIdDraftPost` 함수가 존재한다. 그러나 `use-ai-draft.ts`는 이 SDK 함수를 사용하지 않고 raw `fetch()`를 직접 호출한다. SSE 스트리밍은 일반 SDK 클라이언트가 처리할 수 없으므로 이는 올바른 설계다 — SSE는 `ReadableStream`으로 직접 처리해야 한다.

또한 기존 `pnpm lint`에서 139개 에러가 있으나 이는 Phase 4 관련 파일과 무관한 사전 존재 에러들이다. `pnpm typecheck`는 에러 없이 통과한다.

**핵심 작업:** `main.py`에 2줄 추가 + end-to-end 연결 검증. 나머지는 이미 완성된 코드를 confirm하는 작업이다.

---

## Architectural Responsibility Map

| 기능 | 주 티어 | 보조 티어 | 근거 |
|------|---------|-----------|------|
| 에디터 레이아웃 (2-패널) | Browser/Client | — | 순수 UI 배치, 서버 상태 없음 |
| 사이드패널 세계관 목록 | Browser/Client + API | Backend | React Query로 API 조회 |
| AI 컨텍스트 체크박스 선택 | Browser/Client | — | `useState` 로컬 상태 |
| SSE 스트리밍 클라이언트 | Browser/Client | — | `fetch()` + `ReadableStream` |
| AI 초안 생성 엔드포인트 | API/Backend | — | SSE 생성기, LLM 호출 |
| LLM 호출 격리 | API/Backend (infra) | — | `infra/llm/provider_factory.py` 단독 |
| 이전 챕터 텍스트 추출 | API/Backend | — | `_extract_text()` 재귀, TipTap JSON 파싱 |
| 세계관 컨텍스트 조회 | API/Backend | — | World domain 리포지토리 직접 사용 |

---

## Standard Stack

### Core (신규 패키지 없음 — 모두 기존 스택)

| 라이브러리 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| `sse-starlette` | ≥2.1.0 | FastAPI SSE 스트리밍 | 이미 설치됨 |
| `langchain-core` | ≥0.3.0 | LangChain 메시지 타입 | 이미 설치됨 |
| `@tiptap/react` | (기존) | 에디터 content 삽입 | 이미 설치됨 |
| `@tanstack/react-query` | 5.75.0 | 세계관 목록 쿼리 | 이미 설치됨 |

**Phase 4는 신규 패키지 설치가 필요 없다.** 모든 의존성이 이전 Phase에서 이미 설치되어 있다.

## Package Legitimacy Audit

해당 없음 — 이 Phase는 신규 외부 패키지를 설치하지 않는다.

---

## Architecture Patterns

### System Architecture Diagram

Phase 4의 데이터 흐름:

```
[사용자 체크박스 선택]
    → selectedContext (useState)
    → startAI() 호출 시 ContextItem[] 배열로 변환
    → useAiDraft.generate(contextItems)
        → fetch POST /api/v1/novels/{novelId}/chapters/{chapterId}/draft
           Authorization: Bearer {token}
           body: { context_items, include_prev_summary }
    → FastAPI draft_router.generate_draft()
        → WorldRepo.get_by_id() × N (선택된 컨텍스트 항목)
        → ChapterRepo.list_by_novel() (이전 챕터 텍스트)
        → SystemMessage 조립
        → ChatService.stream(lc_messages)
            → provider_factory (langchain_litellm)
    → EventSourceResponse (SSE)
        → data: 청크1
        → data: 청크2
        ...
        → data: [DONE]
    → ReadableStream reader (브라우저)
        → editor.commands.insertContent(chunk)
```

### 백엔드 라우터 등록 패턴 (기존 코드 패턴)

```python
# apps/api/src/main.py — _register_routers() 함수 내 추가할 코드
try:
    from domains.novel.router.draft_router import router as draft_router

    application.include_router(draft_router, prefix="/api/v1/novels")
    logger.debug("router_registered", prefix="/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft")
except ImportError:
    logger.debug("draft_router_not_found")
```

**주의:** `draft_router.py`의 APIRouter는 `prefix`가 없이 `APIRouter(tags=["draft"])`로 선언되어 있고 엔드포인트는 `"/{novel_id}/chapters/{chapter_id}/draft"`로 정의됨. 따라서 `include_router` 시 `prefix="/api/v1/novels"`를 지정하면 최종 URL은 `/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`가 됨. [VERIFIED: 코드베이스 직접 확인]

### SSE 클라이언트 패턴 (기존 구현, 변경 불필요)

```typescript
// use-ai-draft.ts — fetch() + ReadableStream 방식 (EventSource API 미사용 이유: POST body 전달 필요)
const response = await fetch(`/api/v1/novels/${novelId}/chapters/${chapterId}/draft`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ context_items: contextItems, include_prev_summary: includePrevSummary }),
  signal: abort.signal,
});
const reader = response.body.getReader();
// ... TextDecoder로 chunk 파싱 → editor.commands.insertContent(data)
```

### Anti-Patterns to Avoid

- **`EventSource` API 사용:** POST body 전달이 불가능하므로 사용 금지. 현재 구현이 올바름.
- **SDK `generateDraftApiV1...` 함수로 SSE 처리 시도:** HeyAPI SDK 클라이언트는 스트리밍 응답을 처리하지 않음. raw `fetch()`를 직접 사용하는 현재 구현이 올바름.
- **`draft_router`에서 HTTPException 직접 발생:** novel/chapter not found는 현재 올바르게 `HTTPException`으로 처리됨 (라우터 레이어에서 처리, 서비스 레이어 아님). 변경 불필요.

---

## Don't Hand-Roll

| 문제 | 만들면 안 되는 것 | 대신 사용 | 이유 |
|------|-----------------|-----------|------|
| SSE 스트리밍 백엔드 | 직접 HTTP chunked 응답 | `EventSourceResponse` (sse-starlette) | 이미 구현됨, 변경 불필요 |
| LLM 호출 | `langchain_litellm` 직접 import | `ChatService.stream()` via DI | LLM 격리 원칙 |
| TipTap JSON 텍스트 추출 | 정규식 기반 파서 | `_extract_text()` 재귀 함수 | 이미 구현됨 |

---

## Common Pitfalls

### Pitfall 1: draft_router prefix 중복

**잘못되는 경우:** `draft_router.py`의 `APIRouter`에 `prefix`가 있거나, `include_router` 시 경로가 다를 경우 최종 URL이 달라짐.

**현재 상태:** `draft_router.py`는 `APIRouter(tags=["draft"])`로 prefix 없음. 엔드포인트는 `"/{novel_id}/chapters/{chapter_id}/draft"`. `include_router(prefix="/api/v1/novels")`로 등록하면 최종 URL은 올바른 `/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft`.

**검증 방법:** 등록 후 FastAPI `/docs` 엔드포인트에서 draft 엔드포인트 노출 확인.

### Pitfall 2: openapi.json 갱신 누락

**잘못되는 경우:** `main.py`에 `draft_router`를 등록한 후 `pnpm generate:api`를 실행하지 않으면 `openapi.json`과 `src/generated/`가 stale 상태가 됨.

**현재 상태:** 이미 `openapi.json`에 draft 엔드포인트가 포함되어 있음 (확인됨). 즉, 과거에 이미 `pnpm generate:api`가 실행된 적이 있거나, `openapi.json`이 수동으로 편집된 상태. `main.py`에 라우터 등록 후 백엔드를 실행하여 생성된 스펙과 현재 `openapi.json`이 일치하는지 확인해야 함.

**검증 방법:** `draft_router` 등록 후 백엔드 서버 기동 → `pnpm generate:api` 재실행 → `src/generated/` 파일 변경 없음 확인.

### Pitfall 3: SSE 에러 이벤트 핸들링 미흡

**잘못되는 경우:** `event: error` SSE 이벤트 수신 시 현재 `console.error`만 있고 사용자 피드백 없음.

**현재 상태:** `use-ai-draft.ts`의 에러 처리는 `console.error('AI draft error:', err)`만 존재. 사용자는 생성이 실패해도 UI 피드백을 받지 못함.

**Claude's Discretion 항목:** sonner toast 추가가 권장되나 MVP에서는 현재 상태 유지 가능. 플래너가 판단.

### Pitfall 4: 세계관 리포지토리가 다른 도메인 경로 사용

**현재 상태:** `draft_router.py`는 `domains.world.repository.*`를 직접 import함. 이는 `novel` 도메인 라우터가 `world` 도메인 리포지토리를 직접 참조하는 것으로, CLAUDE.md의 도메인 격리 규칙(auth ↔ chat 격리)에는 해당되지 않음. `world`와 `novel`은 격리 대상이 아니므로 현재 구조는 허용됨. [VERIFIED: CLAUDE.md 확인]

---

## Code Examples

### 1. draft_router 등록 (main.py에 추가할 코드)

```python
# Source: 코드베이스 apps/api/src/main.py _register_routers() 패턴
try:
    from domains.novel.router.draft_router import router as draft_router

    application.include_router(draft_router, prefix="/api/v1/novels")
    logger.debug("router_registered", prefix="/api/v1/novels/{novel_id}/chapters/{chapter_id}/draft")
except ImportError:
    logger.debug("draft_router_not_found")
```

### 2. SSE 이벤트 생성기 패턴 (기존 구현 참조)

```python
# Source: apps/api/src/domains/novel/router/draft_router.py (구현 완료)
async def _event_gen() -> Any:
    try:
        async for chunk in service.stream(lc_messages):
            yield {"data": chunk}
        yield {"data": "[DONE]"}
    except Exception as exc:
        yield {"event": "error", "data": str(exc)}

return EventSourceResponse(_event_gen())
```

### 3. SSE 클라이언트 청크 처리 (기존 구현 참조)

```typescript
// Source: apps/web/src/features/novel/hooks/use-ai-draft.ts (구현 완료)
for (const line of lines) {
  if (line.startsWith('event: ')) { isErrorEvent = line === 'event: error'; continue; }
  if (!line.startsWith('data: ')) continue;
  const data = line.slice(6);
  if (data === '[DONE]') break outer;
  if (data && !isErrorEvent) {
    editor.commands.insertContent(data);
  }
}
```

---

## State of the Art

| 기존 방식 | 현재 방식 | 비고 |
|---------|---------|------|
| EventSource API (GET 전용) | `fetch()` + `ReadableStream` | POST body 전달 필요 시 표준 패턴 |
| LLM 직접 호출 | `ChatService.stream()` via DI | LLM 격리 원칙 준수 |

---

## Open Questions (RESOLVED)

1. **openapi.json이 어떻게 draft 엔드포인트를 이미 포함하는가?**
   - 알고 있는 것: `main.py`에 `draft_router`가 미등록인데 `openapi.json`에는 draft 경로가 존재함.
   - **결론:** draft_router 등록 후 `pnpm generate:api` 재실행. 변경 없으면 현재 `openapi.json`이 이미 올바른 것 (이전에 수동 편집 또는 등록 시 생성된 것으로 추정). 변경 있으면 `src/generated/`도 함께 업데이트. Plan 체크포인트에 `pnpm generate:api` 실행 후 git diff 확인 단계 포함.

2. **sonner toast를 SSE 에러 핸들링에 추가할 것인가?**
   - 알고 있는 것: 현재 `console.error`만 있음. Claude's Discretion 항목.
   - **결론:** MVP에서는 `console.error` 유지. sonner toast 추가는 v2 개선 항목으로 deferred (CONTEXT.md Deferred Ideas와 일치). 추가 공수 최소(1줄)이지만 Phase 4 scope에서 명시적으로 제외.

---

## Environment Availability

백엔드 실행 환경 (LLM API 키 필요):

| 의존성 | 필요 이유 | 가용 여부 | 비고 |
|-------|---------|---------|------|
| LLM API 키 | AI 초안 생성 실제 테스트 | 알 수 없음 | `.env`에 설정 필요 (LLM_PROVIDER + 해당 키) |
| PostgreSQL | chapter/world 데이터 조회 | docker-compose로 가용 | `docker compose up -d` |
| Redis | JWT 인증 | docker-compose로 가용 | `docker compose up -d` |

**LLM API 키 미설정 시:** `draft_router` 등록 자체는 정상 동작. 실제 AI 생성 요청 시 `ChatService.stream()` 단계에서 LLM 제공자 에러 발생. 단위 테스트는 mock으로 가능.

---

## Validation Architecture

### Test Framework

| 속성 | 값 |
|------|-----|
| 프레임워크 | pytest + pytest-asyncio |
| 빠른 실행 | `cd apps/api && uv run pytest -m unit` |
| 전체 실행 | `cd apps/api && uv run pytest` |

### Phase 요구사항 → 테스트 맵

| Req ID | 동작 | 테스트 유형 | 자동화 명령 |
|--------|------|------------|------------|
| AI-01/AI-02 | draft 엔드포인트 SSE 스트리밍 응답 | integration (API) | 수동 검증 (LLM mock 필요) |
| AI-03 | `readOnly` prop이 `aiGenerating` 상태와 동기화 | visual | 브라우저 직접 확인 |
| AI-05 | `include_prev_summary` 시 이전 챕터 포함 | unit (`_extract_text` 함수) | `uv run pytest tests/ -k draft` |
| EDIT-04 | 선택된 컨텍스트가 시스템 프롬프트에 포함 | integration | draft 엔드포인트 mock 테스트 |

**검증 핵심:** draft 엔드포인트 등록 후 FastAPI `/docs`에서 엔드포인트 노출 확인 → `curl` 또는 브라우저 UI로 스트리밍 동작 확인.

---

## Security Domain

| ASVS 카테고리 | 해당 여부 | 현재 통제 수단 |
|--------------|---------|--------------|
| V2 Authentication | 해당 | `Depends(get_current_user)` — draft_router 구현 완료 |
| V4 Access Control | 해당 | `novel.user_id != current_user.id` 소유권 검증 — draft_router 구현 완료 |
| V5 Input Validation | 해당 | Pydantic `DraftRequest` 스키마 검증 |

**현재 구현의 보안 상태:** `draft_router.py`는 JWT 인증(`get_current_user`), 소설 소유권 검증(user_id 비교), 챕터 존재 검증 모두 구현됨. 추가 보안 작업 불필요.

---

## Sources

### Primary (HIGH confidence)

- 코드베이스 직접 확인: `apps/api/src/domains/novel/router/draft_router.py` — 구현 완료 상태
- 코드베이스 직접 확인: `apps/api/src/main.py` — `_register_routers()` 내 draft_router 미등록 확인
- 코드베이스 직접 확인: `apps/web/src/features/novel/hooks/use-ai-draft.ts` — SSE 클라이언트 구현 완료
- 코드베이스 직접 확인: `apps/web/src/features/novel/components/editor-layout.tsx` — 에디터 레이아웃 구현 완료
- 코드베이스 직접 확인: `apps/web/src/features/novel/components/editor-right-panel.tsx` — 사이드패널 구현 완료
- 코드베이스 직접 확인: `apps/web/src/generated/sdk.gen.ts` — `generateDraftApiV1...` SDK 함수 존재 확인
- 코드베이스 직접 확인: `apps/web/openapi.json` — draft 엔드포인트 이미 포함 확인
- 코드베이스 직접 확인: `pnpm typecheck` — 타입 에러 없음 (exit 0)

---

## Metadata

**신뢰도 분류:**
- 표준 스택: HIGH — 신규 패키지 없음, 모두 기존 인프라
- 아키텍처: HIGH — 코드베이스 직접 확인
- 핵심 작업: HIGH — `main.py` 미등록 단 1건 확인
- 잠재적 후속 작업: MEDIUM — openapi.json/generated 재생성 필요 여부는 백엔드 실행 후 확인

**연구 날짜:** 2026-05-21
**유효 기간:** 30일 (안정적인 스택)
