import type { Chapter, ChapterStatus } from '../types/novel';

const BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token') ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? '오류가 발생했습니다');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface ChapterUpdateInput {
  title?: string;
  content?: Record<string, unknown> | null; // D-28: JSONB — NOT string
  status?: ChapterStatus;
}

export async function apiGetChapters(novelId: string): Promise<Chapter[]> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Chapter[]>(res);
}

export async function apiCreateChapter(
  novelId: string,
  data: { title: string; content?: Record<string, unknown> | null }
): Promise<Chapter> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Chapter>(res);
}

export async function apiGetChapter(novelId: string, chapterId: string): Promise<Chapter> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters/${chapterId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Chapter>(res);
}

export async function apiUpdateChapter(
  novelId: string,
  chapterId: string,
  data: ChapterUpdateInput
): Promise<Chapter> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters/${chapterId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Chapter>(res);
}

export async function apiReorderChapter(
  novelId: string,
  chapterId: string,
  order_key: number
): Promise<Chapter> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters/${chapterId}/reorder`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ order_key }),
  });
  return handleResponse<Chapter>(res);
}

export async function apiDeleteChapter(novelId: string, chapterId: string): Promise<void> {
  const res = await fetch(`${BASE}/novels/${novelId}/chapters/${chapterId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}
