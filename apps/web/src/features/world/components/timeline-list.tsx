import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteTimelineMutation } from '../hooks/use-world-mutations';
import { useTimelines } from '../hooks/use-world-queries';
import type { Timeline } from '../types/world';
import { TimelineFormModal } from './timeline-form-modal';

interface TimelineListProps {
  novelId: string;
}

export function TimelineList({ novelId }: TimelineListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Timeline | undefined>(undefined);

  const { data: timelines, isLoading, isError } = useTimelines(novelId);
  const deleteMutation = useDeleteTimelineMutation(novelId);

  const handleEdit = (timeline: Timeline) => {
    setEditTarget(timeline);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleDelete = (timeline: Timeline) => {
    if (window.confirm(`'${timeline.event_name}'을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(timeline.id);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          항목 추가
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive py-4">시간표 목록을 불러올 수 없습니다.</p>
      )}

      {!isLoading && !isError && timelines && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">사건명</th>
              <th className="pb-2 font-medium">날짜/시기</th>
              <th className="pb-2 font-medium">연결 챕터</th>
              <th className="pb-2 font-medium">설명</th>
              <th className="pb-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {timelines.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  등록된 시간표 항목이 없습니다.
                </td>
              </tr>
            )}
            {timelines.map((t) => (
              <tr key={t.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-medium">{t.event_name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{t.event_date ?? '-'}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {t.chapter_id ? '연결됨' : '-'}
                </td>
                <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">
                  {t.description ?? '-'}
                </td>
                <td className="py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1 rounded hover:bg-muted"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1 rounded hover:bg-muted text-destructive"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <TimelineFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        novelId={novelId}
        timeline={editTarget}
      />
    </div>
  );
}
