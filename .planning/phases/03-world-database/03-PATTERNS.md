# Phase 3: 세계관 데이터베이스 - 패턴 맵

**작성일:** 2026-05-17
**분석 대상 파일 수:** 18개
**아날로그 발견:** 18 / 18 (전부 novel 도메인에서 1:1 매핑)

---

## 파일 분류표

| 신규 파일 | 역할 | 데이터 흐름 | 가장 가까운 아날로그 | 매칭 품질 |
|-----------|------|-------------|---------------------|-----------|
| `domains/world/models/world_models.py` | model | CRUD | `domains/novel/models/novel_models.py` | 완전 일치 |
| `domains/world/schemas/world_schemas.py` | schema | request-response | `domains/novel/schemas/novel_schemas.py` | 완전 일치 |
| `domains/world/repository/character_repository.py` | repository | CRUD | `domains/novel/repository/chapter_repository.py` | 완전 일치 |
| `domains/world/repository/location_repository.py` | repository | CRUD | `domains/novel/repository/chapter_repository.py` | 완전 일치 |
| `domains/world/repository/world_setting_repository.py` | repository | CRUD | `domains/novel/repository/novel_repository.py` | 완전 일치 |
| `domains/world/repository/timeline_repository.py` | repository | CRUD | `domains/novel/repository/chapter_repository.py` | 완전 일치 |
| `domains/world/service/character_service.py` | service | CRUD | `domains/novel/service/novel_service.py` | 완전 일치 |
| `domains/world/service/location_service.py` | service | CRUD | `domains/novel/service/novel_service.py` | 완전 일치 |
| `domains/world/service/world_setting_service.py` | service | CRUD | `domains/novel/service/novel_service.py` | 완전 일치 |
| `domains/world/service/timeline_service.py` | service | CRUD | `domains/novel/service/novel_service.py` | 완전 일치 |
| `domains/world/router/world_router.py` | router | request-response | `domains/novel/router/novel_router.py` | 완전 일치 |
| `alembic/versions/0005_world_domain.py` | migration | - | `alembic/versions/0003_novel_domain.py` | 완전 일치 |
| `features/world/types/world.ts` | type | - | `features/novel/types/novel.ts` | 완전 일치 |
| `features/world/lib/world-api.ts` | api client | request-response | `features/novel/lib/novel-api.ts` | 완전 일치 |
| `features/world/hooks/use-world-queries.ts` | hook | request-response | `features/novel/hooks/use-novel-queries.ts` | 완전 일치 |
| `features/world/hooks/use-world-mutations.ts` | hook | request-response | `features/novel/hooks/use-novel-mutations.ts` | 완전 일치 |
| `features/world/components/*.tsx` | component | request-response | `features/novel/components/novel-card.tsx`, `novel-create-modal.tsx` | 완전 일치 |
| `routes/_authenticated/novels/$novelId/world/index.tsx` | route | request-response | `routes/_authenticated/novels/$novelId/index.tsx` | 완전 일치 |

---

## 패턴 상세

### 백엔드

#### `domains/world/models/world_models.py`
**아날로그:** `apps/api/src/domains/novel/models/novel_models.py`

복사 패턴 (lines 1-13, 22-42):
```python
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class WorldEntity(Base):
    __tablename__ = "world_entities"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=func.uuid_generate_v4())
    novel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("novels.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```
- `novel_id` FK + `ondelete="CASCADE"` 패턴 그대로 복사
- `updated_at`의 `onupdate=lambda: datetime.now(timezone.utc)` 반드시 포함
- Enum 타입 필드가 필요하면 `ChapterStatus` 선언 방식 복사 (lines 16-19)

---

#### `domains/world/schemas/world_schemas.py`
**아날로그:** `apps/api/src/domains/novel/schemas/novel_schemas.py`

복사 패턴 (lines 1-44):
```python
from pydantic import BaseModel, ConfigDict

class EntityCreate(BaseModel):
    name: str
    description: str | None = None

class EntityUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    novel_id: uuid.UUID
    # ... 나머지 필드
    created_at: datetime
    updated_at: datetime

class EntityListResponse(BaseModel):
    items: list[EntityResponse]
    total: int
```
- `model_config = ConfigDict(from_attributes=True)`는 Response 클래스에만 적용
- Create/Update는 `ConfigDict` 없음
- `| None = None` 패턴으로 optional 필드 처리

---

#### `domains/world/repository/*_repository.py`
**아날로그:** `apps/api/src/domains/novel/repository/chapter_repository.py`

복사 패턴 (전체 57 lines):
```python
class EntityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, novel_id: uuid.UUID, entity_id: uuid.UUID) -> Entity | None:
        result = await self.session.execute(
            select(Entity).where(Entity.id == entity_id, Entity.novel_id == novel_id)
        )
        return result.scalar_one_or_none()

    async def list_by_novel(self, novel_id: uuid.UUID) -> list[Entity]:
        result = await self.session.execute(
            select(Entity).where(Entity.novel_id == novel_id).order_by(Entity.created_at.asc())
        )
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> Entity:
        entity = Entity(novel_id=novel_id, **fields)
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: Entity, **fields: object) -> Entity:
        for k, v in fields.items():
            setattr(entity, k, v)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: Entity) -> None:
        await self.session.delete(entity)
        await self.session.flush()
```
- `flush()` + `refresh()` 쌍은 항상 함께 사용
- `**fields: object` 시그니처 유지
- `scalar_one_or_none()` 패턴 유지

---

#### `domains/world/service/*_service.py`
**아날로그:** `apps/api/src/domains/novel/service/novel_service.py`

복사 패턴 (전체 57 lines):
```python
from core.exceptions import ForbiddenError, NotFoundError

class EntityService:
    def __init__(self, repo: EntityRepository) -> None:
        self.repo = repo

    async def get_entity(self, novel_id: uuid.UUID, entity_id: uuid.UUID, user_id: uuid.UUID) -> Entity:
        # 1. novel 소유권 검증은 NovelService.get_novel()로 위임
        entity = await self.repo.get_by_id(novel_id, entity_id)
        if entity is None:
            raise NotFoundError("Entity")
        return entity

    async def create_entity(self, novel_id: uuid.UUID, data: EntityCreate) -> Entity:
        return await self.repo.create(novel_id, **data.model_dump(exclude_none=True))

    async def update_entity(self, novel_id: uuid.UUID, entity_id: uuid.UUID, data: EntityUpdate) -> Entity:
        entity = await self.repo.get_by_id(novel_id, entity_id)
        if entity is None:
            raise NotFoundError("Entity")
        return await self.repo.update(entity, **data.model_dump(exclude_unset=True))
```
- create는 `exclude_none=True`, update는 `exclude_unset=True`
- `NotFoundError("EntityName")` — 엔티티명 문자열 전달

---

#### `domains/world/router/world_router.py`
**아날로그:** `apps/api/src/domains/novel/router/novel_router.py`

복사 패턴 (lines 45-67, 74-94):
```python
router = APIRouter(prefix="/novels/{novel_id}/world", tags=["world"])

async def _get_character_service(
    session: AsyncSession = Depends(get_async_session),
) -> CharacterService:
    return CharacterService(CharacterRepository(session))

def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)

@router.post("/characters", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    novel_id: uuid.UUID,
    data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> CharacterResponse:
    try:
        return await service.create_character(novel_id, data)
    except AppError as e:
        raise _app_error_to_http(e) from e
```
- `_app_error_to_http` 헬퍼는 router 파일 내부에 정의 (novel_router.py lines 65-67과 동일)
- `Depends(get_current_user)` 모든 엔드포인트에 적용
- `try/except AppError` 블록 모든 엔드포인트에 적용

**`apps/api/src/main.py` 등록 패턴** (lines 244-250):
```python
# World domain
try:
    from domains.world.router.world_router import router as world_router
    application.include_router(world_router, prefix="/api/v1")
    logger.debug("router_registered", prefix="/api/v1/novels/{novel_id}/world")
except ImportError:
    logger.debug("world_router_not_found")
```

---

#### `alembic/versions/0005_world_domain.py`
**아날로그:** `apps/api/alembic/versions/0003_novel_domain.py`

복사 패턴 (전체 구조):
```python
"""World domain: characters, locations, world_settings, timelines tables."""
from __future__ import annotations
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005_world_domain"
down_revision = "0004_merge_0002_and_0003"  # 현재 HEAD revision

def upgrade() -> None:
    op.create_table(
        "characters",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        # ... 필드들
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["novel_id"], ["novels.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_characters_novel_id", "characters", ["novel_id"])

def downgrade() -> None:
    op.drop_index("ix_characters_novel_id", table_name="characters")
    op.drop_table("characters")
```
- `down_revision`은 현재 마지막 revision 확인 후 설정 (`0004_merge_0002_and_0003`)
- `ix_{table}_{fk_column}` 인덱스 네이밍 규칙 준수
- `gen_random_uuid()` 사용 (novel 마이그레이션과 동일)

---

### 프론트엔드

#### `features/world/types/world.ts`
**아날로그:** `apps/web/src/features/novel/types/novel.ts`

복사 패턴 (전체 44 lines):
```typescript
export interface Character {
  id: string;
  novel_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreateInput {
  name: string;
  description?: string;
}

export interface CharacterUpdateInput {
  name?: string;
  description?: string;
}

export interface WorldListResponse<T> {
  items: T[];
  total: number;
}
```
- `id`, `novel_id` 는 `string` (UUID를 string으로 표현)
- datetime 필드는 `string` 타입
- optional 필드는 `?: string` (not `| undefined`)

---

#### `features/world/lib/world-api.ts`
**아날로그:** `apps/web/src/features/novel/lib/novel-api.ts`

복사 패턴 (전체 51 lines):
```typescript
import { /* generated SDK functions */ } from '@/generated/sdk.gen';
import type { Character, CharacterCreateInput } from '../types/world';

function throwOnError(error: unknown): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? '오류가 발생했습니다');
  }
  throw new Error('오류가 발생했습니다');
}

export async function apiGetCharacters(novelId: string): Promise<Character[]> {
  const { data, error } = await listCharactersApiV1NovelsNovelIdWorldCharactersGet({
    path: { novel_id: novelId },
  });
  if (error) throwOnError(error);
  return data as Character[];
}
```
- `throwOnError` 헬퍼는 파일 내부에 정의 (novel-api.ts lines 10-18과 동일)
- generated SDK 함수명은 `openapi-ts` 자동 생성 후 확인
- `{ data, error }` 구조 분해 패턴 유지

---

#### `features/world/hooks/use-world-queries.ts`
**아날로그:** `apps/web/src/features/novel/hooks/use-novel-queries.ts`

복사 패턴 (전체 17 lines):
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiGetCharacters, apiGetCharacter } from '../lib/world-api';

export function useCharacters(novelId: string) {
  return useQuery({
    queryKey: ['worlds', novelId, 'characters'],
    queryFn: () => apiGetCharacters(novelId),
    enabled: !!novelId,
  });
}
```
- queryKey 구조: `['worlds', novelId, entityType]`
- `enabled: !!id` 패턴은 단건 조회에만 적용

---

#### `features/world/hooks/use-world-mutations.ts`
**아날로그:** `apps/web/src/features/novel/hooks/use-novel-mutations.ts`

복사 패턴 (전체 50 lines):
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreateCharacterMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterCreateInput) => apiCreateCharacter(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'characters'] });
      toast.success('캐릭터가 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
```
- `toast.success` / `toast.error` from `sonner` 패턴 동일
- `onError`의 `error instanceof Error` 체크 유지
- `queryClient.invalidateQueries` 에 정확한 queryKey 전달

---

#### `features/world/components/*.tsx`
**아날로그:** `apps/web/src/features/novel/components/novel-card.tsx`, `novel-create-modal.tsx`

카드 컴포넌트 패턴 (`novel-card.tsx` 전체):
- Props 인터페이스: `{ entity, onEdit, onDelete }`
- `Link` from `@tanstack/react-router`로 상세 페이지 연결
- 액션 버튼은 카드 내부에 absolute 위치 (`top-2 right-2`)
- `e.preventDefault()` 후 onEdit/onDelete 호출

폼 모달 패턴 (`novel-create-modal.tsx` 전체):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(255),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
```
- `zod` 스키마를 컴포넌트 파일 상단에 인라인 정의 (별도 schema 파일 없음)
- `zodResolver` 사용
- `mutation.isPending`으로 제출 버튼 비활성화

---

#### `routes/_authenticated/novels/$novelId/world/index.tsx`
**아날로그:** `apps/web/src/routes/_authenticated/novels/$novelId/index.tsx`

복사 패턴 (전체 70 lines):
```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/novels/$novelId/world/')({
  component: WorldIndexPage,
});

function WorldIndexPage() {
  const { novelId } = Route.useParams();
  const { data, isLoading, isError } = useCharacters(novelId);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (isError || !data) return <div className="text-center py-12 text-destructive">불러올 수 없습니다</div>;
  // ...
}
```
- `Route.useParams()`로 `novelId` 추출
- `isLoading` → spinner, `isError` → 에러 메시지 3-상태 패턴
- 파일 경로가 URL 구조 그대로 매핑됨 (TanStack Router 파일 기반 라우팅)

---

## 공유 패턴 (모든 파일에 적용)

### 인증 (백엔드)
**출처:** `apps/api/src/domains/novel/router/novel_router.py` lines 27-29, 77
```python
from domains.auth.models import User
from domains.auth.security import get_current_user
# 모든 엔드포인트: current_user: User = Depends(get_current_user)
```

### 에러 처리 (백엔드)
**출처:** `apps/api/src/domains/novel/router/novel_router.py` lines 65-67
```python
def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)
# 모든 엔드포인트: except AppError as e: raise _app_error_to_http(e) from e
```

### API 에러 처리 (프론트엔드)
**출처:** `apps/web/src/features/novel/lib/novel-api.ts` lines 10-18
```typescript
function throwOnError(error: unknown): never { ... }
// 모든 API 함수: if (error) throwOnError(error);
```

### 토스트 알림 (프론트엔드)
**출처:** `apps/web/src/features/novel/hooks/use-novel-mutations.ts` lines 12-18
```typescript
import { toast } from 'sonner';
onSuccess: () => { toast.success('...되었습니다'); }
onError: (error: unknown) => { toast.error(error instanceof Error ? error.message : '오류가 발생했습니다'); }
```

---

## 아날로그 없는 파일

없음. 모든 신규 파일은 novel 도메인에서 직접 패턴을 복사할 수 있습니다.

---

## 메타데이터

**탐색 범위:** `apps/api/src/domains/novel/`, `apps/web/src/features/novel/`, `apps/web/src/routes/_authenticated/novels/`, `apps/api/alembic/versions/`
**스캔 파일 수:** 14개
**패턴 추출일:** 2026-05-17
