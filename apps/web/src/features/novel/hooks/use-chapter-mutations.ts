import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  apiCreateChapter,
  apiDeleteChapter,
  apiReorderChapter,
  apiUpdateChapter,
} from '../lib/chapter-api';
import type { ChapterUpdateInput } from '../lib/chapter-api';

export function useCreateChapterMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({
      novelId,
      data,
    }: {
      novelId: string;
      data: { title: string; content?: Record<string, unknown> | null };
    }) => apiCreateChapter(novelId, data),
    onSuccess: (chapter) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', chapter.novel_id] });
      navigate({
        to: '/novels/$novelId/chapters/$chapterId/edit',
        params: { novelId: chapter.novel_id, chapterId: chapter.id },
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateChapterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      novelId,
      chapterId,
      data,
    }: {
      novelId: string;
      chapterId: string;
      data: ChapterUpdateInput;
    }) => apiUpdateChapter(novelId, chapterId, data),
    onSuccess: (chapter) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', chapter.novel_id, chapter.id] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteChapterMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ novelId, chapterId }: { novelId: string; chapterId: string }) =>
      apiDeleteChapter(novelId, chapterId),
    onSuccess: (_: void, variables: { novelId: string; chapterId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.novelId] });
      navigate({ to: '/novels/$novelId', params: { novelId: variables.novelId } });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useReorderChapterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      novelId,
      chapterId,
      order_key,
    }: {
      novelId: string;
      chapterId: string;
      order_key: number;
    }) => apiReorderChapter(novelId, chapterId, order_key),
    onSuccess: (chapter) => {
      queryClient.invalidateQueries({ queryKey: ['chapters', chapter.novel_id] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
