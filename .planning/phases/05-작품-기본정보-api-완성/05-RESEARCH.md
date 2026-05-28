# Phase 5: 작품 기본정보 API 완성 - Research

**Researched:** 2026-05-28
**Domain:** FastAPI ORM 컬럼 추가 + Alembic 마이그레이션 + React 상태 리프팅
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `Novel` 모델에 `tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)` 추가.
- **D-02:** `Novel` 모델에 `tags: Mapped[list[str]] = mapped_column(JSONB, server_default="'[]'", nullable=False)` 추가. `server_default` 로 빈 배열 보장 — NULL 없음.
- **D-03:** Alembic 마이그레이션 파일명: `0007_novel_tagline_tags.py`. `op.add_column` 두 번 호출.
- **D-04:** `NovelCreate`에 `tagline: str | None = None`, `tags: list[str] = []` 추가.
- **D-05:** `NovelUpdate`에 `tagline: str | None = None`, `tags: list[str] | None = None` 추가.
- **D-06:** `NovelResponse`에 `tagline: str | None`, `tags: list[str] = []` 추가.
- **D-07:** `draft` 상태를 `{ title, genre, description, tagline, tags }` 로 확장. 단일 저장 버튼으로 6개 필드 모두 처리.
- **D-08:** `SectionBasic` props에 `tagline: string`, `tags: string[]` 추가. `onChange`는 기존 패턴 유지 — `{ tagline?: string; tags?: string[] }` 포함하도록 확장.
- **D-09:** `handleSave`는 `{ title, genre, description, tagline, tags }` 를 `updateMutation.mutate`에 전달.
- **D-10:** 백엔드 스키마 변경 후 `cd apps/web && pnpm generate:api` 실행. 백엔드 서버가 실행 중이어야 함.
- **D-11:** 단일 plan으로 백엔드(마이그레이션 + 스키마) → SDK 재생성 → 프론트엔드 연결을 순서대로 처리.

### Claude's Discretion

- `tags` 최대 개수 제한 (현재 프론트 `v.slice(0, 10)` 유지).
- `tagline` 최대 80자 제한 (현재 프론트 `maxLength={80}` 유지).

### Deferred Ideas (OUT OF SCOPE)

- 태그 자동완성, 태그 통계, tagline AI 자동완성
- 커버 이미지 업로드 실제 연결
- 연재 정보(상태, 목표 회차 등) API 연결
- AI 어시스턴트 설정 API 연결
- 집필 환경 설정 API 연결
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOVEL-01 | `tagline` (String(200), nullable) 필드가 Novel 모델과 DB에 추가된다 | D-01: `String(255)` 사용 — CONTEXT.md 결정 따름. 마이그레이션 `op.add_column` 패턴 확인 |
| NOVEL-02 | `tags` (JSONB 배열, nullable, default=[]) 필드가 Novel 모델과 DB에 추가된다 | D-02: JSONB + `server_default="'[]'"` 패턴. PostgreSQL JSONB 타입 코드베이스에서 이미 사용 중 (`Chapter.content`) |
| NOVEL-03 | `NovelUpdate` 스키마가 `tagline`, `tags`를 optional 필드로 받는다 | D-05: `tagline: str \| None = None`, `tags: list[str] \| None = None`. `model_dump(exclude_unset=True)` 패턴으로 미전송 시 DB 덮어쓰기 없음 |
| NOVEL-04 | `NovelResponse` 스키마가 `tagline`, `tags`를 반환한다 | D-06 + 라우터에서 `NovelResponse(...)` 직접 생성 패턴 — 새 필드를 명시적으로 전달해야 함 |
| NOVEL-05 | 페이지 로드 시 `tagline`과 `tags`가 API 응답 데이터로 초기화된다 | `draft` 초기값이 `novel` prop에서 읽어야 함 — 현재 `tagline`/`tags` 없음. `Novel` 타입 확장 필요 |
| NOVEL-06 | "변경사항 저장" 클릭 시 `tagline`과 `tags`가 API에 전송되어 저장된다 | `handleSave` → `updateMutation.mutate` → `apiUpdateNovel` → SDK `NovelUpdate` 타입 연결 |
</phase_requirements>

---

## Summary

Phase 5는 신규 패키지 설치나 아키텍처 변경이 없는 **데이터 통로 완성** 작업이다. 백엔드에서 DB 컬럼 2개를 추가하고 Pydantic 스키마를 확장한 뒤, SDK를 재생성하고 프론트엔드 상태를 리프팅하면 완료된다.

코드베이스 직접 분석 결과, 추가 패턴은 완전히 기존 코드와 일치한다. JSONB는 이미 `Chapter.content`에 사용 중이고, `op.add_column` 마이그레이션은 `0006_story_beats.py`에서 확인 가능하다. 프론트엔드 `SectionBasic`의 `tagline`/`tags`는 현재 컴포넌트 내부 `useState`로 고립되어 있고, `draft`와 `handleSave`에 연결되지 않은 상태다.

**핵심 함정:** `novel_router.py`에서 `create_novel`, `get_novel`, `update_novel` 세 엔드포인트가 `NovelResponse(id=novel.id, ...)` 형식으로 **명시적 키워드 인수로 직접 생성**한다. `from_attributes` 자동 변환에 의존하지 않으므로, 스키마에 `tagline`/`tags`를 추가해도 라우터 3곳을 함께 수정하지 않으면 응답에 포함되지 않는다.

**Primary recommendation:** 백엔드 4파일(model, schema, router, migration) → SDK 재생성 → 프론트엔드 3파일(types/novel.ts, novel-settings-page.tsx) 순서로 처리하라.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| tagline/tags DB 저장 | Database / Storage | — | PostgreSQL JSONB 컬럼, Alembic으로 스키마 관리 |
| API 직렬화 | API / Backend | — | NovelResponse Pydantic 스키마 |
| SDK 타입 생성 | Build / Dev Tools | — | HeyAPI openapi-ts가 FastAPI OpenAPI 스펙에서 자동 생성 |
| 클라이언트 상태 관리 | Frontend (Client) | — | React useState `draft` 객체 |
| API 호출 | Frontend (Client) | — | React Query useMutation + novel-api.ts 래퍼 |

---

## Standard Stack

이 Phase는 신규 패키지 설치 없음. 기존 스택만 사용.

### 사용 기술 (기존)
| 기술 | 현재 버전 | 용도 |
|------|-----------|------|
| SQLAlchemy `JSONB` | 2.0.36 | `tags` 컬럼 타입 — `Chapter.content`에서 이미 사용 중 [VERIFIED: codebase] |
| Alembic `op.add_column` | 1.14.0 | `tagline`/`tags` 컬럼 추가 마이그레이션 [VERIFIED: codebase] |
| Pydantic v2 | 2.9.0 | `NovelCreate`/`Update`/`Response` 스키마 확장 [VERIFIED: codebase] |
| HeyAPI openapi-ts | — | `pnpm generate:api` — `openapi.json` → `src/generated/` 재생성 [VERIFIED: codebase] |
| React `useState` | 19 | `draft` 상태 확장 및 `SectionBasic` props 리프팅 [VERIFIED: codebase] |

### Package Legitimacy Audit

> 신규 패키지 설치 없음 — 이 섹션 해당 없음.

---

## Architecture Patterns

### 데이터 흐름

```
PostgreSQL (novels 테이블)
  tagline VARCHAR(255) NULL
  tags    JSONB NOT NULL DEFAULT '[]'
        ↓ SQLAlchemy ORM (Novel 모델)
        ↓ NovelRepository.update(**fields)
        ↓ NovelService.update_novel(data)
        ↓ NovelResponse(tagline=..., tags=...)  ← 라우터에서 명시적 생성
        ↓ FastAPI OpenAPI 스펙 (openapi.json)
        ↓ pnpm generate:api
        ↓ src/generated/types.gen.ts (NovelUpdate, NovelResponse)
        ↓ novel-api.ts (apiUpdateNovel)
        ↓ useUpdateNovelMutation
        ↓ handleSave({ tagline, tags, ... })
        ↓ draft 상태 (useState) ← novel prop으로 초기화
```

### 패턴 1: Alembic `op.add_column` (기존 테이블에 컬럼 추가)

`0006_story_beats.py` 기반 마이그레이션 헤더 패턴:

```python
# Source: apps/api/alembic/versions/0006_story_beats.py [VERIFIED: codebase]
revision = "0007_novel_tagline_tags"
down_revision = "0006_story_beats"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("novels", sa.Column("tagline", sa.String(255), nullable=True))
    op.add_column(
        "novels",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )

def downgrade() -> None:
    op.drop_column("novels", "tags")
    op.drop_column("novels", "tagline")
```

`server_default`에 `sa.text("'[]'::jsonb")` 형식 사용 — PostgreSQL JSONB 리터럴 캐스트 필수.

### 패턴 2: NovelResponse 라우터 직접 생성 (핵심 함정)

```python
# Source: apps/api/src/domains/novel/router/novel_router.py [VERIFIED: codebase]
# create_novel, get_novel, update_novel 세 곳 모두 동일 패턴
return NovelResponse(
    id=novel.id,
    user_id=novel.user_id,
    title=novel.title,
    genre=novel.genre,
    description=novel.description,
    cover_image_url=novel.cover_image_url,
    created_at=novel.created_at,
    updated_at=novel.updated_at,
    chapter_count=0,
    # ← tagline=novel.tagline, tags=novel.tags 추가 필요
)
```

`list_novels`는 `NovelService.list_novels`에서 이미 `NovelResponse(...)`를 구성하므로 `novel_service.py`도 수정 대상이다.

### 패턴 3: 프론트엔드 상태 리프팅

```typescript
// 현재 (novel-settings-page.tsx:569) [VERIFIED: codebase]
const [draft, setDraft] = useState({ title: novel.title, genre: novel.genre ?? 'fantasy', description: novel.description ?? '' });

// 변경 후 (D-07)
const [draft, setDraft] = useState({
  title: novel.title,
  genre: novel.genre ?? 'fantasy',
  description: novel.description ?? '',
  tagline: novel.tagline ?? '',
  tags: novel.tags ?? [],
});
```

`SectionBasic` props 변경:

```typescript
// 현재 (novel-settings-page.tsx:200) [VERIFIED: codebase]
function SectionBasic({ title, genre, description, onChange }: {
  title: string; genre: string; description: string;
  onChange: (patch: { title?: string; genre?: string; description?: string }) => void;
})

// 변경 후 (D-08)
function SectionBasic({ title, genre, description, tagline, tags, onChange }: {
  title: string; genre: string; description: string;
  tagline: string; tags: string[];
  onChange: (patch: { title?: string; genre?: string; description?: string; tagline?: string; tags?: string[] }) => void;
})
```

### Anti-Patterns to Avoid

- **`from_attributes` 의존 금지:** 이 프로젝트의 Novel 라우터는 `NovelResponse.from_orm(novel)` 패턴을 사용하지 않는다. 스키마만 수정하면 응답에 필드가 자동 추가될 것이라고 착각하지 마라 — 라우터 코드를 반드시 함께 수정해야 한다.
- **`tags=None` 전송 금지:** `NovelUpdate.tags = list[str] | None = None` 이고 `model_dump(exclude_unset=True)`를 사용하므로, tags를 전송하지 않으면 기존 값이 유지된다. 프론트엔드에서 빈 배열 `[]`과 `None`(미전송)을 구분할 것.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript API 타입 동기화 | 백엔드 스키마와 수동으로 맞추기 | `pnpm generate:api` | HeyAPI가 OpenAPI 스펙에서 완전 자동 생성 — 수동 동기화는 drift 유발 |
| JSONB 배열 직렬화 | 커스텀 직렬화/역직렬화 | SQLAlchemy `JSONB` | PostgreSQL JSONB가 Python list↔JSON 변환 자동 처리 |

---

## Common Pitfalls

### Pitfall 1: 라우터 `NovelResponse` 직접 생성 누락
**What goes wrong:** `novel_schemas.py`에 `tagline`/`tags`를 추가했지만 라우터의 `create_novel`, `get_novel`, `update_novel`, `list_novels`(service) 4곳을 업데이트하지 않으면 API 응답에서 필드가 null/누락된다.
**Why it happens:** 이 프로젝트는 `from_attributes`의 자동 변환 대신 명시적 `NovelResponse(field=value)` 패턴을 사용한다.
**How to avoid:** `novel_router.py`의 `NovelResponse(...)` 호출 4곳과 `novel_service.py`의 `list_novels`에서 `NovelResponse(...)` 호출을 모두 찾아서 함께 수정한다.
**Warning signs:** API 응답에 `tagline`/`tags` 키가 없거나 `null`로 고정됨.

### Pitfall 2: `server_default` JSONB 캐스트 누락
**What goes wrong:** `server_default="'[]'"` (문자열)로 작성하면 PostgreSQL이 JSONB 타입과 text 타입 불일치로 오류를 낸다.
**Why it happens:** JSONB 컬럼의 `server_default`는 PostgreSQL이 실행할 SQL 표현식이어야 한다.
**How to avoid:** `sa.text("'[]'::jsonb")` 또는 `sa.text("'[]'")` 사용. Alembic `op.add_column`에서는 `server_default=sa.text("'[]'::jsonb")`.
**Warning signs:** `alembic upgrade head` 실행 시 `ProgrammingError: column "tags" is of type jsonb but default expression is of type text`.

### Pitfall 3: frontend `Novel` 타입에 신규 필드 누락
**What goes wrong:** SDK 재생성 후 `src/generated/types.gen.ts`의 `NovelResponse`에는 `tagline`/`tags`가 추가되지만, `apps/web/src/features/novel/types/novel.ts`의 수동 `Novel` 인터페이스는 그대로다. `novel-api.ts`의 `data as Novel` 캐스팅이 타입 정보를 잃는다.
**Why it happens:** 프로젝트가 generated 타입과 수동 타입을 병행 사용한다. `novel-api.ts`는 `data as Novel`로 캐스팅한다.
**How to avoid:** `apps/web/src/features/novel/types/novel.ts`의 `Novel`, `NovelUpdateInput` 인터페이스에도 `tagline`/`tags` 추가. `NovelSettingsPage`가 `novel: Novel` prop을 받으므로 이 타입이 확장되어야 `draft` 초기값이 타입 안전하다.
**Warning signs:** TypeScript 컴파일 오류 `Property 'tagline' does not exist on type 'Novel'`.

### Pitfall 4: `SectionBasic` 내부 `useState` 정리 누락
**What goes wrong:** `SectionBasic` 컴포넌트의 `tags`/`tagline` `useState`를 제거하지 않으면, props로 받은 값과 내부 상태가 충돌하여 초기 렌더 후 입력값이 덮어써진다.
**Why it happens:** 상태 리프팅 시 내부 상태를 제거하는 작업을 빠뜨리기 쉽다.
**How to avoid:** `SectionBasic`에서 `const [tags, setTags] = useState(...)`, `const [tagline, setTagline] = useState(...)` 두 줄을 제거하고, `WsInput`/`WsTags`의 `onChange`를 `props.onChange` 호출로 교체한다.

### Pitfall 5: SDK 재생성 전 프론트엔드 코드 수정
**What goes wrong:** SDK 재생성 전에 `NovelUpdateInput`이나 `Novel` 타입을 수동으로 수정하면, 재생성 후 `src/generated/types.gen.ts`와 불일치가 생긴다.
**Why it happens:** 작업 순서 착오.
**How to avoid:** 반드시 백엔드 변경 → 서버 재시작 → `pnpm generate:api` → 프론트엔드 타입/코드 수정 순서를 지킨다.

---

## Code Examples

### Alembic 마이그레이션 — JSONB 컬럼 추가

```python
# Source: apps/api/alembic/versions/0006_story_beats.py 패턴 기반 [VERIFIED: codebase]
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    op.add_column("novels", sa.Column("tagline", sa.String(255), nullable=True))
    op.add_column(
        "novels",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
```

### SQLAlchemy ORM 모델 — JSONB 컬럼

```python
# Source: apps/api/src/domains/novel/models/novel_models.py (Chapter.content 패턴) [VERIFIED: codebase]
from sqlalchemy.dialects.postgresql import JSONB

# Novel 클래스 내부
tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
tags: Mapped[list[str]] = mapped_column(JSONB, server_default="'[]'", nullable=False)
```

### NovelUpdate 스키마 — `exclude_unset=True` 패턴

```python
# Source: apps/api/src/domains/novel/service/novel_service.py [VERIFIED: codebase]
async def update_novel(self, novel_id, user_id, data: NovelUpdate) -> Novel:
    novel = await self.get_novel(novel_id, user_id)
    return await self.repo.update(novel, **data.model_dump(exclude_unset=True))
    # exclude_unset=True: 클라이언트가 보내지 않은 필드는 DB에서 유지됨
```

### 프론트엔드 `handleSave` 수정 (D-09)

```typescript
// Source: apps/web/src/features/novel/components/novel-settings-page.tsx:577 [VERIFIED: codebase]
const handleSave = () => {
  updateMutation.mutate(
    {
      id: novel.id,
      data: {
        title: draft.title,
        genre: draft.genre,
        description: draft.description,
        tagline: draft.tagline,
        tags: draft.tags,
      },
    },
    { onSuccess: () => setSaved(true) }
  );
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `NovelResponse.from_orm(novel)` | `NovelResponse(field=value, ...)` 직접 생성 | 새 필드 추가 시 라우터 코드도 함께 수정 필요 |
| `list_str` vs JSONB | JSONB (`list[str]` Python 타입) | PostgreSQL JSONB — 쿼리/인덱싱 가능, Python list 직접 매핑 |

---

## Runtime State Inventory

> 이 Phase는 DB 컬럼 추가(마이그레이션)를 포함하므로 런타임 상태 점검 대상.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `novels` 테이블 기존 레코드 — `tagline` NULL, `tags` `'[]'` (server_default) | 마이그레이션 실행 시 자동 적용. 기존 레코드 데이터 마이그레이션 불필요 |
| Live service config | FastAPI 서버 실행 중이어야 `pnpm generate:api` 가능 | SDK 재생성 전 서버 실행 확인 |
| OS-registered state | 없음 — 확인 완료 | 없음 |
| Secrets/env vars | 없음 — 신규 env var 불필요 | 없음 |
| Build artifacts | `src/generated/` — 마이그레이션/스키마 변경 후 재생성 필요 | `pnpm generate:api` 실행 |

---

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| PostgreSQL (Docker) | Alembic 마이그레이션 실행 | `docker compose up -d` 필요 | 없음 — 필수 |
| FastAPI 서버 (`uv run uvicorn`) | `pnpm generate:api` (openapi.json 갱신) | 수동 실행 필요 | 없음 — SDK 재생성 블로킹 |
| `pnpm` | 프론트엔드 빌드/타입체크 | ✓ (monorepo 환경) | — |
| `uv` | 백엔드 실행/마이그레이션 | ✓ (pyproject.toml) | — |

**Missing dependencies with no fallback:**
- PostgreSQL: `cd apps/api && docker compose up -d` 먼저 실행
- FastAPI 서버: `cd apps/api && uv run uvicorn src.main:app --reload` 실행 후 SDK 재생성

---

## Open Questions

1. **`list_novels`의 `chapter_count` 처리**
   - What we know: `novel_service.py`의 `list_novels`는 `NovelResponse(..., chapter_count=count)` 로 직접 생성한다. `tagline`/`tags` 추가가 필요하다.
   - What's unclear: 이미 확인 완료 — `novel_service.py:33-45`에서 `NovelResponse(...)`를 구성하므로 여기도 수정 대상.
   - Recommendation: service의 `list_novels`와 router의 `create_novel`/`get_novel`/`update_novel` 총 4곳 모두 수정.

2. **`tags` Pydantic 타입: `list[str]`의 SQLAlchemy JSONB 역직렬화**
   - What we know: SQLAlchemy JSONB는 Python `list`로 자동 역직렬화된다. `Mapped[list[str]]` 타입 힌트는 런타임에 강제되지 않는다.
   - What's unclear: mypy strict 모드에서 `Mapped[list[str]]`이 JSONB와 함께 타입 에러를 낼 수 있는지.
   - Recommendation: `Mapped[list[str]]` 사용. 타입 에러 발생 시 `Mapped[list]`로 fallback하거나 `type: ignore` 주석 추가.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `server_default="'[]'"` 문자열이 SQLAlchemy ORM 모델 정의에서 유효하게 동작함 | Standard Stack | 마이그레이션에서는 `sa.text("'[]'::jsonb")` 필요 — ORM 모델 정의의 `server_default`와 Alembic의 `server_default` 구문이 다를 수 있음 |

> A1 주의: ORM 모델의 `server_default="'[]'"` 는 Python에서 Python 기본값이 아니라 DB 서버에 전달되는 SQL 표현식이다. PostgreSQL에서 `'[]'`는 text 리터럴이므로 JSONB 컬럼에 타입 불일치가 생길 수 있다. 안전한 방법은 ORM 모델에도 `mapped_column(JSONB, server_default=sa.text("'[]'::jsonb"), nullable=False)` 형식 사용. [ASSUMED]

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/domains/novel/models/novel_models.py` — 현재 Novel ORM 모델, JSONB 미사용 확인 [VERIFIED: codebase]
- `apps/api/src/domains/novel/schemas/novel_schemas.py` — 현재 스키마, tagline/tags 없음 확인 [VERIFIED: codebase]
- `apps/api/src/domains/novel/router/novel_router.py` — NovelResponse 직접 생성 패턴 4곳 확인 [VERIFIED: codebase]
- `apps/api/src/domains/novel/service/novel_service.py` — `model_dump(exclude_unset=True)` 패턴 확인 [VERIFIED: codebase]
- `apps/api/alembic/versions/0006_story_beats.py` — 마이그레이션 패턴 확인 [VERIFIED: codebase]
- `apps/web/src/features/novel/components/novel-settings-page.tsx` — SectionBasic 내부 상태 고립 확인 [VERIFIED: codebase]
- `apps/web/src/features/novel/types/novel.ts` — Novel 인터페이스 확인 [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- `.planning/phases/05-작품-기본정보-api-완성/05-CONTEXT.md` — 사용자 결정 사항 [VERIFIED: context file]

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 신규 패키지 없음, 기존 코드 패턴만 사용
- Architecture: HIGH — 코드베이스 직접 분석으로 확인
- Pitfalls: HIGH — 라우터 직접 생성 패턴은 코드베이스에서 직접 확인된 실제 함정

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stable stack)
