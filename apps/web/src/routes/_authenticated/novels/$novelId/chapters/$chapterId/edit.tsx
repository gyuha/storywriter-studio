import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useChapter } from '@/features/novel/hooks/use-chapter-queries';
import { ChapterEditor } from '@/features/novel/components/chapter-editor';
import { ChapterSidebar } from '@/features/novel/components/chapter-sidebar';

export const Route = createFileRoute(
  '/_authenticated/novels/$novelId/chapters/$chapterId/edit'
)({
  component: ChapterEditPage,
});

function ChapterEditPage() {
  const { novelId, chapterId } = Route.useParams();
  const { data: chapter, isLoading, isError } = useChapter(novelId, chapterId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        챕터를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ChapterSidebar novelId={novelId} currentChapterId={chapterId} />
      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b">
          <h1 className="text-lg font-semibold">{chapter.title}</h1>
        </div>
        <ChapterEditor
          novelId={novelId}
          chapterId={chapterId}
          initialContent={chapter.content}
        />
      </div>
    </div>
  );
}
