// TODO: migrate to generated SDK once /novels/:id/story-beats endpoints are added to openapi.json
import type { StoryBeat } from '../types/beat';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetchBeats(novelId: string): Promise<StoryBeat[]> {
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('스토리 비트를 불러올 수 없습니다');
  return res.json() as Promise<StoryBeat[]>;
}

export async function apiCreateBeat(novelId: string, data: Partial<StoryBeat>): Promise<StoryBeat> {
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('생성 실패');
  return res.json() as Promise<StoryBeat>;
}

export async function apiUpdateBeat(
  novelId: string,
  beatId: string,
  data: Partial<StoryBeat>
): Promise<StoryBeat> {
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats/${beatId}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('수정 실패');
  return res.json() as Promise<StoryBeat>;
}

export async function apiDeleteBeat(novelId: string, beatId: string): Promise<void> {
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats/${beatId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('삭제 실패');
}
