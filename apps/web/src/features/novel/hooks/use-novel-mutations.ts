import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { apiCreateNovel, apiDeleteNovel, apiUpdateNovel } from '../lib/novel-api';
import type { Novel, NovelCreateInput, NovelUpdateInput } from '../types/novel';

export function useCreateNovelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NovelCreateInput) => apiCreateNovel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
      toast.success('소설이 생성되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateNovelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NovelUpdateInput }) => apiUpdateNovel(id, data),
    onSuccess: (novel: Novel) => {
      queryClient.invalidateQueries({ queryKey: ['novels', novel.id] });
      queryClient.invalidateQueries({ queryKey: ['novels'] });
      toast.success('수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteNovelMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: string) => apiDeleteNovel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
      toast.success('삭제되었습니다');
      navigate({ to: '/novels' });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
