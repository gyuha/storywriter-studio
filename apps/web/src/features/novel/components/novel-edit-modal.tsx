import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateNovelMutation } from '../hooks/use-novel-mutations';
import type { Novel } from '../types/novel';

const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(255),
  genre: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface NovelEditModalProps {
  novel: Novel;
  open: boolean;
  onClose: () => void;
}

export function NovelEditModal({ novel, open, onClose }: NovelEditModalProps) {
  const mutation = useUpdateNovelMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: novel.title,
      genre: novel.genre ?? '',
      description: novel.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ title: novel.title, genre: novel.genre ?? '', description: novel.description ?? '' });
    }
  }, [open, novel, reset]);

  const onSubmit = async (data: FormValues) => {
    await mutation.mutateAsync({ id: novel.id, data });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">소설 수정</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">제목 *</label>
            <input
              {...register('title')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">장르</label>
            <input
              {...register('genre')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
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
              {mutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
