import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  apiCreateCharacter,
  apiCreateLocation,
  apiCreateWorldSetting,
  apiDeleteCharacter,
  apiDeleteLocation,
  apiDeleteWorldSetting,
  apiUpdateCharacter,
  apiUpdateLocation,
  apiUpdateWorldSetting,
} from '../lib/world-api';
import type {
  CharacterCreateInput,
  CharacterUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
  WorldSettingCreateInput,
  WorldSettingUpdateInput,
} from '../types/world';

// ── Character ─────────────────────────────────────────────────────────────────

export function useCreateCharacterMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterCreateInput) => apiCreateCharacter(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'characters'] });
      toast.success('캐릭터가 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateCharacterMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CharacterUpdateInput }) =>
      apiUpdateCharacter(novelId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'characters'] });
      toast.success('캐릭터가 수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteCharacterMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteCharacter(novelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'characters'] });
      toast.success('캐릭터가 삭제되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

// ── Location ──────────────────────────────────────────────────────────────────

export function useCreateLocationMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LocationCreateInput) => apiCreateLocation(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'locations'] });
      toast.success('장소가 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateLocationMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationUpdateInput }) =>
      apiUpdateLocation(novelId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'locations'] });
      toast.success('장소가 수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteLocationMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteLocation(novelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'locations'] });
      toast.success('장소가 삭제되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

// ── WorldSetting ──────────────────────────────────────────────────────────────

export function useCreateWorldSettingMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WorldSettingCreateInput) => apiCreateWorldSetting(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'world-settings'] });
      toast.success('세계관 설정이 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateWorldSettingMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorldSettingUpdateInput }) =>
      apiUpdateWorldSetting(novelId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'world-settings'] });
      toast.success('세계관 설정이 수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteWorldSettingMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteWorldSetting(novelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'world-settings'] });
      toast.success('세계관 설정이 삭제되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
