# 프로젝트 리서치 요약

**프로젝트:** StoryWriter Studio
**도메인:** AI 기반 웹소설 집필 보조 플랫폼 (Brownfield 확장)
**조사일:** 2026-05-17
**신뢰도:** HIGH

## 핵심 요약

StoryWriter Studio는 기존 FastAPI DDD + React 19 + LangChain/LiteLLM + PostgreSQL 스택 위에 소설 집필 특화 기능을 추가하는 Brownfield 확장 프로젝트다. 이 도메인에서 성공한 제품들(Novelcrafter, Sudowrite, Muvel)이 공통적으로 채택한 패턴은 명확하다: 리치 텍스트 에디터 + 구조화된 세계관 DB + 선택적 AI 컨텍스트 주입의 세 축이 핵심이며, 이 세 요소가 서로 연결될 때 비로소 경쟁 우위가 생긴다. AI가 세계관을 "안다"는 것 자체가 제품의 차별점이다.

기술 선택은 비교적 단순하다. 에디터는 TipTap 3.x(React 19 호환, tippy.js 의존성 제거됨), 세계관 스키마는 정규화 컬럼 + JSONB 하이브리드, AI 컨텍스트는 단계별 전략(Phase 1 선택적 프롬프트 주입 → Phase 2 pgvector RAG)을 따른다. 기존 `AbstractLLMPort`와 `infra/llm/provider_factory.py`를 변경 없이 재사용하므로 AI 인프라 재구축 비용은 없다.

가장 큰 위험은 기술이 아니라 설계 결정이다. 세 가지 Critical Pitfall이 프로젝트 전체를 무너뜨릴 수 있다: (1) AI 컨텍스트에 세계관 전체를 주입하는 설계 실수 — 선택적 주입(Codex 패턴)으로 반드시 막아야 한다. (2) 스트리밍 중 에디터 상태 충돌 — AI 생성 중 에디터 read-only 전환 + 버퍼 패턴으로 예방한다. (3) LangChain 블랙박스 의존 — 실제 페이로드 로깅과 얇은 어댑터 레이어로 통제권을 확보한다.

---

## 핵심 발견사항

### 권장 스택

기존 스택에 세 가지 신규 결정이 추가된다. TipTap 3.23.4는 React 19와 완전히 호환(tippy.js 제거)되며 소설 집필에 필요한 Typography, CharacterCount, Placeholder 등 확장이 모두 갖춰져 있다. 세계관 DB 스키마는 자주 필터링되는 속성(name, role, summary)을 정규화 컬럼으로, 장르별 가변 속성(외형, 능력, 관계)을 `attributes JSONB`로 분리하는 하이브리드 구조가 최적이다. AI 컨텍스트는 MVP에서 Structured Prompt Injection으로 시작하고, 세계관 항목이 200개 이상으로 커지면 pgvector RAG로 전환하는 이중 전략을 채택한다.

**핵심 기술 목록:**
- **TipTap 3.x (`@tiptap/react` 3.23.4):** 리치 텍스트 에디터 — React 19 호환, 소설 편집 확장 생태계, ProseMirror 기반 안정성
- **하이브리드 JSONB 스키마 (PostgreSQL):** 세계관 데이터 저장 — 정규화 컬럼으로 검색 성능, JSONB로 장르별 유연성 확보
- **Structured Prompt Injection (LangChain ChatPromptTemplate):** AI 컨텍스트 주입 — 기존 `AbstractLLMPort` 재사용, XML 태그 분리로 프롬프트 인젝션 방지
- **pgvector (SQLAlchemy 통합):** Phase 2 RAG 전환 대비 — `embedding` 컬럼을 처음부터 설계에 포함
- **`shadcn/ui` Resizable:** 2-패널 에디터 레이아웃 — `localStorage` 퍼시스턴스 내장, 기존 shadcn 패턴 일치
- **Zustand (`useChapterEditorStore`):** 에디터-사이드패널 공유 상태 — selector 패턴으로 불필요한 에디터 리렌더링 방지

### 기능 목록

FEATURES.md는 기능을 세 계층으로 분류했다. 테이블 스테이크는 경쟁 제품 모두 제공하는 기본 기능이고, 차별화 기능은 없으면 불편하지만 있으면 선택 이유가 되는 기능이다.

**반드시 있어야 하는 기능 (Table Stakes):**
- 챕터 리치 텍스트 에디터 + 글자 수 카운터 (한국 웹소설 5,000-5,500자 기준)
- 프로젝트 단위 소설 관리 + 챕터 순서/상태 관리
- 캐릭터/장소/세계관 설정 데이터베이스
- AI 초안 생성 (세계관 컨텍스트 주입 포함)
- 한국어 맞춤법 검사기 (부산대/네이버 API)
- 자동 저장 + 버전 이력
- 다중 AI 모델 선택 (기존 LiteLLM 인프라 활용)

**있으면 차별화되는 기능 (Differentiators):**
- AI 컨텍스트 자동 주입 — 챕터 작성 시 관련 캐릭터/장소/설정 자동 선택 (Novelcrafter Codex 패턴)
- 사이드패널 컨텍스트 뷰어 — 수동 제어로 AI에 전달되는 정보 확인
- 이전 챕터 요약 컨텍스트 — 연속성 유지를 위한 Smart Continue
- 분할 화면 (에디터 + 사이드패널 동시)
- 회차별 글자 수 목표 설정 (플랫폼별 preset)
- AI 생성 결과 인라인 삽입 (수락/거부 패턴)

**v2+로 미룰 기능:**
- 캐릭터 관계 그래프 (시각화) — 초기에는 텍스트 관계 목록으로 충분
- 연표/타임라인
- 연재 일정 캘린더
- HWP 내보내기 (TXT 내보내기로 단기 대응)
- 집필 통계 대시보드

**만들지 말아야 할 기능 (Anti-Features):**
- 실시간 공동 편집, AI 이미지 생성, AI 탐지 우회, 소셜 기능, 자동 완성 팝업

### 아키텍처 접근 방식

기존 FastAPI DDD 패턴을 그대로 유지하며 4개의 신규 도메인(`story`, `chapter`, `world`, `writing_agent`)을 추가한다. 핵심은 `writing_agent` 도메인이 모든 컨텍스트 조립을 담당하고, `AbstractLLMPort`를 통해서만 LLM에 접근하는 구조다. 프론트엔드는 `ChapterEditorLayout`이 TipTap `EditorPanel`과 `ContextSidePanel`을 `ResizablePanelGroup`으로 나누고, 두 패널은 Zustand store를 통해 통신한다. AI 생성은 SSE 스트리밍으로 처리한다.

**주요 컴포넌트:**
1. **`domains/story/`** — 소설 프로젝트 CRUD, 사용자 소유권, 메타데이터
2. **`domains/chapter/`** — 챕터 CRUD, 순서 관리, 상태 관리, 챕터 요약 저장
3. **`domains/world/`** — 캐릭터/장소/세계관 설정 CRUD, 관계 관리
4. **`domains/writing_agent/` (ContextAssemblyService)** — 컨텍스트 선택/조립, 프롬프트 구성, SSE 스트리밍
5. **`ChapterEditorLayout` (프론트엔드)** — TipTap 에디터 + ContextSidePanel 2-패널 레이아웃
6. **`useChapterEditorStore` (Zustand)** — 에디터-사이드패널 공유 상태, AI 생성 상태, 선택된 컨텍스트 항목

**의존성 방향:** `auth` → `story` → `chapter` / `world` → `writing_agent`

### 핵심 함정

1. **[C1] AI 컨텍스트에 세계관 전체 주입** — 세계관 항목 4,000 단어 초과 시 생성 품질 급락, 토큰 비용 폭발. 예방: 챕터별 관련 항목만 선택 주입(Codex 패턴), 시스템 프롬프트 내 세계관 블록 상한 1,500-4,000 단어 설정.

2. **[C2] 스트리밍 중 에디터 상태 충돌** — AI 생성 중 사용자 타이핑 시 커서 불일치, 텍스트 오염, undo 이력 손상. 예방: 생성 중 에디터 read-only 전환, 스트리밍 텍스트를 별도 버퍼에 누적 후 완료 시 단일 트랜잭션 삽입.

3. **[C3] LangChain 블랙박스 사용** — `astream()`/`with_structured_output()` 체이닝이 무음으로 오동작. 예방: 실제 request/response payload 로깅 커스텀 콜백 핸들러 필수 구현, 얇은 LiteLLM 어댑터 레이어 우선 고려.

4. **[M4] SSE 클라이언트 연결 종료 미처리** — 취소 후에도 LLM API 비용 계속 발생. 예방: `generation_id` 발급 + Redis 상태 저장 + 취소 엔드포인트 구현.

5. **[M6] 챕터 순서를 integer offset으로 관리** — 챕터 삽입 시 전체 재정렬 쿼리 필요. 예방: 처음부터 분수 인덱싱(FLOAT) 중간값 방식 사용.

---

## 로드맵 시사점

FEATURES.md의 기능 의존 관계와 ARCHITECTURE.md의 빌드 순서가 일치한다. 아래 단계 제안은 두 문서의 권장 순서를 통합한 것이다.

### Phase 1: 인증 연동 및 기반 인프라
**근거:** 모든 신규 도메인이 사용자 인증에 의존한다. 기존 auth API를 프론트엔드에 연결하고 mock을 제거하는 것이 선행 조건이다.
**산출물:** 실제 로그인/로그아웃이 동작하는 프론트엔드, 인증 기반 확보
**포함 기능:** 기존 auth 도메인 프론트엔드 연결
**회피 함정:** 없음 (기반 작업)

### Phase 2: 소설 프로젝트 + 챕터 관리 CRUD
**근거:** `chapter`가 `story`에 의존하므로 순서가 고정된다. 리치 텍스트 에디터는 챕터가 있어야 의미가 있다.
**산출물:** 프로젝트 생성/목록, 챕터 생성/순서관리/상태관리, TipTap 에디터 기본 동작, 글자 수 카운터
**포함 기능:** 프로젝트 관리, 챕터 CRUD, 챕터 에디터(TipTap), 자동 저장
**회피 함정:** [M6] 챕터 순서를 처음부터 FLOAT 분수 인덱싱으로 설계

### Phase 3: 세계관 데이터베이스 (캐릭터/장소/세계관 설정)
**근거:** 세계관 DB가 없으면 AI 컨텍스트 주입이 무의미하다. 이 Phase가 완성되어야 다음 Phase의 핵심 가치가 실현된다.
**산출물:** 캐릭터/장소/세계관 설정 CRUD, 하이브리드 JSONB 스키마
**포함 기능:** 캐릭터 DB, 장소 DB, 세계관 설정 DB, 기본 텍스트 관계 목록
**회피 함정:** [M2] 순수 JSONB 남용 방지 — 공통 컬럼(name, summary, project_id) 정규화 필수. [M1] 그래프 DB 충동 방지 — self-referential FK + `character_relationships` 테이블로 충분

### Phase 4: 챕터 에디터 UI + 사이드패널
**근거:** 세계관 DB 완성 후 사이드패널에서 데이터를 표시할 수 있다. 2-패널 레이아웃은 이 단계에서 완성된다.
**산출물:** ChapterEditorLayout (ResizablePanelGroup), ContextSidePanel, useChapterEditorStore, 컨텍스트 핀 토글
**포함 기능:** 분할 화면, 사이드패널 컨텍스트 뷰어, 관련 캐릭터/장소 필터링
**회피 함정:** [C2] 스트리밍 충돌 — AI 통합 전 에디터 상태 관리 패턴 확립

### Phase 5: AI 초안 생성 파이프라인
**근거:** 세계관 DB와 에디터 레이아웃이 모두 완성된 후 AI 통합이 최대 효과를 낸다. 이 단계에서 첫 실사용자 테스트가 가능하다.
**산출물:** ContextAssemblyService, SSE 스트리밍, AI 생성 UI (생성/취소/삽입), 컨텍스트 자동 주입
**포함 기능:** AI 초안 생성, 컨텍스트 자동 주입, 다중 모델 선택, 이전 챕터 요약 컨텍스트
**회피 함정:** [C1] 컨텍스트 전체 주입 방지 — 선택적 Codex 패턴 구현. [C3] LangChain 블랙박스 — 페이로드 로깅 필수. [M4] SSE 취소 미처리 — generation_id + Redis 상태. [M5] 모델별 특성 무시 — 모델별 어댑터 구현

### Phase 6: 한국어 품질 도구 + 내보내기
**근거:** 한국 작가 이탈 방지용 필수 기능. AI 생성 기능 검증 후 안정화 시점에 추가한다.
**산출물:** 맞춤법 검사기 통합, TXT 내보내기, 글자 수 목표 preset (플랫폼별)
**포함 기능:** 한국어 맞춤법 검사기, 플랫폼별 글자 수 preset, TXT 내보내기

### Phase 7: 고급 세계관 기능
**근거:** 기본 에디터/AI 생성 동작 검증 후 고급 사용자 유지용 기능 추가.
**산출물:** 캐릭터 관계 그래프, 연표/타임라인, 스토리 비트 관리, 집필 통계 대시보드
**포함 기능:** 관계 그래프 시각화, 연표, 스토리 비트, 캐릭터 progression 추적

### 단계 순서 근거

- Phase 1 → 2: auth 의존성이 모든 도메인의 선행 조건
- Phase 2 → 3: `chapter`는 `story` 없이 존재 불가, 에디터는 챕터 없이 의미 없음
- Phase 3 → 4: 세계관 데이터 없이 사이드패널이 표시할 데이터가 없음
- Phase 4 → 5: 에디터 레이아웃과 상태 관리가 완성되어야 AI 스트리밍 삽입이 안전
- Phase 5 → 6: 핵심 AI 기능 검증 후 보조 품질 도구 추가
- Phase 6 → 7: 고급 기능은 기본 워크플로우 안정화 후 추가

### 리서치 플래그

**심층 리서치가 필요한 Phase:**
- **Phase 5 (AI 파이프라인):** SSE 취소 처리의 구체적인 구현 패턴, LangChain vs 직접 LiteLLM 호출 결정이 복잡함. 구현 전 `/gsd-research-phase` 권장.
- **Phase 6 (맞춤법 검사기):** 부산대 vs 네이버 맞춤법 검사기 API 실제 사용 가능 여부, 요청 제한, 비용 구조 확인 필요.

**표준 패턴으로 진행 가능한 Phase:**
- **Phase 1:** 기존 auth 도메인과 프론트엔드 연결 — 패턴 명확
- **Phase 2:** FastAPI DDD CRUD + TipTap 통합 — 충분히 문서화된 패턴
- **Phase 3:** 하이브리드 JSONB 스키마 — STACK.md에 구체적인 코드까지 제공됨
- **Phase 4:** shadcn Resizable + Zustand — 표준 패턴
- **Phase 7:** 고급 기능은 기본 구조 위에 점진적 추가

---

## 신뢰도 평가

| 영역 | 신뢰도 | 비고 |
|------|--------|------|
| 스택 | HIGH | TipTap 3.23.4 npm 버전 확인, PostgreSQL JSONB 공식 문서 + AWS 가이드 일치, pgvector SQLAlchemy 통합 문서 확인 |
| 기능 | HIGH | Novelcrafter/Sudowrite/Muvel 실제 제품 기능 분석 기반, 한국 웹소설 시장 특성 반영 |
| 아키텍처 | HIGH | 기존 코드베이스 분석 + NovelCrafter/Novarrium 프로덕션 패턴 검증, MarkTechPost 실측 데이터 참조 |
| 함정 | HIGH | 실제 프로덕션 버그 리포트(LangChain GitHub, FastAPI GitHub), 에디터 충돌 실측 사례 기반 |

**전체 신뢰도:** HIGH

### 해결이 필요한 갭

- **TipTap UI Components React 19 호환성 [MEDIUM]:** 공식 문서가 "React 18 최적"으로 명시. 코어 `@tiptap/react`는 문제없으나 UI Components 패키지는 미검증. 대응: UI Components 미사용, 직접 컴포넌트 구현으로 우회 (ARCHITECTURE.md에 이미 반영).
- **맞춤법 검사기 API 실사용 가능 여부 [Medium]:** 부산대 API의 상업적 사용 정책, 네이버 맞춤법 검사기 API 접근 방법이 공개 문서에 불분명. Phase 6 기획 전 실제 API 접근 확인 필요.
- **한국어 LLM 성능 차이 [Medium]:** Claude vs GPT-4o의 한국어 소설 생성 품질 차이가 실측 데이터로 검증되지 않음. 다중 모델 지원 구현 후 A/B 테스트 권장.

---

## 출처

### Primary (HIGH 신뢰도)
- TipTap 3.0 Stable 릴리즈 노트 — React 19 호환성, tippy.js 제거 확인
- PostgreSQL 공식 문서 (JSONB) — 하이브리드 스키마 설계 근거
- AWS JSONB 패턴 가이드 — 하이브리드 스키마 권장 사례
- LangChain GitHub Issues #34382 — LangChain 블랙박스 함정 실증
- FastAPI GitHub Discussions #7572 — SSE 연결 종료 처리 패턴
- Anthropic Engineering (Effective Context Engineering) — 컨텍스트 주입 전략

### Secondary (MEDIUM 신뢰도)
- Novelcrafter 기능 페이지 + 문서 — Codex 패턴, 컨텍스트 주입 방식
- Novarrium AI Writing Tools Consistency Test — 선택적 컨텍스트 조립 효과 검증
- MarkTechPost (RAG vs Context Stuffing, 2026) — 컨텍스트 과부하 실측 데이터
- Liveblocks (Building AI copilot in TipTap) — 스트리밍 삽입 패턴
- Smashing Magazine (Stable Interfaces for Streaming, 2026) — 스트리밍 UX 패턴

### Tertiary (LOW 신뢰도)
- 한국 웹소설 시장 Wikipedia — 시장 규모 참조 (검증 필요)
- 웹소설 연재 분량 가이드 (Postype 블로그) — 5,000-5,500자 기준 (플랫폼별 상이할 수 있음)

---
*리서치 완료: 2026-05-17*
*로드맵 준비 완료: yes*
