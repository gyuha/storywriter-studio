# Architecture Patterns: AI 집필 보조 도구

**Domain:** AI-assisted novel/web-serial writing platform
**Researched:** 2026-05-17
**Overall confidence:** HIGH — backed by existing codebase analysis + verified patterns from production writing tools (NovelCrafter, Sudowrite, Novarrium)

---

## 1. Recommended Architecture

시스템은 세 개의 주요 경계로 구성된다.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + TanStack Router)                     │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────┐             │
│  │              Chapter Editor Layout (features/chapter)         │             │
│  │                                                              │             │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │             │
│  │  │   Editor Panel          │  │   Side Panel            │   │             │
│  │  │   (TipTap + extensions) │  │   (Context Browser)     │   │             │
│  │  │                         │  │                         │   │             │
│  │  │  - Rich text editing    │  │  - Character list       │   │             │
│  │  │  - AI toolbar           │  │  - Location list        │   │             │
│  │  │  - SSE stream render    │  │  - World settings       │   │             │
│  │  │                         │  │  - "Pin to context"     │   │             │
│  │  └─────────────────────────┘  └─────────────────────────┘   │             │
│  │         │ reads/writes                │ reads + triggers     │             │
│  │         └─────────────┬──────────────┘                      │             │
│  │                       ▼                                      │             │
│  │           useChapterEditorStore (Zustand)                    │             │
│  │           - editorContent, selectedModel                     │             │
│  │           - pinnedContext: {characters[], locations[],       │             │
│  │                             worldSettings[], isAutoMode}     │             │
│  │           - generationState: idle/streaming/done            │             │
│  └──────────────────────────────────────────────────────────────┘             │
│                       │ React Query mutations / SSE                           │
└───────────────────────┼───────────────────────────────────────────────────────┘
                        │ HTTP + SSE
┌───────────────────────┼───────────────────────────────────────────────────────┐
│                       ▼                                                       │
│             BACKEND (FastAPI DDD)                                             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────┐              │
│  │  domains/story/     domains/chapter/     domains/world/      │              │
│  │  - Novel CRUD       - Chapter CRUD       - Characters        │              │
│  │  - Metadata         - Order mgmt         - Locations         │              │
│  │  - User ownership   - Status mgmt        - World settings    │              │
│  └──────────────┬──────────────┬──────────────────┬────────────┘              │
│                 │              │                  │                            │
│  ┌──────────────▼──────────────▼──────────────────▼────────────┐              │
│  │               domains/writing_agent/                         │              │
│  │               ContextAssemblyService                         │              │
│  │               - 선택적 컨텍스트 조립                         │              │
│  │               - 프롬프트 구성                                │              │
│  │               - AI 호출 (AbstractLLMPort 통해)               │              │
│  │               - SSE 스트리밍 응답                            │              │
│  └──────────────────────────────────────────────────────────────┘              │
│                                    │                                           │
│  ┌─────────────────────────────────▼────────────────────────────┐              │
│  │  infra/llm/provider_factory (기존)                            │              │
│  │  LiteLLM → Claude / GPT-4o / Gemini / Ollama                │              │
│  └──────────────────────────────────────────────────────────────┘              │
│                                                                               │
│  PostgreSQL: novels, chapters, characters, locations, world_settings           │
│  Redis: JWT blacklist (기존), 향후 generation job state 캐시 가능              │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI 컨텍스트 주입 설계 결정

### 2.1 RAG vs 프롬프트 구성 vs 선택적 컨텍스트 — 결론

**이 프로젝트에서 RAG는 과도하다. 선택적 프롬프트 구성(Selective Prompt Assembly)을 사용한다.**

근거:

**RAG가 부적합한 이유:**
- 웹소설 세계관 데이터는 일반적으로 소규모 (캐릭터 20~50개, 장소 10~30개, 세계관 설정 수십 항목)
- 총 토큰량이 구조화된 텍스트로 5K~20K 토큰 범위. 벡터 DB 구축·조회 오버헤드가 비용 대비 이익 없음
- RAG는 비정형 문서 수천 건에서 빛난다. 이 도메인의 데이터는 이미 구조화된 DB 레코드
- 임베딩 생성·저장·검색 파이프라인 추가 = 유지보수 비용 증가

**컨텍스트 전량 주입(Context Stuffing)이 부적합한 이유:**
- 소설이 길어질수록 모든 챕터 요약 + 전체 캐릭터 시트 + 전체 세계관을 매번 주입하면 토큰 비용 급증
- 관련 없는 캐릭터 정보가 포함되면 "주의력 분산(attention diffusion)" 발생 → 생성 품질 저하
- 토큰 2.7배, 응답 속도 2배 느려지는 실측 데이터가 있음 (MarkTechPost, 2026)

**선택적 프롬프트 구성(Selective Context Assembly)이 적합한 이유:**
- 사용자가 사이드패널에서 "현재 챕터에 등장하는 캐릭터·장소"를 명시적으로 선택
- 선택한 항목만 system prompt에 구조화된 텍스트 블록으로 포함
- 자동 모드: 챕터 제목/비트/직전 챕터 요약에서 entity 이름을 단순 문자열 매칭으로 추출하여 관련 항목 자동 선택
- NovelCrafter의 Codex 패턴이 이 방식. Novarrium의 분석에서 가장 효과적인 중간 방식으로 검증됨

### 2.2 컨텍스트 조립 구조 (백엔드)

```python
# domains/writing_agent/context_assembly.py

@dataclass
class ChapterGenerationRequest:
    chapter_id: UUID
    instruction: str                   # 작가가 입력한 생성 지시사항
    selected_model: str                # "claude-3-5-sonnet", "gpt-4o" 등
    pinned_context: PinnedContext      # 프론트엔드에서 선택한 컨텍스트

@dataclass
class PinnedContext:
    character_ids: list[UUID]          # 사이드패널에서 선택한 캐릭터
    location_ids: list[UUID]           # 사이드패널에서 선택한 장소
    world_setting_ids: list[UUID]      # 사이드패널에서 선택한 세계관 설정
    include_previous_chapter: bool     # 직전 챕터 요약 포함 여부
    include_story_beats: bool          # 해당 챕터 스토리 비트 포함 여부

class ContextAssemblyService:
    """
    선택된 컨텍스트 항목들을 조회하여 system prompt 블록으로 조립.
    Router → Service → (WorldRepository, ChapterRepository) → AbstractLLMPort
    """
    async def assemble_and_generate(
        self,
        request: ChapterGenerationRequest,
    ) -> AsyncIterator[str]:
        context_block = await self._build_context_block(request.pinned_context)
        messages = self._build_messages(context_block, request.instruction)
        async for chunk in self._llm_port.stream(messages):
            yield chunk

    def _build_context_block(self, ctx: PinnedContext) -> str:
        # 각 선택된 항목을 구조화된 텍스트 섹션으로 변환
        # 예: "## 등장인물\n### 김철수\n- 나이: 25세\n- 성격: 냉소적..."
        ...
```

### 2.3 프롬프트 구조

```
[System Message]
당신은 웹소설 집필 보조 AI입니다.

## 세계관 컨텍스트
{world_context_block}        ← 선택된 세계관 설정만 포함

## 등장인물
{character_context_block}    ← 선택된 캐릭터만 포함

## 장소
{location_context_block}     ← 선택된 장소만 포함

## 직전 챕터 요약 (선택시)
{previous_chapter_summary}

## 이번 챕터 스토리 비트 (선택시)
{story_beats}

[Human Message]
{author_instruction}         ← 작가가 입력한 지시사항 ("3화 계속 작성해줘. 주인공이 적과 첫 만남")
```

---

## 3. 컴포넌트 경계 (Component Boundaries)

### 3.1 백엔드 도메인 경계

| 도메인 | 책임 | 의존 |
|--------|------|------|
| `domains/story/` | 소설 프로젝트 CRUD, 메타데이터, 사용자 소유권 | `domains/shared/`, `core/` |
| `domains/chapter/` | 챕터 CRUD, 순서 관리, 상태(초안/완성), 챕터 요약 저장 | `domains/story/`, `domains/shared/` |
| `domains/world/` | 캐릭터·장소·세계관 설정 CRUD, 관계 그래프 | `domains/story/`, `domains/shared/` |
| `domains/writing_agent/` | 컨텍스트 조립, 프롬프트 구성, AI 호출, SSE 스트리밍 | `domains/chapter/`, `domains/world/`, `domains/chat/ports.py` |

**중요 제약:** `domains/writing_agent/`는 `AbstractLLMPort`에만 의존한다. `langchain_litellm`을 직접 import하지 않는다. 기존 `infra/llm/provider_factory.py`와 `domains/chat/container.py` 패턴을 그대로 재사용한다.

**`domains/chapter/`가 `domains/story/`를 import하는 것에 대해:** 이것은 기존 `auth`-`chat` 격리 규칙(sibling domains 금지)과 다르다. `chapter`는 `story`의 자식 개념이므로 계층적 의존은 허용한다. 단, `story`가 `chapter`를 역으로 import하면 안 된다.

### 3.2 프론트엔드 컴포넌트 경계

| 컴포넌트 | 위치 | 책임 |
|---------|------|------|
| `features/story/` | `web/src/features/story/` | 소설 목록, 생성/수정, 대시보드 |
| `features/chapter/` | `web/src/features/chapter/` | 챕터 목록, 에디터 레이아웃, AI 생성 UI |
| `features/world/` | `web/src/features/world/` | 캐릭터·장소·세계관 관리 CRUD |
| `ChapterEditorLayout` | `features/chapter/components/` | Editor + SidePanel 2-패널 레이아웃 |
| `EditorPanel` | `features/chapter/components/` | TipTap 에디터, AI 생성 버튼, 스트림 렌더 |
| `ContextSidePanel` | `features/chapter/components/` | 세계관 항목 브라우저, 컨텍스트 핀 토글 |
| `useChapterEditorStore` | `features/chapter/store/` | 에디터 + 사이드패널 공유 상태 (Zustand) |

---

## 4. 데이터 흐름

### 4.1 챕터 편집 → AI 생성 흐름

작가가 챕터 에디터 진입 → 사이드패널에서 관련 캐릭터/장소 선택(또는 자동 감지) → AI 생성 버튼 클릭 → SSE 스트림으로 텍스트 수신 → 에디터에 삽입

```
작가 액션
  ↓
[ChapterEditorLayout]
  ↓ pinnedContext (Zustand)
[useGenerateChapterMutation]  ← React Query mutation
  ↓ POST /api/v1/writing-agent/chapters/{id}/generate
    body: { instruction, pinned_context, selected_model }
[writing_agent/router]
  ↓ Depends(get_context_assembly_service)
[ContextAssemblyService.assemble_and_generate()]
  ↓ await WorldRepository (characters, locations, settings 조회)
  ↓ await ChapterRepository (직전 챕터 요약 조회)
  ↓ _build_context_block() → system prompt 구성
  ↓ AbstractLLMPort.stream(messages)
  ↓ SSE chunks → EventSourceResponse
[EditorPanel]
  ↓ onChunk: 스트리밍 텍스트를 에디터 커서 위치에 삽입
```

### 4.2 에디터 ↔ 사이드패널 상태 공유

두 패널은 공통 부모 컴포넌트(`ChapterEditorLayout`)가 소유하는 Zustand store 슬라이스를 통해 통신한다. props drilling이나 Context API를 쓰지 않는다.

```
ChapterEditorLayout
  ├── EditorPanel
  │     reads: useChapterEditorStore(s => s.generationState)
  │     writes: useChapterEditorStore(s => s.setContent)
  │
  └── ContextSidePanel
        reads: useChapterEditorStore(s => s.pinnedContext)
        writes: useChapterEditorStore(s => s.togglePinnedCharacter)
                useChapterEditorStore(s => s.setAutoContextMode)
```

**선택 이유:** React Context는 `pinnedContext` 변경 시 `EditorPanel`을 불필요하게 리렌더링한다. Zustand selector 패턴은 구독하는 슬라이스가 바뀔 때만 리렌더링하여 에디터 성능을 보호한다.

### 4.3 세계관 데이터 읽기 흐름 (사이드패널)

```
ContextSidePanel 마운트
  → useQuery('characters', { storyId })  ← React Query
  → GET /api/v1/stories/{id}/characters
  → WorldRepository → PostgreSQL
  → 캐릭터 목록 렌더링 (이름, 썸네일)
  → 사용자 토글 → useChapterEditorStore.togglePinnedCharacter()
```

---

## 5. 레이아웃 컴포넌트 설계

### 5.1 패널 분할

`shadcn/ui`의 `Resizable` 컴포넌트(내부적으로 `react-resizable-panels`)를 사용한다. 이미 프로젝트의 shadcn 패턴과 일치하고, `localStorage` 레이아웃 퍼시스턴스를 내장한다.

```tsx
// features/chapter/components/chapter-editor-layout.tsx
export function ChapterEditorLayout({ chapterId }: Props) {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      <ResizablePanel defaultSize={70} minSize={40}>
        <EditorPanel chapterId={chapterId} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={30} minSize={20} maxSize={40} collapsible>
        <ContextSidePanel storyId={storyId} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### 5.2 에디터 선택: TipTap

**TipTap을 선택한다. Lexical은 이 프로젝트에서 과도하다.**

| 기준 | TipTap | Lexical |
|------|--------|---------|
| React 19 지원 | 개발 중 (현재 React 18 기준, 19 호환성 진행 중) | 완전 지원 |
| AI 통합 확장 | 공식 AI Generation 확장 존재 | 직접 구현 필요 |
| shadcn/ui 친화성 | 높음 (headless, Tailwind 적용 용이) | 높음 |
| 학습 비용 | 낮음 (extension API 직관적) | 높음 (NodeTransform 복잡) |
| 커스텀 AI 삽입 | Extension으로 간단 구현 | 가능하나 복잡 |

**React 19 주의:** TipTap UI Components는 React 18 기준이나, 코어 `@tiptap/react` + `useEditor` hook은 React 19와 호환된다. UI Components 대신 직접 컴포넌트 구현으로 우회한다.

### 5.3 Zustand Store 구조

```typescript
// features/chapter/store/chapter-editor.store.ts
interface ChapterEditorStore {
  // 컨텍스트 선택
  pinnedContext: {
    characterIds: string[];
    locationIds: string[];
    worldSettingIds: string[];
    includesPreviousChapter: boolean;
    includesStoryBeats: boolean;
    isAutoMode: boolean;           // 자동 관련 항목 감지 여부
  };

  // AI 생성 상태
  generationState: 'idle' | 'streaming' | 'done' | 'error';
  selectedModel: string;           // "claude-3-5-sonnet-20241022"

  // 액션
  togglePinnedCharacter: (id: string) => void;
  togglePinnedLocation: (id: string) => void;
  setAutoContextMode: (enabled: boolean) => void;
  setGenerationState: (state: GenerationState) => void;
  setSelectedModel: (model: string) => void;
}
```

---

## 6. 소설 도메인을 기존 FastAPI DDD에 추가하는 방법

### 6.1 도메인 확장 전략

기존 `domains/auth/` 패턴을 그대로 복제한다. 구조 변경 없음.

```
apps/api/src/domains/
├── auth/          (기존 — 변경 없음)
├── chat/          (기존 — 변경 없음)
├── shared/        (기존 — 변경 없음)
├── story/         (신규) ← Novel 프로젝트 관리
│   ├── models/story_models.py
│   ├── schemas/story_schemas.py
│   ├── router/story_router.py
│   ├── service/story_service.py
│   └── repository/story_repository.py
├── chapter/       (신규) ← 챕터 관리
│   ├── models/chapter_models.py
│   ├── schemas/chapter_schemas.py
│   ├── router/chapter_router.py
│   ├── service/chapter_service.py
│   └── repository/chapter_repository.py
├── world/         (신규) ← 캐릭터·장소·세계관 설정
│   ├── models/world_models.py      (Character, Location, WorldSetting 테이블)
│   ├── schemas/world_schemas.py
│   ├── router/world_router.py
│   ├── service/world_service.py
│   └── repository/world_repository.py
└── writing_agent/ (신규) ← AI 생성 오케스트레이션
    ├── schemas/agent_schemas.py
    ├── router/agent_router.py
    ├── service/context_assembly_service.py
    └── ports.py                    (필요시 writing-specific 포트 추가)
```

### 6.2 `main.py` 라우터 등록

```python
# apps/api/src/main.py 의 _register_routers()에 추가
app.include_router(story_router,         prefix="/api/v1")
app.include_router(chapter_router,       prefix="/api/v1")
app.include_router(world_router,         prefix="/api/v1")
app.include_router(writing_agent_router, prefix="/api/v1")
```

### 6.3 DB 모델 요약

```
Novel: id, user_id, title, description, genre, status, created_at, updated_at
Chapter: id, novel_id, order_index, title, content, summary, status, created_at
Character: id, novel_id, name, description, personality, appearance, notes
Location: id, novel_id, name, description, notes
WorldSetting: id, novel_id, category(enum), title, content
StoryBeat: id, chapter_id, beat_type, content, order_index
```

---

## 7. 빌드 순서 (Build Order)

의존성에 따른 권장 구현 순서:

```
Phase 1: 인프라 연결
  백엔드 auth API → 프론트엔드 연결 (mock 제거)
  → 모든 도메인의 인증 기반 확보

Phase 2: 핵심 CRUD 도메인
  domains/story/ → domains/chapter/ → domains/world/
  (story 없이 chapter 불가, chapter·story 없이 world entity 연결 불가)
  프론트엔드: features/story/, features/world/

Phase 3: 챕터 에디터 UI
  ChapterEditorLayout + TipTap + ContextSidePanel
  (백엔드 world 도메인 완성 후 사이드패널 데이터 표시 가능)

Phase 4: AI 생성 파이프라인
  domains/writing_agent/ ContextAssemblyService
  (world 도메인 완성 후 컨텍스트 조립 가능, chat 도메인의 AbstractLLMPort 재사용)

Phase 5: 고급 세계관 기능
  인관관계 그래프, 연표, 스토리 비트 관리
  (기본 에디터·AI 생성 동작 검증 후)
```

의존성 방향: `auth` → `story` → `chapter` / `world` → `writing_agent`

---

## 8. 패턴 주의사항

### 8.1 따를 패턴

**컨텍스트 조립은 서비스 레이어에서만:** 프롬프트 구성 로직이 router에 들어가면 테스트 불가. `ContextAssemblyService`가 순수 Python 로직으로 프롬프트를 조립하고, router는 SSE 응답만 처리한다.

**`writing_agent`는 `AbstractLLMPort`에만 의존:** `chat` 도메인이 LLM을 독점하지 않는다. `writing_agent`도 같은 포트 인터페이스를 통해 LLM에 접근한다. 두 도메인은 같은 포트를 사용하지만 서로를 import하지 않는다.

**사이드패널 상태는 에디터 store 안에:** 별도 world-selection store를 만들지 않는다. 에디터 컨텍스트에서만 의미있는 "핀된 캐릭터 목록"은 `chapter-editor.store.ts` 안에 있어야 한다. 세계관 데이터 자체(캐릭터 목록 등)는 React Query cache가 관리한다.

### 8.2 피할 패턴

**자동 컨텍스트 감지에 LLM 사용 금지:** 챕터 텍스트에서 등장 캐릭터를 감지하는 데 별도 LLM을 호출하면 비용·지연이 2배. 단순 문자열 매칭(캐릭터 이름 기준)으로 충분하다.

**전체 소설 내용을 컨텍스트에 주입 금지:** 완성된 챕터 전문을 모두 system prompt에 넣으면 토큰 폭증. 챕터 요약(summary 필드, 200~500 토큰)만 주입한다. `Chapter.summary`는 챕터 완성 시 별도로 생성·저장한다.

**도메인 간 직접 import 금지 (`story`와 `chapter` 제외):** `writing_agent`가 `world`의 repository를 직접 import하지 않는다. DI를 통해 주입받는다.

---

## 9. 확장성 고려사항

| 관심사 | 현재 (~100명 사용자) | 향후 (~10K 사용자) |
|--------|---------------------|-------------------|
| AI 생성 처리 | 단일 FastAPI worker, SSE | 생성 요청을 Redis queue로 분리, 별도 worker |
| 컨텍스트 캐싱 | 매 요청마다 DB 조회 | Redis에 world data 5분 TTL 캐시 |
| 에디터 자동저장 | 수동 저장 | debounced 자동저장 (2초) + optimistic update |
| 모델 라우팅 | LiteLLM 직접 호출 | 사용자별 모델 설정 + usage 추적 |

RAG 전환 임계점: 소설당 세계관 항목이 300개를 초과하거나, 시리즈물로 수십 권 분량의 컨텍스트가 누적될 경우. 현재 아키텍처에서 `ContextAssemblyService`의 `_build_context_block` 구현을 벡터 검색으로 교체하면 된다. 포트 인터페이스는 변경 불필요.

---

## Sources

- [RAG vs. Context Stuffing — MarkTechPost (2026)](https://www.marktechpost.com/2026/02/24/rag-vs-context-stuffing-why-selective-retrieval-is-more-efficient-and-reliable-than-dumping-all-data-into-the-prompt/)
- [Effective Context Engineering — Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [AI Writing Tools Consistency Test — Novarrium](https://novarrium.com/blog/ai-writing-tools-keep-contradicting-themselves)
- [LangChain Story Writing Prompt Engineering — DeepWiki](https://deepwiki.com/langchain-ai/story-writing/2.3-prompt-engineering)
- [react-resizable-panels — GitHub](https://github.com/bvaughn/react-resizable-panels)
- [TipTap AI Generation Extension](https://tiptap.dev/docs/editor/extensions/functionality/ai-generation)
- [TipTap React Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [shadcn/ui Resizable](https://www.shadcn.io/ui/resizable)
