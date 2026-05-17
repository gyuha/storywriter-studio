import {
  createChapterApiV1NovelsNovelIdChaptersPost,
  deleteChapterApiV1NovelsNovelIdChaptersChapterIdDelete,
  getChapterApiV1NovelsNovelIdChaptersChapterIdGet,
  listChaptersApiV1NovelsNovelIdChaptersGet,
  reorderChapterApiV1NovelsNovelIdChaptersChapterIdReorderPatch,
  updateChapterApiV1NovelsNovelIdChaptersChapterIdPut,
} from '@/generated/sdk.gen';
import type { Chapter, ChapterStatus } from '../types/novel';

export interface ChapterUpdateInput {
  title?: string;
  content?: Record<string, unknown> | null;
  status?: ChapterStatus;
}

function throwOnError(error: unknown): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? '오류가 발생했습니다');
  }
  throw new Error('오류가 발생했습니다');
}

export async function apiGetChapters(novelId: string): Promise<Chapter[]> {
  const { data, error } = await listChaptersApiV1NovelsNovelIdChaptersGet({
    path: { novel_id: novelId },
  });
  if (error) throwOnError(error);
  return (data ?? []) as Chapter[];
}

export async function apiCreateChapter(
  novelId: string,
  body: { title: string; content?: Record<string, unknown> | null },
): Promise<Chapter> {
  const { data, error } = await createChapterApiV1NovelsNovelIdChaptersPost({
    path: { novel_id: novelId },
    body,
  });
  if (error) throwOnError(error);
  return data as Chapter;
}

export async function apiGetChapter(novelId: string, chapterId: string): Promise<Chapter> {
  const { data, error } = await getChapterApiV1NovelsNovelIdChaptersChapterIdGet({
    path: { novel_id: novelId, chapter_id: chapterId },
  });
  if (error) throwOnError(error);
  return data as Chapter;
}

export async function apiUpdateChapter(
  novelId: string,
  chapterId: string,
  body: ChapterUpdateInput,
): Promise<Chapter> {
  const { data, error } = await updateChapterApiV1NovelsNovelIdChaptersChapterIdPut({
    path: { novel_id: novelId, chapter_id: chapterId },
    body,
  });
  if (error) throwOnError(error);
  return data as Chapter;
}

export async function apiReorderChapter(
  novelId: string,
  chapterId: string,
  order_key: number,
): Promise<Chapter> {
  const { data, error } = await reorderChapterApiV1NovelsNovelIdChaptersChapterIdReorderPatch({
    path: { novel_id: novelId, chapter_id: chapterId },
    body: { order_key },
  });
  if (error) throwOnError(error);
  return data as Chapter;
}

export async function apiDeleteChapter(novelId: string, chapterId: string): Promise<void> {
  const { error } = await deleteChapterApiV1NovelsNovelIdChaptersChapterIdDelete({
    path: { novel_id: novelId, chapter_id: chapterId },
  });
  if (error) throwOnError(error);
}
