# Phase 3: 세계관 데이터베이스 - Research

**작성일:** 2026-05-17
**도메인:** FastAPI DDD 도메인 확장 + React 탭 기반 CRUD UI
**신뢰도:** HIGH (기존 코드베이스 직접 검증)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: `domains/world/` 단일 도메인, `domains/novel/`과 동일한 DDD 패턴
- D-02: `domains/world`는 `core/`와 `domains/shared/`만 import 가능
- D-03: 모든 엔드포인트는 `get_current_user` 의존성 + `novel_id + current_user` 소유권 검증
- D-04: 5개 테이블 (characters, locations, world_settings, timelines, character_relationships)
- D-05: 소프트 딜리트 없음, cascade delete
- D-06: `world_settings.content` JSONB 자유 형식
- D-07: 모든 엔티티에 `summary(TEXT, nullable)` 포함
- D-08~D-12: 엔드포인트 경로 확정 (CONTEXT.md 참조)
- D-13: 검색/필터는 백엔드 쿼리 파라미터 (name=ILIKE, type=정확 일치)
- D-14: TanStack Router 파일 기반, `_authenticated/novels/$novelId/world/index.tsx`
- D-15: `apps/web/src/features/world/` 피처 디렉토리
- D-16~D-18: TanStack Query + local useState 검색 + react-hook-form + zod
- D-19: 생성/수정 폼은 모달 방식, `modal-store.ts` 패턴 재사용
- D-20: 목록은 테이블/리스트 형태 (카드 그리드 X)
- D-21: 삭제는 confirm 다이얼로그 후 실행

### Claude's Discretion
- `world_router.py` 단일 파일 vs 엔티티별 분리 — planner 판단
- 캐릭터 관계 목록 UI 방식 — planner 판단
- 시간표 `event_date` validation 방식 — planner 판단

### Deferred Ideas (OUT OF SCOPE)
- 캐릭터 관계 그래프 시각화 (ADV-01)
- pgvector 의미 검색 (ADV-03)
- `summary` AI 자동 생성
- 세계관 항목 간 연결
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORLD-01 | Character CRUD (name, appearance, personality, background, role, summary) | novel_models.py 패턴 직접 적용 |
| WORLD-02 | Location CRUD (name, description, location_relation, summary) | 동일 패턴 |
| WORLD-03 | World settings CRUD (magic_system/nation_faction/history/rule — JSONB content) | Chapter.content JSONB 패턴 참조 |
| WORLD-04 | Timeline CRUD (event_name, event_date VARCHAR, description, chapter_id FK) | chapter_id FK는 nullable |
| WORLD-05 | Character relationships (lover/enemy/ally/family, 방향성 보존) | OR 쿼리 패턴 필요 |
| WORLD-06 | 이름 ILIKE + 타입 정확 일치 서버 필터 | SQLAlchemy ilike() 패턴 |
</phase_requirements>

---

## Summary

Phase 3는 기존 `domains/novel/` 패턴을 `domains/world/`로 확장하는 작업이다. 코드베이스를 직접 검증한 결과, 백엔드 Router → Service → Repository 3계층 패턴이 완전히 확립되어 있고 world 도메인은 이를 그대로 복사하여 적용할 수 있다.

프론트엔드는 HeyAPI(`@/generated/sdk.gen`)에서 자동 생성된 함수를 `lib/world-api.ts`에서 래핑하고, `use-world-queries.ts` / `use-world-mutations.ts`로 TanStack Query 훅을 노출하는 구조다. `novel-api.ts`의 `throwOnError` 헬퍼를 동일하게 재사용한다.

character_relationships의 방향성 처리가 이 Phase의 유일한 비자명한 설계 포인트다. `character_id_a = id OR character_id_b = id` OR 쿼리로 양방향을 조회하되, 응답에 `direction: "source" | "target"` 필드를 포함하여 프론트엔드가 관계 방향을 표시할 수 있게 한다.

**핵심 지침:** 기존 `novel` 도메인 파일을 직접 복사해서 수정하는 방식으로 구현한다. 새로 발명할 것이 없다.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 소유권 검증 (novel_id + user) | API / Backend | — | 서비스 레이어에서 `_verify_novel_ownership` 패턴 적용 |
| JSONB content 저장/조회 | Database / Storage | API (Pydantic) | PostgreSQL JSONB, Pydantic `dict | None` |
| 검색/필터 (ILIKE, exact) | API / Backend | — | DB 쿼리, 클라이언트 필터링 금지 |
| 관계 방향성 표시 | API / Backend | Frontend | 응답에 direction 필드 포함 |
| 탭 UI 상태 | Browser / Client | — | React local state |
| 폼 모달 열기/닫기 | Browser / Client | — | Zustand modal-store |
| 서버 상태 캐시 | Browser / Client | — | TanStack Query invalidateQueries |

---

## 1. 백엔드 패턴 (domains/world/)

### 1.1 디렉토리 구조

```
apps/api/src/domains/world/
├── __init__.py
├── models/
│   └── world_models.py          # 5개 ORM 모델 전부
├── schemas/
│   └── world_schemas.py         # Pydantic Create/Update/Response 스키마
├── repository/
│   ├── character_repository.py
│   ├── location_repository.py
│   ├── world_setting_repository.py
│   └── timeline_repository.py
├── service/
│   ├── character_service.py
│   ├── location_service.py
│   ├── world_setting_service.py
│   └── timeline_service.py
└── router/
    └── world_router.py           # 단일 파일로 시작, 크기 초과 시 분리
```

**근거:** CONTEXT.md D-01 확정. `domains/novel/`의 router가 하나인데 260줄이므로, 5개 엔티티를 담으면 ~600줄 예상 — planner가 분리 여부 판단.

### 1.2 ORM 모델 패턴 [VERIFIED: 코드베이스 직접 확인]

기존 `novel_models.py`에서 `enum.Enum`을 사용하지만 CONTEXT.md(D-04)는 StrEnum을 지정한다. Python 3.11+ `StrEnum`을 사용:

```python
# apps/api/src/domains/world/models/world_models.py
from __future__ import annotations
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class WorldSettingType(enum.StrEnum):
    MAGIC_SYSTEM = "magic_system"
    NATION_FACTION = "nation_faction"
    HISTORY = "history"
    RULE = "rule"

class RelationshipType(enum.StrEnum):
    LOVER = "lover"
    ENEMY = "enemy"
    ALLY = "ally"
    FAMILY = "family"

class Character(Base):
    __tablename__ = "characters"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=func.uuid_generate_v4())
    novel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("novels.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    appearance: Mapped[str | None] = mapped_column(Text, nullable=True)
    personality: Mapped[str | None] = mapped_column(Text, nullable=True)
    background: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

**주의:** SAEnum name은 테이블별로 고유해야 한다.
- `world_setting_type_enum`
- `relationship_type_enum`

### 1.3 서비스 패턴 [VERIFIED: 코드베이스 직접 확인]

`chapter_service.py`의 `_verify_novel_ownership` 패턴을 모든 world 서비스에 복사한다. NovelRepository를 주입받아 소유권을 확인한다.

```python
class CharacterService:
    def __init__(self, novel_repo: NovelRepository, character_repo: CharacterRepository) -> None:
        self.novel_repo = novel_repo
        self.character_repo = character_repo

    async def _verify_novel_ownership(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()
```

### 1.4 라우터 등록 패턴 [VERIFIED: main.py 직접 확인]

`main.py`의 `_register_routers()`에 try/except ImportError 블록 추가:

```python
try:
    from domains.world.router.world_router import router as world_router
    application.include_router(world_router, prefix="/api/v1")
except ImportError:
    logger.debug("world_router_not_found")
```

### 1.5 Alembic 마이그레이션 패턴 [VERIFIED: 0003_novel_domain.py 직접 확인]

네이밍 패턴: `0004_world_domain.py`  
down_revision: 마지막 merge revision (`22e20af02e5a`)

```python
revision = "0004_world_domain"
down_revision = "22e20af02e5a"

def upgrade() -> None:
    # StrEnum은 postgresql.ENUM으로 생성 후 create_type=False로 컬럼에 참조
    op.execute("CREATE TYPE world_setting_type_enum AS ENUM ('magic_system', 'nation_faction', 'history', 'rule')")
    op.execute("CREATE TYPE relationship_type_enum AS ENUM ('lover', 'enemy', 'ally', 'family')")
    op.create_table("characters", ...)
    op.create_table("locations", ...)
    op.create_table("world_settings", ...)
    op.create_table("timelines", ...)
    op.create_table("character_relationships", ...)

def downgrade() -> None:
    op.drop_table("character_relationships")
    op.drop_table("timelines")
    op.drop_table("world_settings")
    op.drop_table("locations")
    op.drop_table("characters")
    op.execute("DROP TYPE relationship_type_enum")
    op.execute("DROP TYPE world_setting_type_enum")
```

`chapter_relationships`에 UniqueConstraint(`character_id_a`, `character_id_b`)는 추가하지 않는다. A→B와 B→A가 별개 레코드로 허용된다 (CONTEXT.md D-04).

---

## 2. JSONB 처리 (world_settings.content)

### 2.1 ORM 선언

`Chapter.content`와 동일한 패턴을 그대로 적용 [VERIFIED: novel_models.py]:

```python
content: Mapped[dict | None] = mapped_column(JSONB, nullable=False)  # world_settings는 nullable=False
```

`world_settings.content`는 항상 필수이므로 nullable=False. 빈 JSONB의 경우 `{}` 저장.

### 2.2 Pydantic 스키마

```python
class WorldSettingCreate(BaseModel):
    name: str
    type: WorldSettingType
    content: dict = {}       # 자유 형식 JSONB
    summary: str | None = None
```

응답:
```python
class WorldSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    novel_id: uuid.UUID
    name: str
    type: WorldSettingType
    content: dict            # 프론트로 그대로 전달
    summary: str | None
    created_at: datetime
    updated_at: datetime
```

### 2.3 프론트엔드 타입

```typescript
// features/world/types/world.ts
export type WorldSettingType = 'magic_system' | 'nation_faction' | 'history' | 'rule';

export interface WorldSetting {
  id: string;
  novel_id: string;
  name: string;
  type: WorldSettingType;
  content: Record<string, unknown>;  // 자유 형식 JSONB
  summary: string | null;
  created_at: string;
  updated_at: string;
}
```

폼에서 `content` 필드는 JSON 텍스트 편집기(textarea)로 표시하고, 저장 전 `JSON.parse()`로 파싱한다. zod 스키마:

```typescript
content: z.string()
  .transform((val) => JSON.parse(val))
  .or(z.record(z.unknown()))
  .default('{}'),
```

---

## 3. 캐릭터 관계 방향성 처리

### 3.1 쿼리 패턴

`GET /novels/{novel_id}/characters/{id}/relationships`는 해당 캐릭터가 A이거나 B인 모든 관계를 반환한다:

```python
# character_repository.py (또는 별도 relationship_repository.py)
from sqlalchemy import or_

async def list_relationships(
    self, novel_id: uuid.UUID, character_id: uuid.UUID
) -> list[CharacterRelationship]:
    stmt = (
        select(CharacterRelationship)
        .where(
            CharacterRelationship.novel_id == novel_id,
            or_(
                CharacterRelationship.character_id_a == character_id,
                CharacterRelationship.character_id_b == character_id,
            ),
        )
        .order_by(CharacterRelationship.created_at.asc())
    )
    result = await self.session.execute(stmt)
    return list(result.scalars().all())
```

### 3.2 응답 스키마 (방향성 포함)

서비스 레이어에서 direction 필드를 계산해 응답 객체를 구성한다:

```python
class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    novel_id: uuid.UUID
    character_id_a: uuid.UUID
    character_id_b: uuid.UUID
    type: RelationshipType
    description: str | None
    created_at: datetime
    updated_at: datetime
    direction: str  # "source" (요청 캐릭터가 A) or "target" (요청 캐릭터가 B)
    other_character_id: uuid.UUID  # 상대 캐릭터 ID (프론트 표시용)
```

서비스에서:

```python
def _to_relationship_response(
    self, rel: CharacterRelationship, character_id: uuid.UUID
) -> RelationshipResponse:
    is_source = rel.character_id_a == character_id
    return RelationshipResponse(
        **{k: getattr(rel, k) for k in ['id', 'novel_id', 'character_id_a', 'character_id_b', 'type', 'description', 'created_at', 'updated_at']},
        direction="source" if is_source else "target",
        other_character_id=rel.character_id_b if is_source else rel.character_id_a,
    )
```

`direction` 필드는 DB 컬럼이 아닌 계산 필드이므로 `from_attributes=True`만으로는 부족하다. `model_config`에서 `from_attributes=True` + 서비스에서 직접 생성.

---

## 4. 검색/필터 패턴

### 4.1 SQLAlchemy ILIKE + exact match [VERIFIED: 코드베이스 패턴 기반]

```python
# character_repository.py
async def list_by_novel(
    self,
    novel_id: uuid.UUID,
    name: str | None = None,
) -> list[Character]:
    stmt = select(Character).where(Character.novel_id == novel_id)
    if name:
        stmt = stmt.where(Character.name.ilike(f"%{name}%"))
    stmt = stmt.order_by(Character.created_at.desc())
    result = await self.session.execute(stmt)
    return list(result.scalars().all())
```

world_settings의 경우 type 필터 추가:

```python
async def list_by_novel(
    self,
    novel_id: uuid.UUID,
    name: str | None = None,
    type: WorldSettingType | None = None,
) -> list[WorldSetting]:
    stmt = select(WorldSetting).where(WorldSetting.novel_id == novel_id)
    if name:
        stmt = stmt.where(WorldSetting.name.ilike(f"%{name}%"))
    if type:
        stmt = stmt.where(WorldSetting.type == type)
    ...
```

### 4.2 라우터 쿼리 파라미터

```python
@router.get("/{novel_id}/characters", response_model=list[CharacterResponse])
async def list_characters(
    novel_id: uuid.UUID,
    name: str | None = None,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> list[CharacterResponse]:
    ...
```

---

## 5. 프론트엔드 패턴

### 5.1 TanStack Router 라우트 추가 [VERIFIED: 라우트 파일 구조 직접 확인]

기존 라우트 트리:
```
routes/_authenticated/novels/$novelId/index.tsx  (소설 상세)
routes/_authenticated/novels/$novelId/chapters/$chapterId/edit.tsx
```

추가할 파일:
```
routes/_authenticated/novels/$novelId/world/index.tsx
```

파일 내용:
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { WorldPage } from '@/features/world/components/world-page';

export const Route = createFileRoute('/_authenticated/novels/$novelId/world/')({
  component: WorldPage,
});
```

`Route.useParams()`로 `novelId` 접근 — 기존 `$novelId/index.tsx` 패턴과 동일.

### 5.2 HeyAPI 생성 함수 사용 패턴 [VERIFIED: chapter-api.ts 직접 확인]

OpenAPI 스펙에서 자동 생성된 함수 이름 규칙:
- `POST /novels/{novel_id}/characters` → `createCharacterApiV1NovelsNovelIdCharactersPost`
- `GET /novels/{novel_id}/characters` → `listCharactersApiV1NovelsNovelIdCharactersGet`
- 이하 동일 패턴

세계관 API 생성 후 `sdk.gen.ts`에서 자동 생성된다. 플래너는 백엔드 구현 → OpenAPI 재생성 → 프론트엔드 사용 순서로 태스크를 배치해야 한다.

### 5.3 lib/world-api.ts 패턴

```typescript
// features/world/lib/world-api.ts
import {
  listCharactersApiV1NovelsNovelIdCharactersGet,
  createCharacterApiV1NovelsNovelIdCharactersPost,
  // ...
} from '@/generated/sdk.gen';
import type { Character } from '../types/world';

function throwOnError(error: unknown): never {
  // novel-api.ts와 동일한 throwOnError 패턴 복사
}

export async function apiGetCharacters(novelId: string, name?: string): Promise<Character[]> {
  const { data, error } = await listCharactersApiV1NovelsNovelIdCharactersGet({
    path: { novel_id: novelId },
    query: { name },
  });
  if (error) throwOnError(error);
  return (data ?? []) as Character[];
}
```

### 5.4 modal-store 사용 패턴 [VERIFIED: modal-store.ts 직접 확인]

`useModal` (Zustand store)의 `openModal`은 `ModalProps | string | JSX.Element`를 받는다. 기존 `novel-create-modal.tsx`는 `open: boolean` props 방식을 사용 — modal-store를 직접 쓰지 않고 로컬 state로 관리한다.

**두 가지 사용 방식이 공존한다:**

1. **로컬 state 방식** (novel-create-modal.tsx): 부모가 `useState`로 open 관리
2. **modal-store 방식**: `useModal().openModal(<CharacterFormModal />)` 전역 호출

CONTEXT.md D-19가 "modal-store.ts 패턴 재사용"이라고 명시하나, 실제 novel 피처는 로컬 state 방식을 쓴다. planner는 어느 방식을 사용할지 결정해야 한다. **로컬 state 방식이 더 단순하고 기존 코드와 일치한다** — `modal-store` 방식은 전역 모달이 필요할 때(예: 중첩 모달) 적합하다.

### 5.5 use-world-queries.ts 패턴

```typescript
export function useCharacters(novelId: string, name?: string) {
  return useQuery({
    queryKey: ['characters', novelId, { name }],
    queryFn: () => apiGetCharacters(novelId, name),
    enabled: !!novelId,
  });
}
```

검색어 변경 시 React `useState`로 `name` 상태 관리 → `useCharacters(novelId, searchName)` 전달 → queryKey 변경으로 자동 재조회.

### 5.6 use-world-mutations.ts 패턴

```typescript
export function useCreateCharacterMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterCreateInput) => apiCreateCharacter(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', novelId] });
      toast.success('캐릭터가 생성되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
```

---

## 6. 공통 함정

### Pitfall 1: ENUM 이름 충돌
**현상:** Alembic `upgrade()`에서 `CREATE TYPE` 실행 시 이미 존재하는 경우 오류  
**원인:** `--autogenerate`가 기존 타입 DROP/CREATE를 잘못 처리할 수 있음  
**해결:** 마이그레이션을 수동으로 작성한다 (`0003_novel_domain.py` 패턴 참조). `CREATE TYPE IF NOT EXISTS` 또는 `downgrade()`에서 DROP 전에 의존 컬럼 먼저 삭제.

### Pitfall 2: HeyAPI 재생성 타이밍
**현상:** 백엔드 엔드포인트는 존재하는데 `sdk.gen.ts`에 함수가 없어 TS 컴파일 오류  
**원인:** OpenAPI 스펙 재생성을 잊음  
**해결:** 백엔드 구현 완료 → 서버 실행 → `make generate-client` (또는 프로젝트의 HeyAPI 생성 스크립트) → 프론트엔드 구현 순서 필수.

### Pitfall 3: RelationshipResponse direction 필드 from_attributes 오류
**현상:** `ConfigDict(from_attributes=True)`인데 `direction` 필드가 ORM에 없어 ValidationError  
**원인:** `direction`은 계산 필드, ORM 속성이 아님  
**해결:** 서비스 레이어에서 `RelationshipResponse(...)` 직접 생성 — `from_orm()` 대신 수동 매핑.

### Pitfall 4: StrEnum vs enum.Enum SAEnum 선언 차이
**현상:** DB에 저장된 값과 Python 값 불일치  
**원인:** `StrEnum`은 값이 문자열이지만 `SAEnum(name=...)`은 Python enum 클래스를 받음  
**해결:** `SAEnum(WorldSettingType, name="world_setting_type_enum", values_callable=lambda x: [e.value for e in x])` 또는 `SAEnum("magic_system", "nation_faction", ...)` 문자열 직접 전달. 0003_novel_domain.py는 migration에서 문자열로 ENUM을 생성하고 ORM에서는 Python enum을 참조하는 방식을 사용 — 동일하게 적용.

### Pitfall 5: TanStack Router routeTree.gen.ts
**현상:** 새 라우트 파일 추가 후 타입 오류  
**원인:** `routeTree.gen.ts`는 자동 생성 파일, 직접 편집 금지  
**해결:** 개발 서버 재시작 또는 `tsr generate` 실행으로 자동 갱신.

---

## 7. 구현 순서 (플래너 참고)

아래 순서는 의존성 기반이다. HeyAPI 재생성이 프론트엔드 구현의 전제 조건이므로 백엔드 완료 후 재생성 단계가 필수다.

```
백엔드 구현
  1. world_models.py (ORM 5개 모델) → verify: Python import 오류 없음
  2. world_schemas.py (Pydantic 스키마) → verify: 스키마 단위 테스트
  3. 4개 repository → verify: async 메서드 시그니처
  4. 4개 service → verify: _verify_novel_ownership 포함
  5. world_router.py → verify: FastAPI 라우트 등록
  6. main.py include_router 등록 → verify: /docs 엔드포인트 확인
  7. Alembic migration 0004 작성 → verify: uv run alembic upgrade head

HeyAPI 재생성
  8. 백엔드 서버 실행 후 OpenAPI 스펙 재생성 → verify: sdk.gen.ts 갱신

프론트엔드 구현
  9.  features/world/types/world.ts
  10. features/world/schema/world.schema.ts (zod)
  11. features/world/lib/world-api.ts
  12. features/world/hooks/use-world-queries.ts
  13. features/world/hooks/use-world-mutations.ts
  14. features/world/components/ (탭 페이지 + 폼 모달 + 리스트)
  15. routes/_authenticated/novels/$novelId/world/index.tsx
```

---

## Sources

### PRIMARY (HIGH — 코드베이스 직접 검증)
- `apps/api/src/domains/novel/models/novel_models.py` — ORM 패턴, StrEnum vs enum.Enum, JSONB
- `apps/api/src/domains/novel/service/novel_service.py` — AppError, ForbiddenError, NotFoundError
- `apps/api/src/domains/novel/service/chapter_service.py` — `_verify_novel_ownership` 패턴
- `apps/api/src/domains/novel/repository/novel_repository.py` — session.flush/refresh 패턴
- `apps/api/src/domains/novel/repository/chapter_repository.py` — 필터 쿼리 패턴
- `apps/api/src/domains/novel/router/novel_router.py` — Depends 패턴, AppError→HTTPException
- `apps/api/src/domains/novel/schemas/novel_schemas.py` — JSONB `dict | None` 스키마
- `apps/api/alembic/versions/0003_novel_domain.py` — 마이그레이션 패턴, ENUM 생성
- `apps/api/src/main.py` — `_register_routers()` try/except 패턴
- `apps/api/src/core/exceptions.py` — AppError 계층 구조
- `apps/web/src/features/novel/lib/novel-api.ts` — HeyAPI 래퍼, throwOnError
- `apps/web/src/features/novel/lib/chapter-api.ts` — path + query 파라미터 패턴
- `apps/web/src/features/novel/hooks/use-novel-queries.ts` — TanStack Query 훅 패턴
- `apps/web/src/features/novel/hooks/use-novel-mutations.ts` — invalidateQueries, sonner toast
- `apps/web/src/features/novel/components/novel-create-modal.tsx` — react-hook-form + zod 모달 패턴
- `apps/web/src/stores/modal-store.ts` — Zustand 모달 스토어 구조
- `apps/web/src/routes/_authenticated/novels/$novelId/index.tsx` — createFileRoute, useParams

### ASSUMED
- StrEnum `values_callable` SAEnum 동작 — Python 3.11+ StrEnum + SQLAlchemy ENUM 조합 [ASSUMED: 공식 문서 미확인, 대안으로 문자열 직접 전달 권장]

---

## Metadata

**신뢰도 분석:**
- 백엔드 패턴: HIGH — novel 도메인 전체 파일 직접 검증
- JSONB 처리: HIGH — Chapter.content 패턴 동일 적용
- 관계 방향성: MEDIUM — OR 쿼리 패턴은 표준이지만 direction 계산 필드 구현은 설계 결정
- 프론트엔드 패턴: HIGH — 실제 파일 구조 및 HeyAPI 사용 패턴 직접 확인
- Alembic 마이그레이션: HIGH — 0003 파일 직접 확인

**연구 날짜:** 2026-05-17
**유효 기간:** 90일 (코드베이스 기반, 라이브러리 버전 변화 무관)
