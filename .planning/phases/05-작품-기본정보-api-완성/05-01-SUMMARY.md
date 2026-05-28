---
phase: "05"
plan: "01"
status: complete
completed: 2026-05-28
one_liner: "Novel tagline/tags 전체 스택 구현 — Alembic 마이그레이션부터 프론트엔드 상태 리프팅까지 완전 연결"
key_files:
  created:
    - apps/api/alembic/versions/0007_novel_tagline_tags.py
  modified:
    - apps/api/src/domains/novel/models/novel_models.py
    - apps/api/src/domains/novel/schemas/novel_schemas.py
    - apps/api/src/domains/novel/router/novel_router.py
    - apps/api/src/domains/novel/service/novel_service.py
    - apps/web/src/features/novel/types/novel.ts
    - apps/web/src/features/novel/components/novel-settings-page.tsx
requirements_addressed:
  - NOVEL-01
  - NOVEL-02
  - NOVEL-03
  - NOVEL-04
  - NOVEL-05
  - NOVEL-06
---

## 구현 완료 요약

Novel 모델에 `tagline`(VARCHAR 255 NULL)과 `tags`(JSONB NOT NULL DEFAULT '[]')를 추가하고, 작품 설정 페이지 저장까지 완전히 연결했다.

### 백엔드

- `0007_novel_tagline_tags.py` — `op.add_column` 2회로 두 컬럼 추가. `server_default=sa.text("'[]'::jsonb")` 패턴 적용
- `novel_models.py` — `tagline: Mapped[str | None]`, `tags: Mapped[list[str]]` ORM 컬럼 추가
- `novel_schemas.py` — `NovelCreate/Update/Response` 세 스키마에 tagline/tags 필드 추가
- `novel_router.py` — `NovelResponse` 직접 생성 3곳 모두에 `tagline=novel.tagline, tags=novel.tags` 추가
- `novel_service.py` — `list_novels` NovelResponse에 동일 필드 추가

### 프론트엔드

- `novel.ts` — `Novel.tagline: string | null`, `Novel.tags: string[]`, `NovelUpdateInput.tagline?`, `NovelUpdateInput.tags?` 추가
- `novel-settings-page.tsx` — `SectionBasic` 내부 `useState` 제거 → `draft` 상태로 리프팅. `handleSave`에 tagline/tags 포함

### 검증

- `pnpm typecheck` — 에러 0개
- `pnpm build` — 성공
- `uv run mypy src/domains/novel/` — 에러 0개
- Code review (sg-review) — Critical 이슈 해결 완료
