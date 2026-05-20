import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCharacterMutation, useUpdateCharacterMutation } from '../hooks/use-world-mutations';
import type { Character } from '../types/world';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(255),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  role: z.string().max(100).optional(),
  summary: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface CharacterFormModalProps {
  open: boolean;
  onClose: () => void;
  novelId: string;
  character?: Character;
}

export function CharacterFormModal({ open, onClose, novelId, character }: CharacterFormModalProps) {
  const isEdit = !!character;
  const createMutation = useCreateCharacterMutation(novelId);
  const updateMutation = useUpdateCharacterMutation(novelId);
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
        name: character?.name ?? '',
        appearance: character?.appearance ?? '',
        personality: character?.personality ?? '',
        background: character?.background ?? '',
        role: character?.role ?? '',
        summary: character?.summary ?? '',
      });
    }
  }, [open, character, reset]);

  const onSubmit = async (data: FormValues) => {
    if (isEdit && character) {
      await updateMutation.mutateAsync({ id: character.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? '캐릭터 수정' : '캐릭터 추가'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">이름 *</label>
            <input
              {...register('name')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="캐릭터 이름"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">역할</label>
            <input
              {...register('role')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="주인공, 조력자..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">외형</label>
            <textarea
              {...register('appearance')}
              rows={2}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="외모, 복장 등"
            />
          </div>
          <div>
            <label className="text-sm font-medium">성격</label>
            <textarea
              {...register('personality')}
              rows={2}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="성격, 가치관 등"
            />
          </div>
          <div>
            <label className="text-sm font-medium">배경</label>
            <textarea
              {...register('background')}
              rows={2}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="출생, 과거 등"
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
