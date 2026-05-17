# Domain Pitfalls: AI 기반 웹소설 집필 플랫폼

**Domain:** AI-assisted long-form fiction writing tool
**Researched:** 2026-05-17
**Project:** StoryWriter Studio (FastAPI + React 19 + LangChain/LiteLLM + PostgreSQL)

---

## 비판적 함정 (Critical Pitfalls)

실제로 재작성을 유발하거나 제품이 쓸모없어지는 수준의 실수들.

---

### [C1] 컨텍스트 창에 세계관 전체를 때려 넣기

**무슨 일이 벌어지는가:**
세계관 DB의 모든 캐릭터 시트, 장소 설명, 규칙을 매번 시스템 프롬프트에 전부 주입한다. 처음엔 동작하는 것처럼 보이나, 세계관이 커지면 생성 품질이 급락한다.

**왜 발생하는가:**
"더 많은 정보 = 더 나은 출력"이라는 직관은 틀렸다. LLM은 컨텍스트 창 전체에 균등하게 주의를 기울이지 않는다. 세계관 설정이 약 4,000 단어(한국어 기준 약 8,000자)를 넘어서면 모델이 산문보다 세계관 컨텍스트에 과도하게 가중치를 두어 문체가 딱딱해지고 서술이 무너진다. "Lost in the Middle" 현상으로 중간에 삽입된 정보의 실제 활용률은 30~60%에 불과하다.

**결과:**
- 생성 품질 저하 (세계관 설정을 반복 서술하는 문제)
- 토큰 비용 폭발 (매 챕터마다 수천 토큰 낭비)
- 챕터별 일관성이 없음 (세계관은 많은데 서사는 흔들림)

**예방:**
- 챕터 편집 시 **현재 씬에 등장하는** 캐릭터·장소·설정만 선택적으로 주입하는 Codex 시스템 구현 (Novelcrafter 방식)
- 세계관 항목에 "사용 빈도" 또는 "중요도" 태그를 붙이고, 토큰 예산에 따라 우선순위 기반으로 선택
- 시스템 프롬프트 내 세계관 컨텍스트 상한선 설정 (권장: 1,500~4,000 단어 이내)
- 이전 챕터 전체가 아닌 요약(summary)만 포함

**감지 신호:**
- 생성된 챕터에서 세계관 규칙이 그대로 복사 서술됨
- 챕터가 길어질수록 생성 품질 점진적 하락
- 토큰 사용량 로그에서 system prompt가 전체의 60% 초과

**해당 Phase:** 챕터 에디터 AI 통합 Phase (컨텍스트 주입 설계 시작 전)

---

### [C2] 스트리밍 텍스트 삽입 시 에디터 상태 충돌

**무슨 일이 벌어지는가:**
AI가 스트리밍으로 텍스트를 생성하는 동안 사용자가 에디터를 편집하면 커서 위치 불일치, 텍스트 오염, 심하면 에디터 상태 손상이 발생한다.

**왜 발생하는가:**
TipTap/Lexical은 트리 구조 기반 문서 모델을 사용한다. 스트리밍 토큰이 도착할 때마다 에디터 트랜잭션을 발생시키면, 사용자의 동시 편집 트랜잭션과 충돌한다. Cursor IDE조차 이 문제로 커서 위치 역산(desync) 버그를 겪었다.

**결과:**
- 사용자가 직접 쓴 텍스트가 AI 생성 텍스트와 뒤섞임
- 실행 취소(undo) 히스토리 오염 — 한 번 Ctrl+Z로 돌아가면 에디터 상태 불확실
- 생성 도중 저장하면 손상된 상태가 DB에 영구 저장

**예방:**
- AI 생성 중에는 에디터를 **읽기 전용(read-only)** 으로 전환하고 생성 취소 버튼만 노출
- 스트리밍 토큰을 에디터 내부가 아닌 **별도 버퍼(별도 React state)**에 누적 후, 완료 시점에 단일 트랜잭션으로 에디터에 삽입
- 삽입 방식은 "현재 커서 위치에 append"가 아니라 사전에 마킹된 **고정 앵커 노드**에 삽입
- TipTap 기준: `editor.chain().focus().insertContentAt(anchorPos, text).run()` 패턴 사용

**감지 신호:**
- E2E 테스트에서 생성 중 타이핑 후 텍스트 내용 검증 실패
- 스트리밍 완료 후 undo 이력 확인 시 비정상 상태

**해당 Phase:** 리치 텍스트 에디터 + AI 통합 Phase

---

### [C3] LangChain 추상화 레이어를 블랙박스로 사용

**무슨 일이 벌어지는가:**
"LangChain이 다 알아서 한다"고 믿고 내부 동작을 모른 채 체인을 쌓는다. 프로토타입에선 동작하다가 프로덕션에서 추적 불가능한 방식으로 실패한다.

**왜 발생하는가:**
LangChain의 콜백 시스템이 미들웨어 레이어를 통해 모델 호출을 래핑한다. `astream()`으로 에이전트를 호출하면 내부 미들웨어의 모델 호출이 에이전트 스트림에 누출되는 버그가 실제로 존재한다. `.bind(tools=...).with_structured_output(...)` 체이닝은 도구 설정을 API 페이로드에서 **무음(silent)으로 제거**하여 모델이 도구를 무시하고 환각 응답을 반환하면서도 파싱 성공으로 표시된다. 에러가 없으니 디버깅이 불가능하다.

**결과:**
- 프로덕션에서 간헐적으로 AI가 엉뚱한 텍스트를 생성해도 에러 로그 없음
- 모델 교체 시 출력이 완전히 달라지는데 원인 파악 불가
- LangChain 버전 업그레이드 시 기존 코드가 무음으로 다른 동작

**예방:**
- LangChain을 쓰더라도 **각 LLM 호출의 실제 request/response payload를 로깅**하는 커스텀 콜백 핸들러를 반드시 구현
- `with_structured_output()` 사용 시 Pydantic 스키마 검증 후 불일치 시 명시적 에러 발생
- 프로덕션 배포 전 모델별로 canonical test case 회귀 테스트 실행
- LangChain 체인이 아닌 **직접 LiteLLM 호출을 래핑한 얇은 어댑터 레이어** 우선 고려

**감지 신호:**
- 모델 응답이 가끔 구조가 다른데 에러가 발생하지 않음
- 스트리밍 응답 로그에 예상치 못한 중간 토큰이 포함
- LangChain 버전 올린 후 AI 출력 품질 변화

**해당 Phase:** AI 모델 통합 레이어 설계 Phase

---

## 중간 수준 함정 (Moderate Pitfalls)

**[M1] 캐릭터 관계 데이터를 그래프 DB로 이관하려는 충동**

캐릭터 간 관계 기능 요구사항을 보고 "관계 = 그래프 DB 필요"라는 결론으로 점프하는 실수. PostgreSQL + 관계 테이블로 충분하다. 복잡한 다중 홉 경로 탐색(예: "이 캐릭터에서 3단계 이내의 모든 캐릭터")이 필요할 때만 그래프 DB를 고려하면 된다. 웹소설 수준의 인간관계 맵은 단순 관계 테이블(`character_relationships: source_id, target_id, relationship_type, description`)로 충분하다. Apache AGE 같은 확장을 추가하면 기존 PostgreSQL 인프라를 유지하면서 그래프 쿼리도 가능하나, v1에서는 불필요하다.

**예방:** `character_relationships` 테이블을 자기 참조(self-referential) 외래 키로 설계. 방향성 있는 관계는 `direction` enum 컬럼으로 처리. 화이트보드에 실제 쿼리 패턴을 먼저 쓰고 테이블 설계를 시작할 것.

**해당 Phase:** 세계관 DB 스키마 설계 Phase

---

**[M2] 세계관 항목에 JSONB를 남용하는 스키마 설계**

세계관 엔티티(캐릭터, 장소, 설정)의 다양한 속성을 "나중에 필드 추가가 편하다"는 이유로 단일 `attributes JSONB` 컬럼에 몰아 넣는 실수. 시작엔 편하지만 검색·필터링·참조 무결성이 모두 무너진다.

**왜 발생하는가:**
"세계관 설정은 각 장르마다 다르니 유연하게"라는 논리는 타당해 보이나, 실제 AI 컨텍스트 조회 시 "이름이 X인 캐릭터의 외형 정보 가져오기" 같은 쿼리가 JSONB 경로 탐색으로 복잡해지고 인덱스 설계가 어려워진다.

**예방:**
- 모든 엔티티 유형에 공통 컬럼(`name`, `description`, `project_id`, `created_at`) 정규화 후 장르별 확장 속성만 JSONB에 저장
- 자주 필터링하는 속성(캐릭터 성별, 소속 세력 등)은 별도 컬럼으로 승격
- GIN 인덱스를 JSONB 전체가 아닌 실제 사용하는 키에만 적용

**감지 신호:**
- 캐릭터 목록 조회 API에서 `attributes->>'name'` 같은 JSONB 경로 쿼리 사용
- AI 컨텍스트 조립 로직에서 Python 레벨 필터링이 DB 쿼리보다 많음

**해당 Phase:** 세계관 DB 스키마 설계 Phase

---

**[M3] AI 생성 로딩 상태를 단순 스피너로 처리**

생성에 10~30초가 걸리는 장문 소설 챕터를 단순 "Loading..." 스피너만으로 처리하면 사용자가 취소했는지 오류가 났는지 알 수 없어 신뢰를 잃는다.

**왜 발생하는가:**
일반 API 응답(< 1초)에 최적화된 UX 패턴을 그대로 적용. 스트리밍 응답의 경우 "진행 중" 상태와 "완료" 상태 사이의 시각적 피드백이 없으면 체감 대기시간이 3배 이상 길게 느껴진다.

**예방:**
- 스트리밍을 쓰고 있다면 생성 토큰을 실시간으로 에디터 옆 미리보기 패널에 표시 (생성 완료 전 삽입 아님)
- 토큰 수 카운터 또는 "X 단어 생성 중..." 표시
- 언제든 취소 가능한 명시적 취소 버튼 노출
- 1초 미만 응답에는 로딩 상태 표시하지 말 것 (플리커 유발)

**해당 Phase:** 챕터 에디터 UX Phase

---

**[M4] SSE 스트리밍에서 클라이언트 연결 종료 미처리**

FastAPI에서 `StreamingResponse`로 AI 스트리밍을 구현할 때 사용자가 브라우저 탭을 닫거나 취소 버튼을 눌러도 서버 측 LLM 호출이 계속 실행되는 문제.

**왜 발생하는가:**
SSE는 WebSocket과 달리 서버가 클라이언트 연결 종료를 즉각 감지하지 못한다. 브라우저 재연결 로직 때문에 짧은 단절 후 자동 재연결이 발생하여 실제 취소 의도와 구분이 어렵다.

**결과:**
- 취소 후에도 LLM API 비용 계속 발생
- 서버 리소스 낭비 (동시 생성 요청 수 제한에 걸림)

**예방:**
- 각 생성 요청에 `generation_id` 발급 후 Redis에 상태 저장
- 클라이언트가 취소 시 별도 `DELETE /generations/{id}` 엔드포인트 호출
- 서버 제너레이터에서 주기적으로 Redis 상태 확인하여 취소 신호 시 제너레이터 종료
- `asyncio.CancelledError` 핸들링으로 LiteLLM 호출 조기 종료

**해당 Phase:** AI 스트리밍 백엔드 구현 Phase

---

**[M5] 다중 AI 모델 추상화 레이어에서 모델별 특성 무시**

LiteLLM이 통일된 인터페이스를 제공한다고 해서 Claude와 GPT-4가 동일하게 동작한다고 가정하는 실수.

**왜 발생하는가:**
LiteLLM은 API 호출 형식을 통일하지만, 모델별로 (1) 컨텍스트 창 크기, (2) 최적 system prompt 형식, (3) 출력 길이 특성, (4) JSON 출력 신뢰도, (5) 한국어 성능이 다르다. 특히 `BaseOpenAI`는 지정하지 않은 파라미터도 기본값으로 API에 전송하여 OpenAI 호환 API에서 파라미터 거부 에러를 유발한다.

**예방:**
- 모델 선택 UI에서 각 모델의 실제 컨텍스트 창 크기를 기반으로 세계관 주입량을 동적 계산
- 모델별 prompt 템플릿 분리 (Claude용 XML 태그 구조 vs GPT용 마크다운 구조)
- LiteLLM 호출 시 불필요한 파라미터를 명시적으로 제외하는 어댑터 구현
- 새 모델 추가 시 canonical test suite 실행 필수

**해당 Phase:** 다중 AI 모델 선택 기능 Phase

---

**[M6] 챕터 순서를 integer offset으로 관리**

챕터 순서를 `chapter_order INTEGER` 컬럼으로 관리하면 챕터 삽입/이동 시 전체 재정렬 쿼리가 필요하다. 1화와 2화 사이에 새 챕터를 넣으려면 2화부터 마지막 챕터까지 모두 +1 업데이트.

**예방:**
처음부터 **분수 인덱싱(fractional indexing)** 또는 `FLOAT` 기반 순서 컬럼 사용. 삽입 시 두 인접 값의 중간값 할당. 주기적으로 값 재정규화(renormalization) 작업 필요하나 삽입 비용이 O(1). 대안으로 PostgreSQL의 `ARRAY` 타입으로 프로젝트-챕터 순서를 관리하는 방법도 있으나 동시 편집 시 충돌 위험.

**해당 Phase:** 챕터 관리 백엔드 Phase

---

## 경미한 함정 (Minor Pitfalls)

**[X1] AI 생성 텍스트의 취소 불가 삽입**

사용자가 AI 생성 텍스트를 에디터에 삽입한 후 "이거 아닌데" 싶을 때 Ctrl+Z로 되돌릴 수 없는 설계. TipTap 트랜잭션을 단일 히스토리 항목으로 래핑하지 않으면 토큰별로 undo 스택이 쌓여 수십 번 Ctrl+Z를 눌러야 원래 상태로 돌아온다.

**예방:** 삽입 시 `editor.chain()` 트랜잭션으로 단일 undo 항목 생성. 삽입 전 "삽입하시겠습니까?" 확인 단계 또는 삽입 직후 5초간 취소 토스트 표시.

---

**[X2] 세계관 항목과 챕터 간 참조 무결성 없음**

캐릭터 A가 챕터 5에 등장 처리됐는데 캐릭터 A가 삭제되면 챕터 5의 참조가 허상(dangling)이 된다. AI 컨텍스트 조립 시 존재하지 않는 캐릭터 정보를 조회하는 에러로 이어진다.

**예방:** 챕터-캐릭터 연결 테이블(`chapter_characters`)에 CASCADE 정책을 "DELETE → SET NULL 또는 RESTRICT"로 명확히 지정. 소프트 삭제(soft delete) 패턴 적용하여 AI 컨텍스트 조회는 항상 `is_deleted=false` 필터 포함.

---

**[X3] AI 프롬프트를 코드에 하드코딩**

시스템 프롬프트와 유저 프롬프트 템플릿을 Python 문자열 상수로 하드코딩하면 품질 개선 시마다 코드 배포가 필요하다.

**예방:** 프롬프트 템플릿을 DB 또는 별도 설정 파일에 저장하고 버전 관리. 모델과 용도(초안생성/문체교정/대사생성)별로 템플릿 분리. Jinja2 같은 템플릿 엔진으로 동적 변수 주입.

---

## Phase별 위험 매핑

| Phase | 주요 위험 | 권장 대응 |
|-------|-----------|-----------|
| 백엔드 API 연동 확립 | — | 기반 작업이므로 위험 낮음 |
| 소설 도메인 모델 설계 | [M2] JSONB 남용, [M6] 챕터 순서 | 스키마 설계 전 쿼리 패턴 목록 작성 |
| 세계관 DB (캐릭터/장소/설정) | [M1] 그래프 DB 충동, [X2] 참조 무결성 | self-referential FK + soft delete |
| 챕터 에디터 (리치 텍스트) | [C2] 스트리밍 충돌, [X1] undo 오염 | 생성 중 read-only + 버퍼 삽입 패턴 |
| AI 컨텍스트 주입 설계 | [C1] 컨텍스트 과부하, [X3] 프롬프트 하드코딩 | Codex 선택 주입 + 토큰 예산 관리 |
| AI 스트리밍 백엔드 | [M4] SSE 연결 종료, [C3] LangChain 블랙박스 | generation_id + 명시적 취소 + 실제 페이로드 로깅 |
| 다중 AI 모델 선택 | [M5] 모델별 특성 무시 | 모델별 어댑터 + canonical test |

---

## 출처

- Anthropic Engineering: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Inkfluence AI: [Context Window Management Strategies](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
- Indie Hackers: [I built an AI that writes full-length novels](https://www.indiehackers.com/post/i-built-an-ai-that-writes-full-length-novels-with-consistent-characters-heres-what-i-learned-f0d3211a8a)
- Medium/CodeToDeploy: [Production Pitfalls of LangChain Nobody Warns You About](https://medium.com/codetodeploy/production-pitfalls-of-langchain-nobody-warns-you-about-44a86e2df29e)
- Smashing Magazine: [Designing Stable Interfaces For Streaming Content](https://www.smashingmagazine.com/2026/05/designing-stable-interfaces-streaming-content/)
- Liveblocks: [Building an AI copilot inside your Tiptap text editor](https://liveblocks.io/blog/building-an-ai-copilot-inside-your-tiptap-text-editor)
- FastAPI GitHub: [Stop streaming response when client disconnects](https://github.com/fastapi/fastapi/discussions/7572)
- Cybertec: [EAV design in PostgreSQL - don't do it!](https://www.cybertec-postgresql.com/en/entity-attribute-value-eav-design-in-postgresql-dont-do-it/)
- LangChain GitHub: [Model calls inside middleware are leaking when streaming](https://github.com/langchain-ai/langchain/issues/34382)
- Medium/Logic: [7 LangChain Production Issues](https://logic.inc/resources/langchain-production-issues)
