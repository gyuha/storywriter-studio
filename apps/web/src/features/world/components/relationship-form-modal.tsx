import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCharacters } from '../hooks/use-world-queries';
import {
  useCreateRelationshipMutation,
  useUpdateRelationshipMutation,
} from '../hooks/use-world-mutations';
import type { Relationship, RelationshipType } from '../types/world';

const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  lover: '연인',
  enemy: '적대',
  ally: '동료',
  family: '가족',
};

const schema = z.object({
  character_id_b: z.string().min(1, '상대 캐릭터를 선택해주세요'),
  type: z.enum(['lover', 'enemy', 'ally', 'family'] as const),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface RelationshipFormModalProps {
  open: boolean;
  onClose: () => void;
  novelId: string;
  characterId: string;
  relationship?: Relationship;
}

export function RelationshipFormModal({
  open,
  onClose,
  novelId,
  characterId,
  relationship,
}: RelationshipFormModalProps) {
  const isEdit = !!relationship;
  const createMutation = useCreateRelationshipMutation(novelId, characterId);
  const updateMutation = useUpdateRelationshipMutation(novelId, characterId);
  const mutation = isEdit ? updateMutation : createMutation;
  const { data: characters } = useCharacters(novelId);
  const otherCharacters = characters?.filter((c) => c.id !== characterId) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        character_id_b: relationship?.other_character_id ?? '',
        type: relationship?.type ?? 'ally',
        description: relationship?.description ?? '',
      });
    }
  }, [open, relationship, reset]);

  const onSubmit = async (data: FormValues) => {
    if (isEdit && relationship) {
      await updateMutation.mutateAsync({
        id: relationship.id,
        data: { type: data.type, description: data.description },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? '관계 수정' : '관계 추가'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">상대 캐릭터 *</label>
            <select
              {...register('character_id_b')}
              disabled={isEdit}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background disabled:opacity-50"
            >
              <option value="">캐릭터 선택</option>
              {otherCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.character_id_b && (
              <p className="text-xs text-destructive mt-1">{errors.character_id_b.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">관계 유형 *</label>
            <select
              {...register('type')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              {(Object.keys(RELATIONSHIP_TYPE_LABELS) as RelationshipType[]).map((t) => (
                <option key={t} value={t}>
                  {RELATIONSHIP_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              placeholder="관계에 대한 설명"
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
