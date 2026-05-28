# Phase 5: 작품 기본정보 API 완성 - 패턴 맵

**작성일:** 2026-05-28
**분석 대상 파일:** 7개 (수정)
**아날로그 발견:** 7 / 7

---

## 파일 분류

| 수정 대상 파일 | 역할 | 데이터 흐름 | 가장 가까운 아날로그 | 매칭 품질 |
|---|---|---|---|---|
| `apps/api/alembic/versions/0007_novel_tagline_tags.py` | migration | transform | `apps/api/alembic/versions/0006_story_beats.py` | role-match |
| `apps/api/src/domains/novel/models/novel_models.py` | model | CRUD | `apps/api/src/domains/novel/models/novel_models.py` (Chapter.content JSONB) | exact |
| `apps/api/src/domains/novel/schemas/novel_schemas.py` | model | request-response | 동일 파일 내 ChapterUpdate 패턴 | exact |
| `apps/api/src/domains/novel/router/novel_router.py` | controller | request-response | 동일 파일 내 기존 NovelResponse 직접 생성 패턴 | exact |
| `apps/api/src/domains/novel/service/novel_service.py` | service | CRUD | 동일 파일 내 list_novels NovelResponse 생성 패턴 | exact |
| `apps/web/src/features/novel/types/novel.ts` | utility | request-response | 동일 파일 내 Chapter/NovelUpdateInput 패턴 | exact |
| `apps/web/src/features/novel/components/novel-settings-page.tsx` | component | request-response | 동일 파일 내 draft/handleSave/SectionBasic 패턴 | exact |

---

## 패턴 할당

### `apps/api/alembic/versions/0007_novel_tagline_tags.py` (migration, transform)

**아날로그:** `apps/api/alembic/versions/0003_novel_domain.py` (헤더 패턴) + `0006_story_beats.py` (JSONB/SA 패턴)

**임포트 패턴** (0003_novel_domain.py 1-12행 기반):
```python
"""Add tagline and tags columns to novels table.

Revision ID: 0007_novel_tagline_tags
Revises: 0006_story_beats
Create Date: 2026-05-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
```

**리비전 헤더 패턴** (0006_story_beats.py 14-17행):
```python
revision = "0007_novel_tagline_tags"
down_revision = "0006_story_beats"
branch_labels = None
depends_on = None
```

**핵심 패턴 — op.add_column + JSONB server_default** (RESEARCH.md 패턴 1 기반, 0003_novel_domain.py JSONB 컬럼 패턴 사용):
```python
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

**주의:** `server_default=sa.text("'[]'::jsonb")` — `sa.text()` 래핑 필수. 문자열 `"'[]'"` 단독 사용 시 JSONB 타입 불일치 오류 발생.

---

### `apps/api/src/domains/novel/models/novel_models.py` (model, CRUD)

**아날로그:** 동일 파일 내 `Chapter.content` JSONB 컬럼 (51행) 및 `Novel.genre` nullable String 컬럼 (28행)

**기존 임포트 패턴** (novel_models.py 9-11행 — 이미 JSONB import 존재):
```python
from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
```

**핵심 패턴 — Novel 클래스에 추가할 컬럼** (novel_models.py 28-30행 참조):
```python
# 기존 패턴 (genre, 28행)
genre: Mapped[str | None] = mapped_column(String(100), nullable=True)

# 추가할 패턴 (description 아래, cover_image_url 위)
tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
tags: Mapped[list[str]] = mapped_column(JSONB, server_default=sa.text("'[]'::jsonb"), nullable=False)
```

**JSONB 컬럼 기존 사용 예** (Chapter.content, 51행):
```python
content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # D-28: TipTap getJSON()
```

**주의:** ORM 모델의 `server_default`도 `sa.text("'[]'::jsonb")` 형식 사용. `server_default="'[]'"` 문자열은 PostgreSQL JSONB 타입 불일치 위험.

---

### `apps/api/src/domains/novel/schemas/novel_schemas.py` (model, request-response)

**아날로그:** 동일 파일 내 `ChapterUpdate` optional 필드 패턴 (51-54행) 및 `NovelCreate` 패턴 (13-17행)

**기존 스키마 패턴** (novel_schemas.py 13-38행):
```python
class NovelCreate(BaseModel):
    title: str
    genre: str | None = None
    description: str | None = None
    cover_image_url: str | None = None


class NovelUpdate(BaseModel):
    title: str | None = None
    genre: str | None = None
    description: str | None = None
    cover_image_url: str | None = None


class NovelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    genre: str | None
    description: str | None
    cover_image_url: str | None
    created_at: datetime
    updated_at: datetime
    chapter_count: int = 0
```

**핵심 패턴 — 필드 추가 위치** (D-04/05/06 결정 기반):
```python
# NovelCreate에 추가 (cover_image_url 아래)
tagline: str | None = None
tags: list[str] = []

# NovelUpdate에 추가 (cover_image_url 아래)
tagline: str | None = None
tags: list[str] | None = None

# NovelResponse에 추가 (cover_image_url 아래)
tagline: str | None = None
tags: list[str] = []
```

---

### `apps/api/src/domains/novel/router/novel_router.py` (controller, request-response)

**아날로그:** 동일 파일 내 `create_novel`, `get_novel`, `update_novel` 엔드포인트 (94-166행)

**핵심 패턴 — NovelResponse 직접 생성 (4곳 모두 동일 패턴)**:

`create_novel` (94-104행):
```python
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
)
```

**수정 패턴 — tagline/tags 추가** (위 4곳 모두 동일하게 적용):
```python
return NovelResponse(
    id=novel.id,
    user_id=novel.user_id,
    title=novel.title,
    genre=novel.genre,
    description=novel.description,
    cover_image_url=novel.cover_image_url,
    tagline=novel.tagline,      # 추가
    tags=novel.tags,            # 추가
    created_at=novel.created_at,
    updated_at=novel.updated_at,
    chapter_count=0,
)
```

**에러 처리 패턴** (77-78행, 105-106행):
```python
def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)

# 각 엔드포인트:
except AppError as e:
    raise _app_error_to_http(e) from e
```

**수정 대상 위치:**
- `create_novel` — router.py 94-104행
- `get_novel` — router.py 131-141행
- `update_novel` — router.py 155-165행
- `list_novels`의 NovelResponse — service.py의 `list_novels` (별도 파일)

---

### `apps/api/src/domains/novel/service/novel_service.py` (service, CRUD)

**아날로그:** 동일 파일 내 `list_novels` 메서드 (28-46행)

**핵심 패턴 — list_novels의 NovelResponse 생성** (28-45행):
```python
async def list_novels(
    self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
) -> tuple[list[NovelResponse], int]:
    rows, total = await self.repo.list_by_user(user_id, offset, limit)
    items = [
        NovelResponse(
            id=novel.id,
            user_id=novel.user_id,
            title=novel.title,
            genre=novel.genre,
            description=novel.description,
            cover_image_url=novel.cover_image_url,
            created_at=novel.created_at,
            updated_at=novel.updated_at,
            chapter_count=count,
        )
        for novel, count in rows
    ]
    return items, total
```

**update_novel 패턴 — exclude_unset=True** (48-52행):
```python
async def update_novel(
    self, novel_id: uuid.UUID, user_id: uuid.UUID, data: NovelUpdate
) -> Novel:
    novel = await self.get_novel(novel_id, user_id)
    return await self.repo.update(novel, **data.model_dump(exclude_unset=True))
```

**수정 패턴** — `list_novels`의 NovelResponse에 tagline/tags 추가:
```python
NovelResponse(
    id=novel.id,
    ...
    cover_image_url=novel.cover_image_url,
    tagline=novel.tagline,   # 추가
    tags=novel.tags,         # 추가
    created_at=novel.created_at,
    updated_at=novel.updated_at,
    chapter_count=count,
)
```

**주의:** `update_novel`의 `repo.update(**data.model_dump(exclude_unset=True))` 패턴은 변경 불필요 — `NovelUpdate`에 필드 추가 시 자동으로 처리됨.

---

### `apps/web/src/features/novel/types/novel.ts` (utility, request-response)

**아날로그:** 동일 파일 내 `Chapter` 인터페이스 (15-24행) 및 `NovelUpdateInput` (33-38행)

**기존 Novel 인터페이스 패턴** (1-11행):
```typescript
export interface Novel {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  chapter_count: number;
}
```

**기존 NovelUpdateInput 패턴** (33-38행):
```typescript
export interface NovelUpdateInput {
  title?: string;
  genre?: string;
  description?: string;
  cover_image_url?: string;
}
```

**수정 패턴** — tagline/tags 추가:
```typescript
// Novel 인터페이스에 추가 (cover_image_url 아래)
tagline: string | null;
tags: string[];

// NovelUpdateInput에 추가 (cover_image_url 아래)
tagline?: string;
tags?: string[];
```

---

### `apps/web/src/features/novel/components/novel-settings-page.tsx` (component, request-response)

**아날로그:** 동일 파일 내 기존 `SectionBasic`, `draft`, `handleSave` 패턴

**기존 SectionBasic props 패턴** (200-202행):
```typescript
function SectionBasic({ title, genre, description, onChange }: {
  title: string; genre: string; description: string;
  onChange: (patch: { title?: string; genre?: string; description?: string }) => void;
})
```

**기존 내부 상태 (제거 대상)** (204-205행):
```typescript
const [tags, setTags] = useState(['판타지', '성장', '모험', '1인칭', '여성주인공']);
const [tagline, setTagline] = useState('잠들지 못한 채 펼쳐지는, 천 일의 꿈을 좇는 이야기.');
```

**기존 draft 상태** (569행):
```typescript
const [draft, setDraft] = useState({ title: novel.title, genre: novel.genre ?? 'fantasy', description: novel.description ?? '' });
```

**기존 handleSave 패턴** (577-581행):
```typescript
const handleSave = () => {
  updateMutation.mutate({ id: novel.id, data: { title: draft.title, genre: draft.genre, description: draft.description } }, {
    onSuccess: () => setSaved(true),
  });
};
```

**기존 SectionBasic 호출** (673행):
```typescript
<SectionBasic title={draft.title} genre={draft.genre} description={draft.description} onChange={handleChange} />
```

**수정 패턴:**

1. SectionBasic props 확장:
```typescript
function SectionBasic({ title, genre, description, tagline, tags, onChange }: {
  title: string; genre: string; description: string;
  tagline: string; tags: string[];
  onChange: (patch: { title?: string; genre?: string; description?: string; tagline?: string; tags?: string[] }) => void;
})
```

2. 내부 useState 제거 후 props 연결:
```typescript
// 제거: const [tags, setTags] = useState(...)
// 제거: const [tagline, setTagline] = useState(...)

// 213행 변경: onChange 호출로 교체
<WsInput value={tagline} onChange={(v) => onChange({ tagline: v })} maxLength={80} />

// 231행 변경: onChange 호출로 교체
<WsTags value={tags} onChange={(v) => onChange({ tags: v.slice(0, 10) })} />
```

3. draft 상태 확장 (569행):
```typescript
const [draft, setDraft] = useState({
  title: novel.title,
  genre: novel.genre ?? 'fantasy',
  description: novel.description ?? '',
  tagline: novel.tagline ?? '',
  tags: novel.tags ?? [],
});
```

4. handleSave 확장 (577-581행):
```typescript
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

5. SectionBasic 호출 확장 (673행):
```typescript
<SectionBasic
  title={draft.title}
  genre={draft.genre}
  description={draft.description}
  tagline={draft.tagline}
  tags={draft.tags}
  onChange={handleChange}
/>
```

---

## 공유 패턴

### 에러 처리 (백엔드)
**출처:** `apps/api/src/domains/novel/router/novel_router.py` 77-78행, 105-106행
**적용 대상:** router.py 수정 시 유지
```python
def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)

except AppError as e:
    raise _app_error_to_http(e) from e
```

### exclude_unset=True 패턴 (서비스 레이어)
**출처:** `apps/api/src/domains/novel/service/novel_service.py` 52행
**적용 대상:** novel_service.py의 update_novel — 변경 불필요 (NovelUpdate 스키마 확장 시 자동 처리)
```python
return await self.repo.update(novel, **data.model_dump(exclude_unset=True))
```

### API 래퍼 throwOnError 패턴 (프론트엔드)
**출처:** `apps/web/src/features/novel/lib/novel-api.ts` 10-18행
**적용 대상:** novel-api.ts — 변경 불필요 (SDK 재생성 후 타입만 갱신됨)
```typescript
function throwOnError(error: unknown): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  ...
}
```

### handleChange 패턴 (프론트엔드 상태 통합)
**출처:** `apps/web/src/features/novel/components/novel-settings-page.tsx` 572-575행
**적용 대상:** 변경 불필요 — `Partial<typeof draft>` 타입이 draft 확장 시 자동으로 tagline/tags 포함
```typescript
const handleChange = (patch: Partial<typeof draft>) => {
  setDraft((d) => ({ ...d, ...patch }));
  setSaved(false);
};
```

---

## 아날로그 없음

해당 없음. 모든 파일에 기존 코드베이스에서 직접 사용 가능한 패턴이 존재한다.

---

## 메타데이터

**아날로그 탐색 범위:**
- `apps/api/src/domains/novel/` (전체)
- `apps/api/alembic/versions/` (전체)
- `apps/web/src/features/novel/` (전체)

**스캔 파일 수:** 11개
**패턴 추출일:** 2026-05-28
