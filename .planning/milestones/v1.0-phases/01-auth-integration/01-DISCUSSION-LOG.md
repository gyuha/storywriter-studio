# Phase 1: 인증 연동 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 1-인증 연동
**Areas discussed:** 토큰 저장 전략, 라우트 가드 구현 방식, 세션 복원 전략, 관리자 페이지 UI 범위

---

## 토큰 저장 전략

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | 바로 구현 가능, 백엔드 변경 없음. XSS 위험은 있지만 실용적 | ✓ |
| 메모리(Zustand)만 | 새로고침 시 날아감, refresh token으로 복원 필요 | |
| httpOnly cookie | 가장 안전, 백엔드 Set-Cookie/CORS 수정 필요 | |

**User's choice:** localStorage — access_token, refresh_token 모두 localStorage에 저장
**Notes:** 일반 웹소설 작가 대상 SaaS로 금융/의료 수준 보안 불필요. 백엔드 변경 최소화 우선.

---

## 라우트 가드 구현 방식

| Option | Description | Selected |
|--------|-------------|----------|
| `_authenticated.tsx` layout route (B) | TanStack Router 권장 패턴. Phase 2~4 라우트 추가 시 가드 자동 상속 | ✓ |
| `__root.tsx` 전역 beforeLoad (A) | 파일 하나로 관리, 예외 경로 화이트리스트 수동 관리 필요 | |

**User's choice:** `_authenticated.tsx` layout route (B 방식)
**Notes:** Phase 2~4에서 소설/챕터/세계관 라우트가 계속 추가되므로 자동 상속이 중요.

---

## 세션 복원 전략

| Option | Description | Selected |
|--------|-------------|----------|
| A: 앱 마운트 시 `/me` 호출 | 토큰 유효성 즉시 확인, 로딩 상태 처리 필요 | ✓ |
| B: localStorage에 user도 저장 | 즉시 복원, 만료 토큰 감지는 첫 API 요청까지 늦음 | |

**User's choice:** A 방식 — 앱 마운트 시 localStorage에 access_token이 있으면 GET /api/v1/auth/me 호출
**Notes:** access_token TTL 15분 고려 시 B 방식은 만료 토큰 문제 실질적으로 발생. A가 더 견고.

---

## 관리자 페이지 UI 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 최소 3개 엔드포인트 | 목록 조회 + 활성화 + 비활성화만 | ✓ |
| 4개 (목록+상세+활성화/비활성화) | 상세 페이지 UI가 있을 경우 필요 | |
| 확장 6개 | 삭제, 역할 변경 포함 | |

**User's choice:** 최소 3개 (GET /admin/users, POST /admin/users/{id}/activate, POST /admin/users/{id}/deactivate)
**Notes:** Phase 1 목표는 기반 확립. 확장 기능은 소설 도메인 생성 후 필요 시 추가.

---

## Claude's Discretion

- `useInitAuth()` 훅의 정확한 위치(`__root.tsx` 인라인 vs 별도 훅 파일) — planner가 기존 패턴에 맞춰 결정
- 로딩 스피너 컴포넌트 선택 — 기존 UI 라이브러리 활용
- 관리자 페이지 페이지네이션 방식(offset vs cursor) — planner 결정

## Deferred Ideas

- OAuth 소셜 로그인 프론트엔드 연결 (Google, Kakao, Naver) — 백엔드 완성, 프론트엔드 연결은 요구사항 없음
- refresh token 자동 갱신 인터셉터 — MVP에서는 수동 재로그인, 이후 개선
- 사용자 상세/삭제/역할 변경 — Phase 1 범위 초과
