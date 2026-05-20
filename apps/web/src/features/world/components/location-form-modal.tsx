import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLocationMutation, useUpdateLocationMutation } from '../hooks/use-world-mutations';
import type { Location } from '../types/world';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(255),
  description: z.string().optional(),
  location_relation: z.string().optional(),
  summary: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  novelId: string;
  location?: Location;
}

export function LocationFormModal({ open, onClose, novelId, location }: LocationFormModalProps) {
  const isEdit = !!location;
  const createMutation = useCreateLocationMutation(novelId);
  const updateMutation = useUpdateLocationMutation(novelId);
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        name: location?.name ?? '',
        description: location?.description ?? '',
        location_relation: location?.location_relation ?? '',
        summary: location?.summary ?? '',
      });
    }
  }, [open, location, reset]);

  const onSubmit = async (data: FormValues) => {
    if (isEdit && location) {
      await updateMutation.mutateAsync({ id: location.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? '장소 수정' : '장소 추가'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">이름 *</label>
            <input
              {...register('name')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="장소 이름"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="장소에 대한 설명"
            />
          </div>
          <div>
            <label className="text-sm font-medium">위치 관계</label>
            <input
              {...register('location_relation')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="예: 왕국 북부, 수도 남쪽 등"
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
