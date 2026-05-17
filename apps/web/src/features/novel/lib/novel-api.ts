import type { Novel, NovelCreateInput, NovelListResponse, NovelUpdateInput } from '../types/novel';

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

export async function apiGetNovels(offset = 0, limit = 20): Promise<NovelListResponse> {
  const res = await fetch(`${BASE}/novels?offset=${offset}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<NovelListResponse>(res);
}

export async function apiCreateNovel(data: NovelCreateInput): Promise<Novel> {
  const res = await fetch(`${BASE}/novels`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Novel>(res);
}

export async function apiGetNovel(id: string): Promise<Novel> {
  const res = await fetch(`${BASE}/novels/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Novel>(res);
}

export async function apiUpdateNovel(id: string, data: NovelUpdateInput): Promise<Novel> {
  const res = await fetch(`${BASE}/novels/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Novel>(res);
}

export async function apiDeleteNovel(id: string): Promise<void> {
  const res = await fetch(`${BASE}/novels/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}
