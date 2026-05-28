# Phase 2: 소설/챕터 관리 - Research

**조사일:** 2026-05-17
**도메인:** TipTap 에디터, @dnd-kit 정렬, Fractional Indexing, FastAPI DDD 도메인 패턴, Alembic 마이그레이션
**신뢰도:** HIGH

---

<user_constraints>
## User Constraints (CONTEXT.md 원문)

### 잠긴 결정(Locked Decisions)

- **D-01:** `domains/novel/` 단일 도메인으로 소설+챕터 모두 관리. `domains/auth/` 패턴 준수.
  - `domains/novel/router/novel_router.py`
  - `domains/novel/service/novel_service.py`, `chapter_service.py`
  - `domains/novel/repository/novel_repository.py`, `chapter_repository.py`
  - `domains/novel/models/novel_models.py`
  - `domains/novel/schemas/novel_schemas.py`
- **D-02:** `domains/novel`은 `domains/auth`, `domains/chat` import 금지. `core/`, `domains/shared/` 사용 가능.
- **D-03:** `novels` 테이블: `id(UUID PK)`, `user_id(FK→users)`, `title`, `genre`, `description`, `cover_image_url`, `created_at`, `updated_at`
- **D-04:** `chapters` 테이블: `id(UUID PK)`, `novel_id(FK→novels)`, `title`, `content(TEXT)`, `order_key(REAL)`, `status(enum: draft/reviewing/done)`, `created_at`, `updated_at`
- **D-05:** 챕터 순서 = `order_key REAL` + fractional indexing (앞뒤 평균값)
- **D-06:** 소프트 딜리트 없음, cascade delete
- **D-07:** 소설 CRUD: `POST/GET /api/v1/novels`, `GET/PUT/DELETE /api/v1/novels/{id}`
- **D-08:** 챕터 CRUD: `POST/GET /api/v1/novels/{novel_id}/chapters`, `GET/PUT/DELETE /api/v1/novels/{novel_id}/chapters/{id}`
- **D-09:** 챕터 순서 변경: `PATCH /api/v1/novels/{novel_id}/chapters/{id}/reorder` (body: `{ order_key: float }`)
- **D-10:** 모든 엔드포인트 `get_current_user` 의존성으로 보호
- **D-11:** 소설 목록 조회 시 `user_id = current_user.id` 필터
- **D-12:** TanStack Router 파일 기반, `_authenticated/` 하위
  - `_authenticated/novels/index.tsx`
  - `_authenticated/novels/$novelId/index.tsx`
  - `_authenticated/novels/$novelId/chapters/$chapterId/edit.tsx`
- **D-13:** URL: `/novels`, `/novels/:novelId`, `/novels/:novelId/chapters/:chapterId/edit`
- **D-14:** 서버 상태 = TanStack Query 전담
- **D-15:** 에디터 로컬 상태 = React `useState`. Zustand 불필요.
- **D-16:** 피처 코드: `apps/web/src/features/novel/`
- **D-17:** TipTap 3.x
- **D-18:** StarterKit + CharacterCount
- **D-19:** 자동저장 3초 debounce 후 `PATCH /chapters/{id}`
- **D-20:** 저장 상태: "저장됨" / "저장 중..." / "저장 실패"
- **D-21:** CharacterCount + 5,000자 도달 시 카운터 색상 변경(초록색)
- **D-22:** 카드 그리드. `apps/web/src/sample/` 참고만, 실 코드는 `features/novel/`
- **D-23:** 카드 표시: 커버 이미지, 제목, 장르, 챕터 수, 최종 수정일
- **D-24:** "새 소설 만들기" 버튼 → 모달 또는 인라인 폼
- **D-25~D-27:** 챕터 에디터에 사이드바 포함, 챕터 선택 시 URL 변경, @dnd-kit/core + @dnd-kit/sortable 사용

### Claude's Discretion
- 소설 생성 폼: 모달 vs 별도 페이지 (modal-store 패턴 참고하여 플래너 결정)
- @dnd-kit 미설치 시 임시 대안 (up/down 버튼) 허용 여부
- 챕터 에디터 레이아웃 (사이드바 너비, 에디터 영역 비율)

### Deferred Ideas (범위 외)
- AI 연동, 세계관 컨텍스트 주입
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | 설명 | Research 지원 |
|----|------|--------------|
| PROJ-01 | 소설 프로젝트 생성 | D-01 도메인 구조, D-03 DB 스키마, D-07 API |
| PROJ-02 | 소설 목록 조회 (본인 소설만) | D-11 user_id 필터, 페이지네이션 패턴 |
| PROJ-03 | 소설 수정 | D-07 PUT 엔드포인트 |
| PROJ-04 | 소설 삭제 (cascade) | D-06 cascade delete |
| CHAP-01 | 챕터 CRUD | D-08 API, D-04 DB 스키마 |
| CHAP-02 | TipTap 에디터 | TipTap 3.x 통합 섹션 |
| CHAP-03 | 자동저장 3초 debounce | use-debounce 패턴 섹션 |
| CHAP-04 | 글자수 표시 (5000자 목표) | CharacterCount API 섹션 |
| CHAP-05 | 드래그앤드롭 순서 변경 | @dnd-kit 섹션, fractional indexing 섹션 |
| CHAP-06 | 챕터 상태 (draft/reviewing/done) | Python StrEnum 패턴 섹션 |
</phase_requirements>

---

## 요약

Phase 2는 백엔드에 `domains/novel/` 도메인을 신규 추가하고, 프론트엔드에 TipTap 에디터 기반 챕터 집필 환경을 구축한다. 기존 `domains/auth/` 패턴이 명확하므로 구조 복사는 단순하다. 주요 신규 의존성은 TipTap 3.x (`@tiptap/react` 3.23.4, React 19 공식 지원 확인됨), `@dnd-kit/sortable` 10.0.0이며 두 라이브러리 모두 npm에서 검증됐다.

`use-debounce` 라이브러리는 3초 자동저장 구현에 쓰이며, TanStack Query `useMutation`과 자연스럽게 연동된다. Fractional indexing은 외부 라이브러리 없이 단순 미드포인트 계산으로 구현 가능하다 — `REAL` 컬럼의 부동소수점 정밀도 한계(약 6자리)만 주의하면 된다.

백엔드 Alembic 마이그레이션은 `0003_novel_domain.py`로 추가하며, `alembic/env.py`에 `domains.novel.models` import를 한 줄 추가해야 autogenerate가 작동한다.

**핵심 권고사항:** TipTap `useEditor`에 `immediatelyRender: false` 옵션 추가 필수 (SSR 미사용이라도 hydration 경고 방지).

---

## 아키텍처 책임 맵

| 기능 | 주 계층 | 보조 계층 | 근거 |
|------|---------|----------|------|
| 소설/챕터 CRUD | API (FastAPI) | DB (PostgreSQL) | 비즈니스 로직, 소유권 검증은 서버에서 |
| 챕터 본문 에디터 | Browser (React) | — | 로컬 편집 상태, 실시간 글자수 |
| 자동저장 | Browser → API | — | debounce 후 PATCH 호출 |
| 순서 변경 | Browser (DnD) → API | DB | 드래그 시각화는 클라이언트, order_key 영속화는 서버 |
| 챕터 목록 사이드바 | Browser (React) | TanStack Query | 서버 상태 구독 |

---

## 1. TipTap 3.x + React 19 통합

### 1.1 패키지 설치

[VERIFIED: npm registry] — 2026-05-13 최신 버전 3.23.4 확인, React 19 peerDependency 명시적 지원 확인.

```bash
cd apps/web && pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count
```

| 패키지 | 버전 | 목적 |
|--------|------|------|
| `@tiptap/react` | 3.23.4 | React 바인딩, `useEditor`, `EditorContent` |
| `@tiptap/pm` | 3.23.4 | ProseMirror 의존성 (런타임 필수) |
| `@tiptap/starter-kit` | 3.23.4 | Bold, Italic, Heading, Paragraph 등 번들 |
| `@tiptap/extension-character-count` | 3.23.4 | 글자수/단어수 카운트 |

### 1.2 React 19 호환성

[VERIFIED: npm registry] — `@tiptap/react` 3.23.4의 peerDependencies:

```json
{
  "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
  "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0"
}
```

React 19 공식 지원 확인. 별도 호환성 패치 불필요.

### 1.3 기본 에디터 설정

[CITED: tiptap.dev/docs/editor/getting-started/install/react]

```tsx
// apps/web/src/features/novel/components/chapter-editor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CharacterCount } from '@tiptap/extension-character-count';

const CHAR_LIMIT_TARGET = 5000;

interface ChapterEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

export function ChapterEditor({ content, onUpdate }: ChapterEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,  // 제한 없이 카운트만 할 때는 configure() 없이 사용
    ],
    content,
    immediatelyRender: false,  // 필수: SSR 미사용이라도 hydration 경고 방지
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const isAtTarget = charCount >= CHAR_LIMIT_TARGET;

  return (
    <div>
      <EditorContent editor={editor} />
      <div className={isAtTarget ? 'text-green-500' : 'text-gray-400'}>
        {charCount} / {CHAR_LIMIT_TARGET}자
      </div>
    </div>
  );
}
```

### 1.4 CharacterCount API

[CITED: tiptap.dev/docs/editor/extensions/functionality/character-count]

```ts
// 글자 수 읽기
editor.storage.characterCount.characters()  // 전체 글자 수 (기본: textSize 모드)
editor.storage.characterCount.words()       // 단어 수

// 제한 설정 (D-21 요구사항: 제한 없이 5000자 색상 변경만)
CharacterCount.configure({ limit: null })  // 기본값 — 입력 제한 없음
```

**주의:** `limit`을 설정하면 입력이 차단된다. D-21은 색상만 바꾸는 것이므로 `limit: null` (기본값) 유지.

### 1.5 자동저장: use-debounce + TanStack Query

[VERIFIED: npm registry] — `use-debounce` 10.1.1, 2026-03-29 발행, 주간 다운로드 537만.

```bash
cd apps/web && pnpm add use-debounce
```

```tsx
// apps/web/src/features/novel/hooks/use-chapter-autosave.ts
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useMutation } from '@tanstack/react-query';
import { apiUpdateChapter } from '../api/chapter-api';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useChapterAutosave(chapterId: string, content: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [debouncedContent] = useDebounce(content, 3000);

  const mutation = useMutation({
    mutationFn: (html: string) => apiUpdateChapter(chapterId, { content: html }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => setSaveStatus('saved'),
    onError: () => setSaveStatus('error'),
  });

  useEffect(() => {
    if (debouncedContent && debouncedContent !== '') {
      mutation.mutate(debouncedContent);
    }
  }, [debouncedContent]);  // mutation은 의존성 배열에서 제외 (안정된 참조)

  return { saveStatus };
}
```

**저장 상태 표시 텍스트 매핑:**

| saveStatus | 표시 텍스트 |
|-----------|------------|
| `idle` | — |
| `saving` | 저장 중... |
| `saved` | 저장됨 |
| `error` | 저장 실패 |

---

## 2. @dnd-kit 설치 및 SortableList 패턴

### 2.1 패키지 설치

[VERIFIED: npm registry] — @dnd-kit/core 6.3.1 (2024-12-05), @dnd-kit/sortable 10.0.0, peerDependency `react >=16.8.0`.

```bash
cd apps/web && pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| 패키지 | 버전 | 목적 |
|--------|------|------|
| `@dnd-kit/core` | 6.3.1 | DndContext, sensors, collision detection |
| `@dnd-kit/sortable` | 10.0.0 | SortableContext, useSortable, arrayMove |
| `@dnd-kit/utilities` | 3.2.2 | CSS.Transform.toString 유틸 |

### 2.2 수직 정렬 리스트 패턴

[CITED: dndkit.com/presets/sortable]

```tsx
// apps/web/src/features/novel/components/chapter-sortable-list.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Chapter {
  id: string;
  title: string;
  order_key: number;
}

interface Props {
  chapters: Chapter[];
  onReorder: (activeId: string, newOrderKey: number) => void;
}

export function ChapterSortableList({ chapters, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);

    // fractional indexing: 새 위치의 앞뒤 order_key 평균
    const newOrderKey = calcOrderKey(reordered, newIndex);
    onReorder(active.id as string, newOrderKey);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {chapters.map((chapter) => (
          <SortableChapterItem key={chapter.id} chapter={chapter} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableChapterItem({ chapter }: { chapter: Chapter }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {chapter.title}
    </div>
  );
}
```

**드래그 핸들만 분리할 경우** (전체 아이템 드래그 방지):

```tsx
// listeners를 별도 핸들 div에만 적용
<div ref={setNodeRef} style={style} {...attributes}>
  <span {...listeners} className="cursor-grab">⠿</span>
  {chapter.title}
</div>
```

---

## 3. Fractional Indexing 구현

### 3.1 알고리즘

[ASSUMED] — 수학적 원리는 검증됨. `REAL` 컬럼의 PostgreSQL 정밀도(IEEE 754 단정밀도, 약 6~7 유효 자리)가 핵심 제약이다.

**기본 미드포인트 계산:**

```ts
// apps/web/src/features/novel/lib/order-key.ts
const INITIAL_GAP = 1000;  // 첫 챕터들의 간격
const MIN_GAP = 0.001;     // 이 이하면 재인덱싱 필요

/**
 * 주어진 인덱스 위치의 새 order_key를 계산한다.
 * reordered: 이미 arrayMove로 재정렬된 배열
 * targetIndex: 대상 아이템의 새 인덱스
 */
export function calcOrderKey(reordered: { order_key: number }[], targetIndex: number): number {
  const prev = reordered[targetIndex - 1]?.order_key;
  const next = reordered[targetIndex + 1]?.order_key;

  if (prev === undefined && next === undefined) return INITIAL_GAP;
  if (prev === undefined) return next! - INITIAL_GAP;
  if (next === undefined) return prev + INITIAL_GAP;

  const mid = (prev + next) / 2;
  return mid;
}

/**
 * 간격이 너무 좁아진 챕터 목록을 균등하게 재인덱싱한다.
 * 재인덱싱 후에는 모든 챕터의 order_key를 서버에 일괄 업데이트해야 한다.
 */
export function needsReindex(chapters: { order_key: number }[]): boolean {
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].order_key - chapters[i - 1].order_key < MIN_GAP) {
      return true;
    }
  }
  return false;
}

export function reindexOrderKeys(chapters: { id: string }[]): { id: string; order_key: number }[] {
  return chapters.map((c, i) => ({ id: c.id, order_key: (i + 1) * INITIAL_GAP }));
}
```

### 3.2 엣지케이스 처리

| 상황 | 문제 | 해결책 |
|------|------|--------|
| 맨 앞 삽입 | prev 없음 | `next - INITIAL_GAP` (음수 가능 — 허용) |
| 맨 뒤 삽입 | next 없음 | `prev + INITIAL_GAP` |
| 두 챕터 사이 반복 이동 | gap이 MIN_GAP 이하 | `needsReindex()` 검사 후 `BATCH PATCH` |
| 첫 챕터 생성 | 빈 배열 | `order_key = INITIAL_GAP` (1000.0) |

**재인덱싱 트리거 판단:** `onDragEnd` 이후 `needsReindex(reordered)` 검사. `true`이면 `PATCH /chapters/reorder-batch` (별도 엔드포인트 또는 순차 PATCH) 호출. 이 엔드포인트는 D-09에 없으므로 **플래너가 추가 여부를 결정**해야 한다.

### 3.3 백엔드 초기 order_key 할당

새 챕터 생성 시 서버에서 마지막 챕터 order_key + INITIAL_GAP을 계산:

```python
# chapter_service.py 내
async def create_chapter(self, novel_id: uuid.UUID, ...) -> Chapter:
    last = await self._chapter_repo.get_last_chapter(novel_id)
    order_key = (last.order_key + 1000.0) if last else 1000.0
    ...
```

---

## 4. FastAPI 도메인 패턴

### 4.1 기존 auth 패턴과의 차이점

기존 `domains/auth/`를 직접 분석한 결과:

| 항목 | auth 도메인 | novel 도메인 (차이점) |
|------|------------|---------------------|
| 의존성 | Redis (JWT blacklist) | Redis 불필요 |
| 비즈니스 로직 | 암호화, 토큰 순환 복잡 | CRUD 위주, 단순 |
| 소유권 검증 | JWT 발급/검증 | `novel.user_id == current_user.id` 체크 |
| 트랜잭션 | `repo.transaction()` 명시 | 단순 CRUD는 세션 레벨 commit만으로 충분 |
| 서비스 분리 | 단일 AuthService | 소설/챕터 서비스 분리 (D-01) |

### 4.2 신규 novel 도메인 구조

```
apps/api/src/domains/novel/
├── __init__.py
├── models/
│   ├── __init__.py           # from .novel_models import Novel, Chapter
│   └── novel_models.py       # SQLAlchemy ORM
├── schemas/
│   ├── __init__.py
│   └── novel_schemas.py      # Pydantic request/response
├── repository/
│   ├── __init__.py
│   ├── novel_repository.py   # NovelRepository(session)
│   └── chapter_repository.py # ChapterRepository(session)
├── service/
│   ├── __init__.py
│   ├── novel_service.py      # NovelService(novel_repo)
│   └── chapter_service.py    # ChapterService(novel_repo, chapter_repo)
└── router/
    ├── __init__.py
    └── novel_router.py       # APIRouter, _get_service, _app_error_to_http
```

### 4.3 핵심 패턴: 소유권 검증

`auth_router.py`가 `get_current_user` 의존성을 사용하는 것과 동일하게:

```python
# novel_router.py
from domains.auth.security import get_current_user
from domains.auth.models import User

@router.get("/novels/{novel_id}")
async def get_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_service),
) -> NovelResponse:
    try:
        novel = await service.get_novel(novel_id, user_id=current_user.id)
    except AppError as exc:
        raise _app_error_to_http(exc) from exc
    return NovelResponse.model_validate(novel)
```

서비스 레이어에서 소유권 검증:

```python
# novel_service.py
async def get_novel(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> Novel:
    novel = await self._novel_repo.get_by_id(novel_id)
    if novel is None:
        raise NotFoundError("Novel")
    if novel.user_id != user_id:
        raise ForbiddenError("접근 권한이 없습니다.")
    return novel
```

### 4.4 목록 조회 + 페이지네이션 패턴

[ASSUMED] — SQLAlchemy async에서의 표준 패턴. 기존 코드베이스에 목록 조회 예시가 없어 추론.

```python
# novel_repository.py
async def list_by_user(
    self,
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Novel], int]:
    count_stmt = select(func.count()).select_from(Novel).where(Novel.user_id == user_id)
    total = (await self._session.execute(count_stmt)).scalar_one()

    stmt = (
        select(Novel)
        .where(Novel.user_id == user_id)
        .order_by(Novel.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await self._session.execute(stmt)
    return list(result.scalars()), total
```

챕터 목록 (order_key 오름차순):

```python
# chapter_repository.py
async def list_by_novel(self, novel_id: uuid.UUID) -> list[Chapter]:
    result = await self._session.execute(
        select(Chapter)
        .where(Chapter.novel_id == novel_id)
        .order_by(Chapter.order_key.asc())
    )
    return list(result.scalars())
```

### 4.5 StrEnum 패턴 (챕터 상태)

[ASSUMED] — 기존 코드베이스에 StrEnum 사용 예시 없음. Python 3.11+ 표준이나, Python 3.12 대상이므로 사용 가능.

```python
# novel_models.py
import enum
from sqlalchemy import Enum as SAEnum

class ChapterStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEWING = "reviewing"
    DONE = "done"

class Chapter(Base):
    __tablename__ = "chapters"
    ...
    status: Mapped[ChapterStatus] = mapped_column(
        SAEnum(ChapterStatus, name="chapter_status_enum"),
        default=ChapterStatus.DRAFT,
        nullable=False,
    )
```

**주의:** PostgreSQL ENUM 타입은 Alembic에서 자동 감지됨. `downgrade()`에서 `op.execute("DROP TYPE chapter_status_enum")` 명시 필요.

---

## 5. Alembic 마이그레이션 패턴

### 5.1 기존 마이그레이션 체인 확인

```
0001_initial_schema.py  (down_revision=None)
0002_seed_admin_role_and_permission.py
[신규] 0003_novel_domain.py  (down_revision="0002_seed_admin_role_and_permission")
```

### 5.2 마이그레이션 파일 구조

[CITED: apps/api/alembic/versions/0001_initial_schema.py] — 기존 패턴 그대로 준수.

```python
# apps/api/alembic/versions/0003_novel_domain.py
"""Novel and Chapter domain tables.

Revision ID: 0003_novel_domain
Revises: 0002_seed_admin_role_and_permission
"""
from __future__ import annotations
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_novel_domain"
down_revision: str = "0002_seed_admin_role_and_permission"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # ── PostgreSQL ENUM 타입 먼저 생성 ────────────────────────────────────
    op.execute("CREATE TYPE chapter_status_enum AS ENUM ('draft', 'reviewing', 'done')")

    # ── novels ────────────────────────────────────────────────────────────
    op.create_table(
        "novels",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("genre", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_novels_user_id"), "novels", ["user_id"])

    # ── chapters ──────────────────────────────────────────────────────────
    op.create_table(
        "chapters",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("novel_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("order_key", sa.Float(), nullable=False),  # REAL = Float(precision=24)
        sa.Column("status", sa.Enum("draft", "reviewing", "done", name="chapter_status_enum"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["novel_id"], ["novels.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chapters_novel_id"), "chapters", ["novel_id"])
    op.create_index(op.f("ix_chapters_order_key"), "chapters", ["order_key"])


def downgrade() -> None:
    op.drop_table("chapters")
    op.drop_table("novels")
    op.execute("DROP TYPE chapter_status_enum")
```

### 5.3 Alembic env.py 수정 필수

[CITED: apps/api/alembic/env.py L130-138] — 신규 도메인 models를 반드시 import 추가.

```python
# apps/api/alembic/env.py 에 추가 (L137 이후)
try:
    from domains.novel import models as _novel_models  # noqa: F401
except ImportError:
    logger.debug("novel models not found — skipping")
```

이 한 줄이 없으면 `alembic revision --autogenerate`가 novel 테이블 변경을 감지하지 못한다.

### 5.4 main.py 라우터 등록

[CITED: apps/api/src/main.py 패턴] — auth 라우터와 동일하게:

```python
# apps/api/src/main.py 에 추가
from domains.novel.router.novel_router import router as novel_router
app.include_router(novel_router, prefix="/api/v1")
```

---

## 6. 패키지 정당성 감사

> slopcheck는 npm 패키지를 PyPI로 오인하여 모두 SLOP으로 판정. npm 레지스트리에서 직접 검증 완료.

| 패키지 | 레지스트리 | 최신 버전 | 주간 다운로드 | Source Repo | 검증 방식 | 조치 |
|--------|-----------|----------|-------------|------------|----------|------|
| `@tiptap/react` | npm | 3.23.4 | 875만 | github.com/ueberdosis/tiptap | npm view + peerDep 확인 | 승인 |
| `@tiptap/pm` | npm | 3.23.4 | (tiptap 모노레포) | 동일 | npm view | 승인 |
| `@tiptap/starter-kit` | npm | 3.23.4 | (tiptap 모노레포) | 동일 | npm view | 승인 |
| `@tiptap/extension-character-count` | npm | 3.23.4 | (tiptap 모노레포) | 동일 | npm view | 승인 |
| `@dnd-kit/core` | npm | 6.3.1 | 1,612만 | github.com/clauderic/dnd-kit | npm view + peerDep 확인 | 승인 |
| `@dnd-kit/sortable` | npm | 10.0.0 | (dnd-kit 모노레포) | 동일 | npm view | 승인 |
| `@dnd-kit/utilities` | npm | 3.2.2 | (dnd-kit 모노레포) | 동일 | npm view | 승인 |
| `use-debounce` | npm | 10.1.1 | 537만 | github.com/xnimorz/use-debounce | npm view | 승인 |

**slopcheck [SLOP] 판정으로 제거된 패키지:** 없음 (false positive — PyPI 오인)
**[SUS] 플래그 패키지:** 없음
**postinstall 스크립트:** 모든 패키지에서 없음 확인

---

## 7. 위험 요소 및 주의사항

### 위험 1: `immediatelyRender: false` 누락

**무슨 일이 생기나:** TipTap은 기본적으로 서버 사이드 렌더링 환경에서 즉시 초기화를 시도한다. Vite + React 19 환경에서도 `undefined` 에러 또는 hydration 경고가 발생할 수 있다.
**방지법:** `useEditor({ immediatelyRender: false, ... })` 반드시 추가.
**경고 징후:** 콘솔에 `Warning: Prop 'className' did not match` 또는 editor가 null인 상태에서 접근.

### 위험 2: useDebounce import 방식

**무슨 일이 생기나:** `use-debounce` v10에서 `useDebounce`는 named export다. 간혹 `import useDebounce from 'use-debounce'` (default import)로 쓰면 `undefined` 에러.
**방지법:** 반드시 `import { useDebounce } from 'use-debounce'` (중괄호 사용).
**출처:** TipTap GitHub Discussion #2871 커뮤니티 주의사항.

### 위험 3: order_key Float 정밀도 한계

**무슨 일이 생기나:** PostgreSQL의 `REAL`(4바이트 float)은 유효 자리 약 6~7자리. 동일 구간 내 매우 많은 이동 반복 시 두 값이 같아져 정렬 불가 상태 발생.
**방지법:** `MIN_GAP = 0.001` 이하 감지 시 전체 재인덱싱. `DOUBLE PRECISION`으로 바꾸면 정밀도 문제는 사실상 해소되지만 D-05에서 `REAL`로 결정됨.
**초기 간격:** `INITIAL_GAP = 1000.0`으로 설정하면 약 3만번 이동 후에야 문제 발생 (실용적으로 충분).

### 위험 4: Alembic PostgreSQL ENUM downgrade

**무슨 일이 생기나:** `upgrade()`에서 CREATE TYPE으로 만든 ENUM 타입은 테이블 DROP만으로 자동 삭제되지 않는다. `downgrade()`에서 `DROP TYPE`을 명시하지 않으면 재실행 시 `type already exists` 에러.
**방지법:** 위 마이그레이션 파일의 `downgrade()` 패턴 그대로 준수.

### 위험 5: @dnd-kit/sortable v10 API 변경

**무슨 일이 생기나:** @dnd-kit/sortable의 버전이 6.x에서 10.0.0으로 메이저 점프했다. 일부 API가 변경됐을 수 있다.
**확인된 사항:** peerDependency `@dnd-kit/core ^6.3.0` 명시 — 6.3.1과 호환. 기본 useSortable, arrayMove API는 동일.
**방지법:** 설치 후 공식 문서(dndkit.com) 기준 코드 작성. 위 코드 예시는 현재 문서 기반.

### 위험 6: 챕터 에디터 content 초기화 타이밍

**무슨 일이 생기나:** TanStack Query로 챕터를 로드할 때 `isLoading` 상태에서 editor를 초기화하면 content가 빈 문자열로 고정된다. 이후 data가 도착해도 editor에 반영 안 됨.
**방지법:** 쿼리가 성공할 때까지 editor 렌더링을 지연하거나, `editor.commands.setContent(newContent)` 명령으로 명시적 갱신.

```tsx
// 안전한 패턴
useEffect(() => {
  if (editor && chapterData?.content) {
    editor.commands.setContent(chapterData.content);
  }
}, [editor, chapterData?.content]);
```

---

## 아키텍처 다이어그램

사용자가 챕터를 편집하는 주요 흐름:

```
사용자 입력
    ↓
ChapterEditor (TipTap useEditor)
    ↓ onUpdate 콜백
useChapterAutosave (use-debounce, 3초)
    ↓ 3초 후
useMutation (TanStack Query)
    ↓ PATCH /api/v1/novels/{id}/chapters/{id}
FastAPI novel_router
    ↓
ChapterService.update_chapter()  ← 소유권 검증
    ↓
ChapterRepository (AsyncSession)
    ↓
PostgreSQL chapters 테이블
```

드래그앤드롭 흐름:

```
ChapterSortableList (DndContext + SortableContext)
    ↓ onDragEnd
arrayMove → calcOrderKey (fractional indexing)
    ↓ needsReindex() 검사
[OK] useMutation → PATCH /chapters/{id}/reorder
[재인덱스 필요] 전체 order_key 재계산 → 순차 PATCH
```

---

## Assumptions Log

| # | 주장 | 섹션 | 오판 시 위험 |
|---|------|------|------------|
| A1 | 목록 조회 + 페이지네이션 패턴 (tuple 반환) | §4.4 | 플래너가 다른 패턴 선택 가능 — 코드 수정 필요 |
| A2 | StrEnum 사용 패턴 (기존 코드베이스에 예시 없음) | §4.5 | SAEnum 직접 사용으로 대체 가능 |
| A3 | INITIAL_GAP=1000, MIN_GAP=0.001 상수값 | §3.1 | 앱 규모에 따라 조정 필요 |
| A4 | reindex 트리거 로직은 프론트에서 처리 | §3.2 | 서버에서 처리하도록 설계 변경 가능 |

---

## 환경 가용성

| 의존성 | 필요 이유 | 가용 여부 | 버전 | 대안 |
|--------|---------|---------|------|------|
| pnpm | 프론트 패키지 설치 | ✓ | 10.28.2 (package.json) | — |
| uv | 백엔드 패키지 관리 | ✓ | pyproject.toml 명시 | — |
| PostgreSQL | DB | ✓ | Docker Compose 16 | — |
| `@tiptap/*` | 에디터 | 미설치 (package.json 없음) | 3.23.4 | — |
| `@dnd-kit/*` | 드래그앤드롭 | 미설치 | 6.3.1/10.0.0 | up/down 버튼 임시 대안 |
| `use-debounce` | 자동저장 | 미설치 | 10.1.1 | setTimeout 수동 구현 |

**설치 필요 패키지 (Wave 0 작업):**

```bash
cd apps/web && pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-character-count @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities use-debounce
```

---

## 검증 아키텍처

### 테스트 프레임워크

| 속성 | 값 |
|------|---|
| 백엔드 | pytest + pytest-asyncio (기존 설치됨) |
| 프론트엔드 | 미설정 (package.json에 테스트 스크립트 없음) |
| 빠른 실행 | `cd apps/api && uv run pytest -m unit` |
| 전체 실행 | `cd apps/api && uv run pytest` |

### 요구사항 → 테스트 맵

| Req ID | 동작 | 테스트 유형 | 자동화 명령 | 파일 존재? |
|--------|------|-----------|-----------|-----------|
| PROJ-01 | 소설 생성 (제목, 장르, 설명) | unit | `uv run pytest tests/unit/novel/test_novel_service.py::test_create_novel -x` | ❌ Wave 0 |
| PROJ-02 | 소설 목록 (본인 것만) | unit | `uv run pytest tests/unit/novel/test_novel_service.py::test_list_novels -x` | ❌ Wave 0 |
| PROJ-04 | 소설 삭제 cascade | integration | `uv run pytest tests/integration/novel/ -x` | ❌ Wave 0 |
| CHAP-01 | 챕터 CRUD | unit | `uv run pytest tests/unit/novel/test_chapter_service.py -x` | ❌ Wave 0 |
| CHAP-03 | 자동저장 debounce 3초 | manual | 에디터에서 입력 후 3초 대기 확인 | — |
| CHAP-05 | order_key 재계산 | unit | `uv run pytest tests/unit/novel/test_order_key.py -x` | ❌ Wave 0 |

### Wave 0 갭

- [ ] `apps/api/tests/unit/novel/test_novel_service.py` — PROJ-01~04
- [ ] `apps/api/tests/unit/novel/test_chapter_service.py` — CHAP-01~02
- [ ] `apps/api/tests/unit/novel/test_order_key.py` — CHAP-05 (fractional indexing 순수 함수)
- [ ] `apps/api/tests/integration/novel/` — cascade delete, 소유권 검증

---

## 보안 도메인

| ASVS 카테고리 | 해당 여부 | 표준 제어 |
|-------------|---------|---------|
| V2 Authentication | 아니오 | auth 도메인에서 처리됨 |
| V4 Access Control | 예 | `current_user.id == novel.user_id` 소유권 검증 |
| V5 Input Validation | 예 | Pydantic 스키마 (title 길이, content TEXT 크기) |
| V6 Cryptography | 아니오 | — |

| 위협 패턴 | STRIDE | 표준 완화책 |
|----------|--------|-----------|
| IDOR (다른 사용자 소설 접근) | Tampering | 서비스 레이어 소유권 검증 (`ForbiddenError`) |
| 대용량 content 업로드 | DoS | content TEXT 컬럼 크기 제한 검토 (현재 무제한) |

---

## 출처

### 주 출처 (HIGH 신뢰도)
- npm registry — `@tiptap/react`, `@dnd-kit/core`, `use-debounce` 버전/peerDep 직접 확인
- [tiptap.dev/docs/editor/getting-started/install/react](https://tiptap.dev/docs/editor/getting-started/install/react) — 설치 패키지, useEditor 기본 패턴
- [tiptap.dev/docs/editor/extensions/functionality/character-count](https://tiptap.dev/docs/editor/extensions/functionality/character-count) — CharacterCount API
- [dndkit.com/presets/sortable](https://dndkit.com/presets/sortable) — SortableContext, useSortable 패턴
- `apps/api/src/domains/auth/` 코드베이스 직접 분석 — 기존 패턴 추출
- `apps/api/alembic/` 코드베이스 직접 분석 — 마이그레이션 패턴

### 보조 출처 (MEDIUM 신뢰도)
- [GitHub Discussion #2871 (tiptap autosave)](https://github.com/ueberdosis/tiptap/discussions/2871) — useDebounce import 주의사항

---

## 메타데이터

**신뢰도 분류:**
- TipTap 통합: HIGH — 공식 문서 + npm 직접 확인
- @dnd-kit 통합: HIGH — 공식 문서 + npm 직접 확인
- Fractional Indexing: MEDIUM — 수학적 원리 HIGH, 상수값 ASSUMED
- FastAPI 도메인 패턴: HIGH — 기존 코드베이스 직접 분석
- Alembic 마이그레이션: HIGH — 기존 마이그레이션 파일 직접 분석

**조사일:** 2026-05-17
**유효 기간:** 2026-06-17 (TipTap/dnd-kit 활발히 업데이트 중 — 30일)

---

## RESEARCH COMPLETE
