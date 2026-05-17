# Requirements: StoryWriter Studio

**Defined:** 2026-05-17
**Core Value:** 작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어, 세계관과 일관된 글을 AI가 생성한다.

## v1 Requirements

### AUTH — 인증 및 기반 인프라

- [ ] **AUTH-01**: 사용자가 이메일/비밀번호로 로그인하면 프론트엔드가 실제 FastAPI 백엔드 JWT를 발급받아 인증 상태를 유지한다
- [ ] **AUTH-02**: 사용자가 이메일/비밀번호로 회원가입하면 계정이 생성되고 세션이 유지된다
- [ ] **AUTH-03**: 인증된 사용자만 소설 프로젝트 및 콘텐츠에 접근 가능하다
- [ ] **AUTH-04**: 관리자가 관리자 페이지에서 사용자 목록을 조회하고 계정을 관리할 수 있다

### PROJ — 소설 프로젝트 관리

- [ ] **PROJ-01**: 사용자가 소설 프로젝트를 생성할 수 있다 (제목, 장르, 설명, 커버 이미지 선택)
- [ ] **PROJ-02**: 사용자가 자신의 소설 프로젝트 목록을 조회할 수 있다
- [ ] **PROJ-03**: 사용자가 소설 프로젝트의 기본 정보를 수정할 수 있다
- [ ] **PROJ-04**: 사용자가 소설 프로젝트를 삭제할 수 있다 (하위 챕터/설정 포함)

### CHAP — 챕터 관리 및 에디터

- [ ] **CHAP-01**: 사용자가 소설 내에 챕터(회차)를 생성할 수 있다 (제목, 번호)
- [ ] **CHAP-02**: 사용자가 TipTap 리치 텍스트 에디터로 챕터 본문을 작성할 수 있다 (굵게/이탤릭/볼드, 단락 스타일, 링크 지원)
- [ ] **CHAP-03**: 챕터 본문이 작성 중 자동으로 저장된다 (debounce 방식)
- [ ] **CHAP-04**: 에디터에 현재 챕터의 글자 수가 실시간으로 표시되며, 5,000자 목표 달성 시 시각적 표시가 나타난다
- [ ] **CHAP-05**: 사용자가 드래그앤드롭으로 챕터 순서를 재정렬할 수 있다 (fractional indexing)
- [ ] **CHAP-06**: 챕터에 상태를 지정할 수 있다 (초안/검토 중/완성)

### WORLD — 세계관 데이터베이스

- [ ] **WORLD-01**: 사용자가 캐릭터를 생성·수정·삭제할 수 있다 (이름, 외형, 성격, 배경, 역할, 요약)
- [ ] **WORLD-02**: 사용자가 장소를 생성·수정·삭제할 수 있다 (이름, 설명, 위치 관계, 요약)
- [ ] **WORLD-03**: 사용자가 세계관 설정 항목을 생성·수정·삭제할 수 있다 (매직체계, 국가/세력, 역사, 규칙 — JSONB 자유 형식)
- [ ] **WORLD-04**: 사용자가 시간표/연표 항목을 생성·수정·삭제할 수 있다 (사건명, 날짜, 챕터 연결)
- [ ] **WORLD-05**: 사용자가 캐릭터 간 인간관계를 정의할 수 있다 (관계 유형: 연인/적대/동료/가족, 설명)
- [ ] **WORLD-06**: 세계관 항목 목록에서 검색 및 필터링이 가능하다 (이름, 유형별)

### EDITOR — 사이드패널 컨텍스트

- [ ] **EDIT-01**: 챕터 에디터는 좌측 에디터 + 우측 사이드패널의 2-패널 레이아웃으로 표시된다 (resize 가능)
- [ ] **EDIT-02**: 사이드패널에 현재 챕터에 관련된 캐릭터/장소/세계관 항목이 목록으로 표시된다
- [ ] **EDIT-03**: 사용자가 사이드패널에서 개별 항목을 "AI 컨텍스트에 포함" 토글로 선택/제외할 수 있다
- [ ] **EDIT-04**: 선택된 컨텍스트 항목의 요약이 AI 생성 요청 시 시스템 프롬프트에 자동으로 포함된다

### AI — AI 초안 생성

- [ ] **AI-01**: 사용자가 챕터 에디터에서 "AI 초안 생성" 버튼을 클릭하면 AI가 챕터 초안을 작성한다
- [ ] **AI-02**: AI 생성 결과가 SSE(Server-Sent Events)로 에디터에 실시간 스트리밍된다
- [ ] **AI-03**: AI 생성 중에는 에디터가 read-only 상태로 전환되고 취소 버튼이 표시된다
- [ ] **AI-04**: 사용자가 AI 모델을 선택할 수 있다 (Claude Sonnet/GPT-4o 등, LiteLLM 기반)
- [ ] **AI-05**: AI 생성 시 이전 챕터 요약이 컨텍스트에 자동으로 포함된다 (연속성 유지)

## v2 Requirements

### 품질 도구

- **QUAL-01**: 한국어 맞춤법 검사기 통합 (외부 API 연동)
- **QUAL-02**: TXT 내보내기 (한국어 인코딩, 챕터별 또는 전체)

### 고급 세계관

- **ADV-01**: 캐릭터 관계 그래프 시각화
- **ADV-02**: 스토리 비트 관리 (전체 플롯 구조, 긴장 포인트, 복선)
- **ADV-03**: pgvector 기반 세계관 항목 의미 검색 (항목 300개 초과 시)

### 분석

- **STAT-01**: 프로젝트별 집필 통계 (총 글자 수, 일일 작성량)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 출판/연재 플랫폼 직접 연동 | v1 범위 초과, 플랫폼 API 공개 여부 미확인 |
| 실시간 공동 편집 | 복잡도 높음, 핵심 가치와 무관 |
| 이미지/일러스트 생성 | 텍스트 집필 집중 |
| 모바일 앱 (iOS/Android) | 웹 우선, 모바일은 반응형으로 대응 |
| AI 자동완성 팝업 (인라인) | 집필 집중 방해 — Pull 방식(버튼)만 지원 |
| 소셜 기능 (좋아요, 팔로우) | 집필 도구 정체성 유지 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| CHAP-01 | Phase 2 | Pending |
| CHAP-02 | Phase 3 | Pending |
| CHAP-03 | Phase 3 | Pending |
| CHAP-04 | Phase 3 | Pending |
| CHAP-05 | Phase 2 | Pending |
| CHAP-06 | Phase 2 | Pending |
| WORLD-01 | Phase 3 | Pending |
| WORLD-02 | Phase 3 | Pending |
| WORLD-03 | Phase 3 | Pending |
| WORLD-04 | Phase 3 | Pending |
| WORLD-05 | Phase 3 | Pending |
| WORLD-06 | Phase 3 | Pending |
| EDIT-01 | Phase 4 | Pending |
| EDIT-02 | Phase 4 | Pending |
| EDIT-03 | Phase 4 | Pending |
| EDIT-04 | Phase 4 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 after initial definition*
