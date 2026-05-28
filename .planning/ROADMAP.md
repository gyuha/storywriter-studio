# Roadmap: StoryWriter Studio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-05-26) → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- 🔄 **v1.1 작품 기본정보 완성** — Phase 5 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-05-26</summary>

- [x] Phase 1: 인증 연동 (4/4 plans) — completed 2026-05
- [x] Phase 2: 소설/챕터 관리 (4/4 plans) — completed 2026-05
- [x] Phase 3: 세계관 데이터베이스 (3/3 plans) — completed 2026-05
- [x] Phase 4: 에디터 사이드패널 + AI 초안 생성 (2/2 plans) — completed 2026-05-26

</details>

### v1.1 작품 기본정보 완성

- [ ] **Phase 5: 작품 기본정보 API 완성** — Novel 모델에 tagline/tags 필드를 추가하고 작품 설정 페이지에서 저장까지 완전히 연결한다

## Phase Details

### Phase 5: 작품 기본정보 API 완성
**Goal**: Novel 모델에 tagline/tags 필드를 추가하고 작품 설정 페이지에서 저장까지 완전히 연결한다
**Depends on**: Phase 4 (완료)
**Requirements**: NOVEL-01, NOVEL-02, NOVEL-03, NOVEL-04, NOVEL-05, NOVEL-06
**Success Criteria** (what must be TRUE):
  1. Novel API 응답에 tagline, tags 필드가 포함된다
  2. 작품 설정 기본 정보 섹션에서 한 줄 소개와 태그를 입력하고 저장하면 페이지 새로고침 후에도 값이 유지된다
  3. 기존 title/genre/description 저장 기능이 정상 작동한다 (회귀 없음)
**Plans**: 1 plan
Plans:
- [ ] 05-01-PLAN.md — 백엔드 마이그레이션/스키마/라우터 + SDK 재생성 + 프론트엔드 상태 연결

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. 인증 연동 | v1.0 | 4/4 | ✅ Complete | 2026-05 |
| 2. 소설/챕터 관리 | v1.0 | 4/4 | ✅ Complete | 2026-05 |
| 3. 세계관 데이터베이스 | v1.0 | 3/3 | ✅ Complete | 2026-05 |
| 4. 에디터 사이드패널 + AI 초안 생성 | v1.0 | 2/2 | ✅ Complete | 2026-05-26 |
| 5. 작품 기본정보 API 완성 | v1.1 | 0/1 | Not started | - |
