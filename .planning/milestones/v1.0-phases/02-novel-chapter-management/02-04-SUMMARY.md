---
plan: "02-04"
status: completed
date: 2026-05-17
---

# 02-04 완료 요약: 챕터 사이드바 + 에디터 라우트 연결

## 완료된 작업

### Task 1: Fractional Indexing 유틸 + ChapterSortableList
- `lib/order-key.ts`: `calcOrderKey`, `needsReindex` 함수 구현 (INITIAL_GAP=1000, MIN_GAP=0.001)
- `components/chapter-sortable-list.tsx`: @dnd-kit DndContext + SortableContext + useSortable + arrayMove + calcOrderKey 연동. GripVertical 핸들 분리, 상태 select 각 아이템 내 통합
- `components/chapter-status-badge.tsx`: draft(회색)/reviewing(노랑)/done(초록) 3가지 배지

### Task 2: ChapterSidebar + 에디터 라우트 연결
- `components/chapter-sidebar.tsx`: 챕터 목록(ChapterSortableList), 상태 변경, 챕터 추가 버튼 완성
- `routes/.../edit.tsx`: placeholder div → `<ChapterSidebar novelId={novelId} currentChapterId={chapterId} />` 교체

## 수정 사항 (Task 2 완료 중 발견)

`chapter-sidebar.tsx`에서 상태 드롭다운이 `ChapterSortableList` 외부에 별도 루프로 렌더링되어 순서와 상태가 분리되는 UX 문제를 수정:
- `ChapterSortableList`에 `onStatusChange` prop 추가
- `SortableChapterItem` 안에 상태 select 통합 (드래그 핸들 + 제목 + 상태 드롭다운 한 아이템으로)
- `ChapterSidebar`의 별도 상태 루프 제거

## 검증 결과
- `pnpm typecheck`: 오류 없음
- `pnpm build`: 성공 (✓ built in 3.04s)
- Phase 2 Success Criteria 4개 항목 모두 달성
