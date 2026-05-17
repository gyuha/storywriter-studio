import { useQuery } from '@tanstack/react-query';
import { apiGetNovel, apiGetNovels } from '../lib/novel-api';

export function useNovels(offset = 0, limit = 20) {
  return useQuery({
    queryKey: ['novels', offset, limit],
    queryFn: () => apiGetNovels(offset, limit),
  });
}

export function useNovel(id: string) {
  return useQuery({
    queryKey: ['novels', id],
    queryFn: () => apiGetNovel(id),
    enabled: !!id,
  });
}
