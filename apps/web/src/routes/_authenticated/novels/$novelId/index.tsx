import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useNovel } from '@/features/novel/hooks/use-novel-queries';
import { useDeleteNovelMutation } from '@/features/novel/hooks/use-novel-mutations';
import { NovelEditModal } from '@/features/novel/components/novel-edit-modal';

export const Route = createFileRoute('/_authenticated/novels/$novelId/')({
  component: NovelDetailPage,
});

function NovelDetailPage() {
  const { novelId } = Route.useParams();
  const { data: novel, isLoading, isError } = useNovel(novelId);
  const deleteMutation = useDeleteNovelMutation();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까? 모든 챕터도 삭제됩니다.')) {
      deleteMutation.mutate(novelId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError || !novel) {
    return <div className="text-center py-12 text-destructive">소설을 불러올 수 없습니다</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{novel.title}</h1>
          {novel.genre && <p className="text-muted-foreground mt-1">{novel.genre}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
          >
            <Pencil className="w-4 h-4" /> 수정
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </button>
        </div>
      </div>

      {novel.description && <p className="text-muted-foreground mb-6">{novel.description}</p>}

      <div className="text-sm text-muted-foreground">
        <p>챕터 목록은 에디터에서 확인하세요</p>
      </div>

      {editOpen && (
        <NovelEditModal novel={novel} open={editOpen} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
