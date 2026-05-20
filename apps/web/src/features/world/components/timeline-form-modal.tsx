import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChapters } from '@/features/novel/hooks/use-chapter-queries';
import {
  useCreateTimelineMutation,
  useUpdateTimelineMutation,
} from '../hooks/use-world-mutations';
import type { Timeline } from '../types/world';

const schema = z.object({
  event_name: z.string().min(1, '사건명을 입력해주세요').max(255),
  event_date: z.string().optional(),
  description: z.string().optional(),
  chapter_id: z.string().optional(),
  summary: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface TimelineFormModalProps {
  open: boolean;
  onClose: () => void;
  novelId: string;
  timeline?: Timeline;
}

export function TimelineFormModal({
  open,
  onClose,
  novelId,
  timeline,
}: TimelineFormModalProps) {
  const isEdit = !!timeline;
  const createMutation = useCreateTimelineMutation(novelId);
  const updateMutation = useUpdateTimelineMutation(novelId);
  const mutation = isEdit ? updateMutation : createMutation;
  const { data: chapters } = useChapters(novelId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        event_name: timeline?.event_name ?? '',
        event_date: timeline?.event_date ?? '',
        description: timeline?.description ?? '',
        chapter_id: timeline?.chapter_id ?? '',
        summary: timeline?.summary ?? '',
      });
    }
  }, [open, timeline, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      chapter_id: data.chapter_id || undefined,
    };
    if (isEdit && timeline) {
      await updateMutation.mutateAsync({ id: timeline.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? '시간표 항목 수정' : '시간표 항목 추가'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">사건명 *</label>
            <input
              {...register('event_name')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="사건 이름"
            />
            {errors.event_name && (
              <p className="text-xs text-destructive mt-1">{errors.event_name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">날짜/시기</label>
            <input
              {...register('event_date')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="예: 3년 전, 1화 직후, 왕국력 300년..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">연결 챕터</label>
            <select
              {...register('chapter_id')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="">챕터 없음</option>
              {chapters?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="사건 상세 설명"
            />
          </div>
          <div>
            <label className="text-sm font-medium">요약</label>
            <textarea
              {...register('summary')}
              rows={2}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="한 줄 요약"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
