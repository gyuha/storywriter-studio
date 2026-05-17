import { useQuery } from '@tanstack/react-query';
import { apiGetChapter, apiGetChapters } from '../lib/chapter-api';

export function useChapters(novelId: string) {
  return useQuery({
    queryKey: ['chapters', novelId],
    queryFn: () => apiGetChapters(novelId),
    enabled: !!novelId,
  });
}

export function useChapter(novelId: string, chapterId: string) {
  return useQuery({
    queryKey: ['chapters', novelId, chapterId],
    queryFn: () => apiGetChapter(novelId, chapterId),
    enabled: !!novelId && !!chapterId,
  });
}
