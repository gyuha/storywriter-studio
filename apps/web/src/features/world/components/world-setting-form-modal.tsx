import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateWorldSettingMutation,
  useUpdateWorldSettingMutation,
} from '../hooks/use-world-mutations';
import type { WorldSetting, WorldSettingType } from '../types/world';

const WORLD_SETTING_TYPE_LABELS: Record<WorldSettingType, string> = {
  magic_system: '마법 체계',
  nation_faction: '국가/세력',
  history: '역사',
  rule: '규칙',
};

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(255),
  type: z.enum(['magic_system', 'nation_faction', 'history', 'rule'] as const),
  content: z
    .string()
    .default('{}')
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: '유효한 JSON 형식이 아닙니다' }
    ),
  summary: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface WorldSettingFormModalProps {
  open: boolean;
  onClose: () => void;
  novelId: string;
  worldSetting?: WorldSetting;
}

export function WorldSettingFormModal({
  open,
  onClose,
  novelId,
  worldSetting,
}: WorldSettingFormModalProps) {
  const isEdit = !!worldSetting;
  const createMutation = useCreateWorldSettingMutation(novelId);
  const updateMutation = useUpdateWorldSettingMutation(novelId);
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
        name: worldSetting?.name ?? '',
        type: worldSetting?.type ?? 'magic_system',
        content: worldSetting ? JSON.stringify(worldSetting.content, null, 2) : '{}',
        summary: worldSetting?.summary ?? '',
      });
    }
  }, [open, worldSetting, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = { ...data, content: JSON.parse(data.content) as Record<string, unknown> };
    if (isEdit && worldSetting) {
      await updateMutation.mutateAsync({ id: worldSetting.id, data: payload });
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
          {isEdit ? '세계관 설정 수정' : '세계관 설정 추가'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">이름 *</label>
            <input
              {...register('name')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              placeholder="설정 이름"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">유형 *</label>
            <select
              {...register('type')}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
            >
              {(Object.keys(WORLD_SETTING_TYPE_LABELS) as WorldSettingType[]).map((t) => (
                <option key={t} value={t}>
                  {WORLD_SETTING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">내용 (JSON)</label>
            <textarea
              {...register('content')}
              rows={5}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none font-mono"
              placeholder='{}'
            />
            {errors.content && (
              <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
            )}
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
