import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/novels/$novelId/chapters/$chapterId/edit')({
  component: ChapterEditPage,
});

function ChapterEditPage() {
  return <div>Chapter editor — coming soon</div>;
}
