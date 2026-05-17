import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useNovels } from '@/features/novel/hooks/use-novel-queries';
import { useDeleteNovelMutation } from '@/features/novel/hooks/use-novel-mutations';
import { NovelCard } from '@/features/novel/components/novel-card';
import { NovelCreateModal } from '@/features/novel/components/novel-create-modal';
import { NovelEditModal } from '@/features/novel/components/novel-edit-modal';
import type { Novel } from '@/features/novel/types/novel';

export const Route = createFileRoute('/_authenticated/novels/')({
  component: NovelsPage,
});

function NovelsPage() {
  const { data, isLoading } = useNovels();
  const deleteMutation = useDeleteNovelMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editNovel, setEditNovel] = useState<Novel | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까? 모든 챕터도 삭제됩니다.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">내 소설</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" />
          새 소설 만들기
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 소설이 없습니다. 첫 소설을 만들어 보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onEdit={() => setEditNovel(novel)}
              onDelete={() => handleDelete(novel.id)}
            />
          ))}
        </div>
      )}

      <NovelCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editNovel && (
        <NovelEditModal novel={editNovel} open={!!editNovel} onClose={() => setEditNovel(null)} />
      )}
    </div>
  );
}
