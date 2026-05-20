import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteWorldSettingMutation } from '../hooks/use-world-mutations';
import { useWorldSettings } from '../hooks/use-world-queries';
import type { WorldSetting, WorldSettingType } from '../types/world';
import { WorldSettingFormModal } from './world-setting-form-modal';

const TYPE_LABELS: Record<WorldSettingType, string> = {
  magic_system: '마법 체계',
  nation_faction: '국가/세력',
  history: '역사',
  rule: '규칙',
};

interface WorldSettingListProps {
  novelId: string;
}

export function WorldSettingList({ novelId }: WorldSettingListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [searchType, setSearchType] = useState<WorldSettingType | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorldSetting | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: worldSettings, isLoading, isError } = useWorldSettings(
    novelId,
    debouncedName || undefined,
    searchType || undefined
  );
  const deleteMutation = useDeleteWorldSettingMutation(novelId);

  const handleEdit = (ws: WorldSetting) => {
    setEditTarget(ws);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleDelete = (ws: WorldSetting) => {
    if (window.confirm(`'${ws.name}'을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(ws.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름으로 검색..."
            className="px-3 py-2 border rounded-md text-sm w-48"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as WorldSettingType | '')}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="">전체 유형</option>
            {(Object.keys(TYPE_LABELS) as WorldSettingType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          설정 추가
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive py-4">세계관 설정 목록을 불러올 수 없습니다.</p>
      )}

      {!isLoading && !isError && worldSettings && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">이름</th>
              <th className="pb-2 font-medium">유형</th>
              <th className="pb-2 font-medium">요약</th>
              <th className="pb-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {worldSettings.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  등록된 세계관 설정이 없습니다.
                </td>
              </tr>
            )}
            {worldSettings.map((ws) => (
              <tr key={ws.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-medium">{ws.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{TYPE_LABELS[ws.type]}</td>
                <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">
                  {ws.summary ?? '-'}
                </td>
                <td className="py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(ws)}
                      className="p-1 rounded hover:bg-muted"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ws)}
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

      <WorldSettingFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        novelId={novelId}
        worldSetting={editTarget}
      />
    </div>
  );
}
