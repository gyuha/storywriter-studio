# Roadmap: StoryWriter Studio

## Overview

기존 FastAPI DDD + React 19 + LangChain/LiteLLM 스택 위에 소설 집필 특화 기능을 단계적으로 추가한다. 인증 연동으로 기반을 확립하고, 소설/챕터 관리로 콘텐츠 구조를 만들고, 세계관 데이터베이스로 AI 컨텍스트의 원천을 구축한 뒤, 마지막으로 사이드패널과 AI 초안 생성을 통해 핵심 가치를 실현한다.

## Phases

**Phase 번호 체계:**

- 정수 Phase (1, 2, 3): 계획된 마일스톤 작업
- 소수 Phase (2.1, 2.2): 긴급 삽입 (INSERTED 표시)

- [ ] **Phase 1: 인증 연동** - 프론트엔드-백엔드 실제 인증 연결 (mock 제거)
- [ ] **Phase 2: 소설/챕터 관리** - 소설 프로젝트와 챕터 CRUD, TipTap 에디터 기본 동작
- [ ] **Phase 3: 세계관 데이터베이스** - 캐릭터/장소/세계관 설정 CRUD 및 관계 관리
- [ ] **Phase 4: 에디터 사이드패널 + AI 초안 생성** - 핵심 가치 실현: 세계관 컨텍스트가 AI에 자동 주입되어 챕터 초안 생성

## Phase Details

### Phase 1: 인증 연동

**Goal:** 사용자가 실제 백엔드 JWT로 인증하여 소설 도메인에 안전하게 접근할 수 있다
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):

  1. 사용자가 이메일/비밀번호로 로그인하면 실제 FastAPI 백엔드 JWT를 발급받고, 브라우저 세션을 닫았다가 다시 열어도 로그인 상태가 유지된다
  2. 사용자가 이메일/비밀번호로 회원가입하면 즉시 계정이 생성되고 로그인 상태로 전환된다
  3. 인증되지 않은 사용자가 소설 프로젝트 URL에 직접 접근하면 로그인 페이지로 리다이렉트된다
  4. 관리자가 관리자 페이지에서 사용자 목록을 조회하고 계정을 활성화/비활성화할 수 있다

**Plans:** 4 plans
Plans:
**Wave 1**

- [ ] 01-01-PLAN.md — 백엔드 관리자 API (admin_router.py, admin_schemas.py, DB seed migration)
- [ ] 01-02-PLAN.md — 프론트엔드 auth 타입/API 레이어 (types/auth.ts 확장, auth-api.ts 생성, mock 삭제)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-03-PLAN.md — 프론트엔드 인증 연결 (use-init-auth, use-auth-mutation 교체, _authenticated.tsx, __root.tsx)
- [ ] 01-04-PLAN.md — 관리자 사용자 관리 UI (AdminUsersPage, admin 훅, 라우트)

**UI hint:** yes

### Phase 2: 소설/챕터 관리

**Goal:** 사용자가 소설 프로젝트를 생성하고, 챕터를 추가하여 TipTap 에디터로 본문을 작성할 수 있다
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** PROJ-01, PROJ-02, PROJ-03, PROJ-04, CHAP-01, CHAP-02, CHAP-03, CHAP-04, CHAP-05, CHAP-06
**Success Criteria** (what must be TRUE):

  1. 사용자가 소설 프로젝트를 생성·수정·삭제할 수 있고, 내 프로젝트 목록 페이지에서 전체를 확인할 수 있다
  2. 사용자가 프로젝트 내에 챕터를 생성하고, 드래그앤드롭으로 순서를 바꾸며, 상태(초안/검토 중/완성)를 변경할 수 있다
  3. TipTap 에디터에서 굵게/이탤릭/단락 스타일을 사용해 챕터 본문을 작성하면 debounce 방식으로 자동 저장된다
  4. 에디터 하단에 현재 챕터의 글자 수가 실시간으로 표시되며, 5,000자 목표 달성 시 시각적 피드백이 나타난다

**Plans:** 4 plans
Plans:
**Wave 1** *(병렬 실행 가능)*

- [ ] 02-01-PLAN.md — 백엔드 novel 도메인 (DB 마이그레이션, models/schemas/repository/service/router, 단위 테스트)
- [ ] 02-02-PLAN.md — 프론트엔드 소설 CRUD (features/novel/ 타입·API·훅·컴포넌트, /novels 및 /novels/:id 라우트)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-03-PLAN.md — 챕터 에디터 (TipTap 설치, ChapterEditor, 자동저장 훅, 글자수·저장 상태 표시)
- [ ] 02-04-PLAN.md — 챕터 목록 사이드바 (dnd-kit SortableList, 순서 변경, 상태 변경, ChapterSidebar 연결)

**UI hint:** yes

### Phase 3: 세계관 데이터베이스

**Goal:** 사용자가 소설의 캐릭터·장소·세계관 설정을 구조화된 데이터베이스로 관리할 수 있다
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** WORLD-01, WORLD-02, WORLD-03, WORLD-04, WORLD-05, WORLD-06
**Success Criteria** (what must be TRUE):

  1. 사용자가 캐릭터를 생성·수정·삭제할 수 있고, 다른 캐릭터와의 관계(연인/적대/동료/가족)를 정의할 수 있다
  2. 사용자가 장소와 세계관 설정 항목(매직체계, 국가/세력, 역사, 규칙)을 생성·수정·삭제할 수 있다
  3. 사용자가 시간표/연표 항목을 생성하고 특정 챕터와 연결할 수 있다
  4. 세계관 항목 목록에서 이름 또는 유형으로 검색·필터링하여 원하는 항목을 빠르게 찾을 수 있다

**Plans:** 3 plans
Plans:
**Wave 1**

- [ ] 03-01-PLAN.md — DB 스키마 + 백엔드 도메인 (5개 테이블 마이그레이션, domains/world/ 전체, character+location+world_setting router, HeyAPI 재생성)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02-PLAN.md — 세계관 관리 프론트엔드 (features/world/ 타입·API·훅·컴포넌트, 캐릭터·장소·세계관설정 탭, /novels/:id/world 라우트)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-03-PLAN.md — 타임라인 + 캐릭터 관계 (백엔드 timeline/relationship router, HeyAPI 재생성, 시간표 탭, 캐릭터 관계 서브섹션)

**UI hint:** yes

### Phase 4: 에디터 사이드패널 + AI 초안 생성

**Goal:** 작가가 챕터를 편집할 때 캐릭터·장소·설정이 자동으로 AI 컨텍스트에 포함되어, 세계관과 일관된 챕터 초안을 AI가 생성한다
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** EDIT-01, EDIT-02, EDIT-03, EDIT-04, AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria** (what must be TRUE):

  1. 챕터 에디터가 좌측 편집 영역 + 우측 사이드패널의 2-패널 레이아웃으로 표시되며, 사이드패널에 현재 챕터와 관련된 캐릭터/장소/세계관 항목이 나열된다
  2. 사용자가 사이드패널에서 개별 항목을 "AI 컨텍스트에 포함" 토글로 선택/제외할 수 있고, 선택된 항목의 요약이 AI 생성 요청 시 시스템 프롬프트에 자동 포함된다
  3. 사용자가 "AI 초안 생성" 버튼을 클릭하면 AI가 생성한 텍스트가 SSE로 에디터에 실시간 스트리밍되고, 생성 중에는 에디터가 read-only 상태로 전환되며 취소 버튼이 표시된다
  4. 사용자가 사용할 AI 모델(Claude Sonnet / GPT-4o 등)을 선택할 수 있고, AI 생성 시 이전 챕터 요약이 컨텍스트에 자동 포함된다

**Plans:** TBD
**UI hint:** yes

## Progress

**실행 순서:** 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 인증 연동 | 0/4 | Not started | - |
| 2. 소설/챕터 관리 | 0/4 | Not started | - |
| 3. 세계관 데이터베이스 | 0/3 | Not started | - |
| 4. 에디터 사이드패널 + AI 초안 생성 | 0/TBD | Not started | - |
