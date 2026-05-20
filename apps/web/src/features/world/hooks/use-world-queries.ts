import { useQuery } from '@tanstack/react-query';
import {
  apiGetCharacters,
  apiGetLocations,
  apiGetRelationships,
  apiGetTimelines,
  apiGetWorldSettings,
} from '../lib/world-api';
import type { WorldSettingType } from '../types/world';

export function useCharacters(novelId: string, name?: string) {
  return useQuery({
    queryKey: ['worlds', novelId, 'characters', { name }],
    queryFn: () => apiGetCharacters(novelId, name),
    enabled: !!novelId,
  });
}

export function useLocations(novelId: string, name?: string) {
  return useQuery({
    queryKey: ['worlds', novelId, 'locations', { name }],
    queryFn: () => apiGetLocations(novelId, name),
    enabled: !!novelId,
  });
}

export function useWorldSettings(novelId: string, name?: string, type?: WorldSettingType) {
  return useQuery({
    queryKey: ['worlds', novelId, 'world-settings', { name, type }],
    queryFn: () => apiGetWorldSettings(novelId, name, type),
    enabled: !!novelId,
  });
}

export function useTimelines(novelId: string) {
  return useQuery({
    queryKey: ['worlds', novelId, 'timelines'],
    queryFn: () => apiGetTimelines(novelId),
    enabled: !!novelId,
  });
}

export function useRelationships(novelId: string, characterId: string) {
  return useQuery({
    queryKey: ['worlds', novelId, 'relationships', characterId],
    queryFn: () => apiGetRelationships(novelId, characterId),
    enabled: !!novelId && !!characterId,
  });
}
