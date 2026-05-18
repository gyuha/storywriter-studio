import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { EditorLayout } from '@/features/novel/components/editor-layout';
import { useNovel } from '@/features/novel/hooks/use-novel-queries';
import { useChapter } from '@/features/novel/hooks/use-chapter-queries';

export const Route = createFileRoute(
  '/_authenticated/novels/$novelId/chapters/$chapterId/edit'
)({
  component: ChapterEditPage,
});

function ChapterEditPage() {
  const { novelId, chapterId } = Route.useParams();
  const { data: novel, isLoading: novelLoading } = useNovel(novelId);
  const { data: chapter, isLoading: chapterLoading, isError } = useChapter(novelId, chapterId);

  if (novelLoading || chapterLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError || !chapter || !novel) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        챕터를 불러올 수 없습니다
      </div>
    );
  }

  return <EditorLayout novel={novel} chapter={chapter} novelId={novelId} chapterId={chapterId} />;
}
