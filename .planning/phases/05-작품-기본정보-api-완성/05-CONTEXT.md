# Phase 5: 작품 기본정보 API 완성 - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Novel 모델에 `tagline`/`tags` 필드를 추가하고, 작품 설정 페이지의 저장 버튼까지 완전히 연결한다.

**백엔드:**
- `Novel` ORM 모델에 `tagline: str | None`, `tags: list[str]` 컬럼 추가
- Alembic 마이그레이션 (`0007_novel_tagline_tags.py`) 생성
- `NovelCreate`, `NovelUpdate`, `NovelResponse` Pydantic 스키마에 두 필드 추가
- `NovelService.update()` 및 `NovelRepository.update()` 연동 확인

**프론트엔드:**
- `SectionBasic` 컴포넌트의 `tagline`/`tags` 로컬 상태를 부모 `draft`로 끌어올리기
- `draft` 상태 타입을 `{ title, genre, description, tagline, tags }` 로 확장
- `handleSave`가 6개 필드 모두 `updateMutation`에 전달하도록 수정
- HeyAPI SDK 재생성 (`pnpm generate:api`) 후 `NovelUpdate` 타입 활용

**범위 밖:** 태그 자동완성, 태그 통계, tagline AI 자동완성.

**구현 상태 (코드 확인 결과):**
- `Novel` ORM (`novel_models.py`): `tagline`/`tags` 필드 없음 — 추가 필요
- `NovelCreate`/`NovelUpdate`/`NovelResponse` (`novel_schemas.py`): 두 필드 없음 — 추가 필요
- `novel-settings-page.tsx:204-205`: `tags`/`tagline`이 `SectionBasic` 내부 `useState`로 고립, `handleSave`(:578)와 단절
- `draft` 상태(:569): `{ title, genre, description }` 만 포함 — 확장 필요
- `SectionBasic` props(:200-201): `{ title, genre, description, onChange }` 만 수신 — tagline/tags props 추가 필요
- 최신 마이그레이션: `0006_story_beats.py` — 다음 번호는 `0007`

</domain>

<decisions>
## Implementation Decisions

### 데이터베이스
- **D-01:** `Novel` 모델에 `tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)` 추가.
- **D-02:** `Novel` 모델에 `tags: Mapped[list[str]] = mapped_column(JSONB, server_default=sa.text("'[]'::jsonb"), nullable=False)` 추가. `server_default` 로 빈 배열 보장 — NULL 없음. `sa.text("'[]'::jsonb")` 형식 필수 — 문자열 단독 사용 시 PostgreSQL JSONB 타입 불일치 오류 발생.
- **D-03:** Alembic 마이그레이션 파일명: `0007_novel_tagline_tags.py`. `op.add_column` 두 번 호출.

### 스키마
- **D-04:** `NovelCreate`에 `tagline: str | None = None`, `tags: list[str] = []` 추가.
- **D-05:** `NovelUpdate`에 `tagline: str | None = None`, `tags: list[str] | None = None` 추가.
- **D-06:** `NovelResponse`에 `tagline: str | None`, `tags: list[str] = []` 추가.

### 프론트엔드 상태 통합
- **D-07:** `draft` 상태를 `{ title, genre, description, tagline, tags }` 로 확장. 단일 저장 버튼으로 6개 필드 모두 처리.
- **D-08:** `SectionBasic` props에 `tagline: string`, `tags: string[]` 추가. `onChange`는 기존 패턴 유지 — `{ tagline?: string; tags?: string[] }` 포함하도록 확장.
- **D-09:** `handleSave`는 `{ title, genre, description, tagline, tags }` 를 `updateMutation.mutate`에 전달.

### SDK 재생성
- **D-10:** 백엔드 스키마 변경 후 `cd apps/web && pnpm generate:api` 실행. 백엔드 서버가 실행 중이어야 함.

### Claude's Discretion
- `tags` 최대 개수 제한 (현재 프론트 `v.slice(0, 10)` 유지).
- `tagline` 최대 80자 제한 (현재 프론트 `maxLength={80}` 유지).
- **D-11:** 단일 plan으로 백엔드(마이그레이션 + 스키마) → SDK 재생성 → 프론트엔드 연결을 순서대로 처리 (plan 구조 결정, 구현 추적 불필요).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항
- `.planning/ROADMAP.md` Phase 5 Success Criteria

### 핵심 파일 (읽어야 함)
| 파일 | 이유 |
|------|------|
| `apps/api/src/domains/novel/models/novel_models.py` | Novel ORM — tagline/tags 추가 위치 |
| `apps/api/src/domains/novel/schemas/novel_schemas.py` | NovelCreate/Update/Response 스키마 |
| `apps/api/src/domains/novel/service/novel_service.py` | update() 메서드 확인 |
| `apps/api/src/domains/novel/repository/novel_repository.py` | update() 레포지토리 확인 |
| `apps/api/alembic/versions/0006_story_beats.py` | 마이그레이션 패턴 참조 |
| `apps/web/src/features/novel/components/novel-settings-page.tsx` | SectionBasic + draft + handleSave |
| `apps/web/src/generated/types.gen.ts` | 재생성 전 NovelResponse/NovelUpdate 타입 확인 |

### 패턴 참조
- Phase 4 CONTEXT.md D-19: LLM 격리 패턴 유지 (이 Phase는 LLM 미사용이나 격리 원칙 참조)
- `apps/api/CLAUDE.md`: 도메인 구조 및 스키마 패턴

</canonical_refs>
