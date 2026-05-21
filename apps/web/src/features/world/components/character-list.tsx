import { useEffect, useState } from 'react';
import { GitFork, Loader2, List, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useDeleteCharacterMutation } from '../hooks/use-world-mutations';
import { useCharacters } from '../hooks/use-world-queries';
import { useCharacterGraph } from '../hooks/use-character-graph';
import type { Character } from '../types/world';
import { CharacterFormModal } from './character-form-modal';
import { CharacterGraph } from './character-graph';
import { RelationshipList } from './relationship-list';

interface CharacterListProps {
  novelId: string;
}

export function CharacterList({ novelId }: CharacterListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Character | undefined>(undefined);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const { data: graphData } = useCharacterGraph(novelId, viewMode === 'graph');

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
        <div className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름으로 검색..."
            className="px-3 py-2 border rounded-md text-sm w-64"
            disabled={viewMode === 'graph'}
          />
          <div className="flex border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="목록 보기"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${viewMode === 'graph' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="관계 그래프"
            >
              <GitFork className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          캐릭터 추가
        </button>
      </div>

      {viewMode === 'graph' && (
        <CharacterGraph
          nodes={graphData?.nodes ?? []}
          edges={graphData?.edges ?? []}
        />
      )}

      {viewMode === 'list' && isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {viewMode === 'list' && isError && (
        <p className="text-sm text-destructive py-4">캐릭터 목록을 불러올 수 없습니다.</p>
      )}

      {viewMode === 'list' && !isLoading && !isError && characters && (
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
                      onClick={() =>
                        setSelectedCharacterId(
                          selectedCharacterId === c.id ? null : c.id
                        )
                      }
                      className={`p-1 rounded hover:bg-muted ${selectedCharacterId === c.id ? 'text-primary' : ''}`}
                      title="관계 보기"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>
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

      {selectedCharacterId && (
        <RelationshipList novelId={novelId} characterId={selectedCharacterId} />
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
