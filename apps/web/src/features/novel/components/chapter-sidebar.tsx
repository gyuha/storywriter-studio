import { useNavigate } from '@tanstack/react-router';
import { Loader2, Plus } from 'lucide-react';
import { useChapters } from '../hooks/use-chapter-queries';
import {
  useCreateChapterMutation,
  useReorderChapterMutation,
  useUpdateChapterMutation,
} from '../hooks/use-chapter-mutations';
import { ChapterSortableList } from './chapter-sortable-list';
import type { ChapterStatus } from '../types/novel';

interface ChapterSidebarProps {
  novelId: string;
  currentChapterId: string;
}

export function ChapterSidebar({ novelId, currentChapterId }: ChapterSidebarProps) {
  const navigate = useNavigate();
  const { data: chapters, isLoading, isError } = useChapters(novelId);
  const reorderMutation = useReorderChapterMutation();
  const createMutation = useCreateChapterMutation();
  const updateMutation = useUpdateChapterMutation();

  const handleReorder = (activeId: string, newOrderKey: number) => {
    reorderMutation.mutate({ novelId, chapterId: activeId, order_key: newOrderKey });
  };

  const handleChapterClick = (chapter: { id: string }) => {
    navigate({
      to: '/novels/$novelId/chapters/$chapterId/edit',
      params: { novelId, chapterId: chapter.id },
    });
  };

  const handleAddChapter = () => {
    const chapterNum = (chapters?.length ?? 0) + 1;
    createMutation.mutate({ novelId, data: { title: `챕터 ${chapterNum}` } });
  };

  const handleStatusChange = (chapterId: string, status: ChapterStatus) => {
    updateMutation.mutate({ novelId, chapterId, data: { status } });
  };

  return (
    <div className="h-full w-64 border-r flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold text-foreground">챕터 목록</h2>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-xs text-destructive px-4">챕터를 불러올 수 없습니다</p>
        ) : chapters && chapters.length > 0 ? (
          <div className="px-2">
            <ChapterSortableList
              chapters={chapters}
              currentChapterId={currentChapterId}
              novelId={novelId}
              onReorder={handleReorder}
              onChapterClick={handleChapterClick}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground px-4">챕터가 없습니다</p>
        )}
      </div>

      {/* Add chapter button */}
      <div className="border-t p-3">
        <button
          type="button"
          onClick={handleAddChapter}
          disabled={createMutation.isPending}
          className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-md hover:bg-muted disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {createMutation.isPending ? '생성 중...' : '+ 챕터 추가'}
        </button>
      </div>
    </div>
  );
}
