import {
  createNovelApiV1NovelsPost,
  deleteNovelApiV1NovelsNovelIdDelete,
  getNovelApiV1NovelsNovelIdGet,
  listNovelsApiV1NovelsGet,
  updateNovelApiV1NovelsNovelIdPut,
} from '@/generated/sdk.gen';
import type { Novel, NovelCreateInput, NovelListResponse, NovelUpdateInput } from '../types/novel';

function throwOnError(error: unknown): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? '오류가 발생했습니다');
  }
  throw new Error('오류가 발생했습니다');
}

export async function apiGetNovels(offset = 0, limit = 20): Promise<NovelListResponse> {
  const { data, error } = await listNovelsApiV1NovelsGet({ query: { offset, limit } });
  if (error) throwOnError(error);
  return data as NovelListResponse;
}

export async function apiCreateNovel(body: NovelCreateInput): Promise<Novel> {
  const { data, error } = await createNovelApiV1NovelsPost({ body });
  if (error) throwOnError(error);
  return data as Novel;
}

export async function apiGetNovel(id: string): Promise<Novel> {
  const { data, error } = await getNovelApiV1NovelsNovelIdGet({ path: { novel_id: id } });
  if (error) throwOnError(error);
  return data as Novel;
}

export async function apiUpdateNovel(id: string, body: NovelUpdateInput): Promise<Novel> {
  const { data, error } = await updateNovelApiV1NovelsNovelIdPut({
    path: { novel_id: id },
    body,
  });
  if (error) throwOnError(error);
  return data as Novel;
}

export async function apiDeleteNovel(id: string): Promise<void> {
  const { error } = await deleteNovelApiV1NovelsNovelIdDelete({ path: { novel_id: id } });
  if (error) throwOnError(error);
}

export interface ChapterStat {
  id: string;
  title: string;
  char_count: number;
  updated_at: string | null;
}

export interface NovelStats {
  total_chars: number;
  chapter_count: number;
  chapters: ChapterStat[];
}

export async function apiGetNovelStats(novelId: string): Promise<NovelStats> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/v1/novels/${novelId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('통계를 불러올 수 없습니다');
  return res.json() as Promise<NovelStats>;
}
