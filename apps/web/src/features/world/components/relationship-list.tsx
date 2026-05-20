import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteRelationshipMutation } from '../hooks/use-world-mutations';
import { useCharacters, useRelationships } from '../hooks/use-world-queries';
import type { Relationship, RelationshipType } from '../types/world';
import { RelationshipFormModal } from './relationship-form-modal';

const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  lover: '연인',
  enemy: '적대',
  ally: '동료',
  family: '가족',
};

interface RelationshipListProps {
  novelId: string;
  characterId: string;
}

export function RelationshipList({ novelId, characterId }: RelationshipListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Relationship | undefined>(undefined);

  const { data: relationships, isLoading, isError } = useRelationships(novelId, characterId);
  const { data: characters } = useCharacters(novelId);
  const deleteMutation = useDeleteRelationshipMutation(novelId, characterId);

  const getCharacterName = (id: string) =>
    characters?.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  const handleEdit = (rel: Relationship) => {
    setEditTarget(rel);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleDelete = (rel: Relationship) => {
    if (window.confirm('이 관계를 삭제하시겠습니까?')) {
      deleteMutation.mutate(rel.id);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">인간관계</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-3 h-3" />
          관계 추가
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="text-xs text-destructive py-2">관계 목록을 불러올 수 없습니다.</p>
      )}

      {!isLoading && !isError && relationships && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-1.5 font-medium text-xs">방향</th>
              <th className="pb-1.5 font-medium text-xs">상대 캐릭터</th>
              <th className="pb-1.5 font-medium text-xs">유형</th>
              <th className="pb-1.5 font-medium text-xs">설명</th>
              <th className="pb-1.5 w-16" />
            </tr>
          </thead>
          <tbody>
            {relationships.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">
                  등록된 관계가 없습니다.
                </td>
              </tr>
            )}
            {relationships.map((rel) => (
              <tr key={rel.id} className="border-b hover:bg-muted/20">
                <td className="py-1.5 pr-3 text-xs font-mono">
                  {rel.direction === 'source' ? '→' : '←'}
                </td>
                <td className="py-1.5 pr-3 text-xs font-medium">
                  {getCharacterName(rel.other_character_id)}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground">
                  {RELATIONSHIP_TYPE_LABELS[rel.type]}
                </td>
                <td className="py-1.5 pr-3 text-xs text-muted-foreground max-w-[200px] truncate">
                  {rel.description ?? '-'}
                </td>
                <td className="py-1.5">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(rel)}
                      className="p-1 rounded hover:bg-muted"
                      title="수정"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(rel)}
                      className="p-1 rounded hover:bg-muted text-destructive"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RelationshipFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        novelId={novelId}
        characterId={characterId}
        relationship={editTarget}
      />
    </div>
  );
}
