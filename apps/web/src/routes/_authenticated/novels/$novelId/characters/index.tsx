import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { CharactersPage } from '@/features/novel/components/characters-page';
import { useNovel } from '@/features/novel/hooks/use-novel-queries';

export const Route = createFileRoute('/_authenticated/novels/$novelId/characters/')({
  component: CharactersPageRoute,
});

function CharactersPageRoute() {
  const { novelId } = Route.useParams();
  const { data: novel, isLoading, isError } = useNovel(novelId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError || !novel) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        소설을 불러올 수 없습니다
      </div>
    );
  }

  return <CharactersPage novel={novel} />;
}
