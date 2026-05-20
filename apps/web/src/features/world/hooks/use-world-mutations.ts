import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  apiCreateCharacter,
  apiCreateLocation,
  apiCreateRelationship,
  apiCreateTimeline,
  apiCreateWorldSetting,
  apiDeleteCharacter,
  apiDeleteLocation,
  apiDeleteRelationship,
  apiDeleteTimeline,
  apiDeleteWorldSetting,
  apiUpdateCharacter,
  apiUpdateLocation,
  apiUpdateRelationship,
  apiUpdateTimeline,
  apiUpdateWorldSetting,
} from '../lib/world-api';
import type {
  CharacterCreateInput,
  CharacterUpdateInput,
  LocationCreateInput,
  LocationUpdateInput,
  RelationshipCreateInput,
  RelationshipUpdateInput,
  TimelineCreateInput,
  TimelineUpdateInput,
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

// ── Timeline ──────────────────────────────────────────────────────────────────

export function useCreateTimelineMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TimelineCreateInput) => apiCreateTimeline(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'timelines'] });
      toast.success('시간표 항목이 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateTimelineMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TimelineUpdateInput }) =>
      apiUpdateTimeline(novelId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'timelines'] });
      toast.success('시간표 항목이 수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteTimelineMutation(novelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteTimeline(novelId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds', novelId, 'timelines'] });
      toast.success('시간표 항목이 삭제되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

// ── Relationship ──────────────────────────────────────────────────────────────

export function useCreateRelationshipMutation(novelId: string, characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RelationshipCreateInput) =>
      apiCreateRelationship(novelId, characterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['worlds', novelId, 'relationships', characterId],
      });
      toast.success('관계가 추가되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useUpdateRelationshipMutation(novelId: string, characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RelationshipUpdateInput }) =>
      apiUpdateRelationship(novelId, characterId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['worlds', novelId, 'relationships', characterId],
      });
      toast.success('관계가 수정되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}

export function useDeleteRelationshipMutation(novelId: string, characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteRelationship(novelId, characterId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['worlds', novelId, 'relationships', characterId],
      });
      toast.success('관계가 삭제되었습니다');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다');
    },
  });
}
