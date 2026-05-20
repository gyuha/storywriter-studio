import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteCharacterMutation } from '../hooks/use-world-mutations';
import { useCharacters } from '../hooks/use-world-queries';
import type { Character } from '../types/world';
import { CharacterFormModal } from './character-form-modal';

interface CharacterListProps {
  novelId: string;
}

export function CharacterList({ novelId }: CharacterListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Character | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: characters, isLoading, isError } = useCharacters(novelId, debouncedName || undefined);
  const deleteMutation = useDeleteCharacterMutation(novelId);

  const handleEdit = (character: Character) => {
    setEditTarget(character);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleDelete = (character: Character) => {
    if (window.confirm(`'${character.name}'을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(character.id);
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
          캐릭터 추가
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive py-4">캐릭터 목록을 불러올 수 없습니다.</p>
      )}

      {!isLoading && !isError && characters && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">이름</th>
              <th className="pb-2 font-medium">역할</th>
              <th className="pb-2 font-medium">요약</th>
              <th className="pb-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {characters.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  등록된 캐릭터가 없습니다.
                </td>
              </tr>
            )}
            {characters.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-medium">{c.name}</td>
                <td className="py-2 pr-4 text-muted-foreground">{c.role ?? '-'}</td>
                <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">
                  {c.summary ?? '-'}
                </td>
                <td className="py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1 rounded hover:bg-muted"
                      title="수정"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
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

      <CharacterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        novelId={novelId}
        character={editTarget}
      />
    </div>
  );
}
