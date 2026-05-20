import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteLocationMutation } from '../hooks/use-world-mutations';
import { useLocations } from '../hooks/use-world-queries';
import type { Location } from '../types/world';
import { LocationFormModal } from './location-form-modal';

interface LocationListProps {
  novelId: string;
}

export function LocationList({ novelId }: LocationListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: locations, isLoading, isError } = useLocations(novelId, debouncedName || undefined);
  const deleteMutation = useDeleteLocationMutation(novelId);

  const handleEdit = (location: Location) => {
    setEditTarget(location);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleDelete = (location: Location) => {
    if (window.confirm(`'${location.name}'을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(location.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="이름으로 검색..."
          className="px-3 py-2 border rounded-md text-sm w-64"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          장소 추가
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive py-4">장소 목록을 불러올 수 없습니다.</p>
      )}

      {!isLoading && !isError && locations && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">이름</th>
              <th className="pb-2 font-medium">위치 관계</th>
              <th className="pb-2 font-medium">요약</th>
              <th className="pb-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  등록된 장소가 없습니다.
                </td>
              </tr>
            )}
            {locations.map((loc) => (
              <tr key={loc.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-medium">{loc.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{loc.location_relation ?? '-'}</td>
                <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">
                  {loc.summary ?? '-'}
                </td>
                <td className="py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(loc)}
                      className="p-1 rounded hover:bg-muted"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc)}
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

      <LocationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        novelId={novelId}
        location={editTarget}
      />
    </div>
  );
}
