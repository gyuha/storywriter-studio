import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  activateUserApiV1AdminUsersUserIdActivatePost,
  deactivateUserApiV1AdminUsersUserIdDeactivatePost,
  listUsersApiV1AdminUsersGet,
} from '@/generated/sdk.gen';
import type { PaginatedUsersResponse } from '../types/admin';

export function useAdminUsers(params: { page: number; size: number }) {
  return useQuery<PaginatedUsersResponse>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data, error } = await listUsersApiV1AdminUsersGet({
        query: { page: params.page, size: params.size },
      });
      if (error) {
        throw new Error(
          (error as { detail?: string }).detail ?? '사용자 목록을 불러오지 못했습니다',
        );
      }
      return data as PaginatedUsersResponse;
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await activateUserApiV1AdminUsersUserIdActivatePost({
        path: { user_id: userId },
      });
      if (error) {
        throw new Error((error as { detail?: string }).detail ?? '활성화에 실패했습니다');
      }
    },
    onSuccess: () => {
      toast.success('계정이 활성화되었습니다');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await deactivateUserApiV1AdminUsersUserIdDeactivatePost({
        path: { user_id: userId },
      });
      if (error) {
        throw new Error((error as { detail?: string }).detail ?? '비활성화에 실패했습니다');
      }
    },
    onSuccess: () => {
      toast.success('계정이 비활성화되었습니다');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
