# Requirements: v1.1 — 작품 기본정보 완성

## 목표

작품 설정 페이지의 기본 정보 섹션에서 모든 필드(한 줄 소개, 태그 포함)가
백엔드 DB와 완전히 동기화된다.

---

## v1.1 요구사항

### 백엔드 — Novel 모델 확장

- [ ] **NOVEL-01**: `tagline` (String(200), nullable) 필드가 Novel 모델과 DB에 추가된다
- [ ] **NOVEL-02**: `tags` (JSONB 배열, nullable, default=[]) 필드가 Novel 모델과 DB에 추가된다
- [ ] **NOVEL-03**: `NovelUpdate` 스키마가 `tagline`, `tags`를 optional 필드로 받는다
- [ ] **NOVEL-04**: `NovelResponse` 스키마가 `tagline`, `tags`를 반환한다

### 프론트엔드 — 기본 정보 섹션 연결

- [ ] **NOVEL-05**: 페이지 로드 시 `tagline`과 `tags`가 API 응답 데이터로 초기화된다
- [ ] **NOVEL-06**: "변경사항 저장" 클릭 시 `tagline`과 `tags`가 API에 전송되어 저장된다

---

## Future Requirements (이 마일스톤에서 제외)

- 커버 이미지 업로드 실제 연결 (현재 UI만 존재)
- 연재 정보(상태, 목표 회차 등) API 연결
- AI 어시스턴트 설정 API 연결
- 집필 환경 설정 API 연결

---

## Out of Scope

- 다른 설정 섹션(커버, 연재, AI, 집필환경)의 API 연결 — 별도 마일스톤
- tags 검색/추천 기능 — 복잡도 높음, 이후 마일스톤
- tagline/tags 글로벌 검색 인덱스 — v2 범위

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| NOVEL-01 | 5 | TBD | Pending |
| NOVEL-02 | 5 | TBD | Pending |
| NOVEL-03 | 5 | TBD | Pending |
| NOVEL-04 | 5 | TBD | Pending |
| NOVEL-05 | 5 | TBD | Pending |
| NOVEL-06 | 5 | TBD | Pending |
