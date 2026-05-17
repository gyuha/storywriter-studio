import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Chapter, ChapterStatus } from '../types/novel';
import { calcOrderKey, needsReindex } from '../lib/order-key';
import { cn } from '@/lib/utils';

interface ChapterSortableListProps {
  chapters: Chapter[];
  currentChapterId: string;
  novelId: string;
  onReorder: (activeId: string, newOrderKey: number) => void;
  onChapterClick: (chapter: Chapter) => void;
  onStatusChange: (chapterId: string, status: ChapterStatus) => void;
}

const STATUS_OPTIONS: { value: ChapterStatus; label: string }[] = [
  { value: 'draft', label: '초안' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'done', label: '완성' },
];

function SortableChapterItem({
  chapter,
  isCurrent,
  onChapterClick,
  onStatusChange,
}: {
  chapter: Chapter;
  isCurrent: boolean;
  onChapterClick: (chapter: Chapter) => void;
  onStatusChange: (chapterId: string, status: ChapterStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col px-3 py-2 rounded-md hover:bg-muted',
        isCurrent && 'bg-primary/10 border-l-2 border-primary'
      )}
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChapterClick(chapter)}>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-sm truncate flex-1">{chapter.title}</span>
      </div>
      <div className="mt-1 pl-6">
        <select
          value={chapter.status}
          onChange={(e) => onStatusChange(chapter.id, e.target.value as ChapterStatus)}
          className="w-full text-xs border rounded px-1 py-0.5 bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ChapterSortableList({
  chapters,
  currentChapterId,
  novelId: _novelId,
  onReorder,
  onChapterClick,
  onStatusChange,
}: ChapterSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);

    if (needsReindex(reordered)) {
      console.warn('order_key 재인덱싱 필요 — MVP 단계에서는 수동 대응');
    }

    const newOrderKey = calcOrderKey(reordered, newIndex);
    onReorder(String(active.id), newOrderKey);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {chapters.map((chapter) => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              isCurrent={chapter.id === currentChapterId}
              onChapterClick={onChapterClick}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
