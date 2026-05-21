import { useQuery } from '@tanstack/react-query';
import type { RelationshipType } from '../types/world';

export interface GraphNode {
  id: string;
  name: string;
  role: string | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  description: string | null;
}

export interface CharacterGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// TODO: migrate to generated SDK once /novels/:id/graph endpoint is added to openapi.json
async function fetchCharacterGraph(novelId: string): Promise<CharacterGraph> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/v1/novels/${novelId}/graph`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('그래프를 불러올 수 없습니다');
  return res.json() as Promise<CharacterGraph>;
}

export function useCharacterGraph(novelId: string, enabled = true) {
  return useQuery({
    queryKey: ['novels', novelId, 'graph'],
    queryFn: () => fetchCharacterGraph(novelId),
    enabled: !!novelId && enabled,
  });
}
