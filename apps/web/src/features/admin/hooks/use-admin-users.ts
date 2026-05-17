import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PaginatedUsersResponse } from '../types/admin';

const BASE = '/api/v1';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAdminUsers(params: { page: number; size: number }) {
  return useQuery<PaginatedUsersResponse>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/users?page=${params.page}&size=${params.size}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? '사용자 목록을 불러오지 못했습니다',
        );
      }
      return res.json() as Promise<PaginatedUsersResponse>;
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${BASE}/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? '활성화에 실패했습니다');
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
      const res = await fetch(`${BASE}/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? '비활성화에 실패했습니다');
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
