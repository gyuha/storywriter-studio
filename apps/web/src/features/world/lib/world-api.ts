import {
  createCharacterApiV1NovelsNovelIdCharactersPost,
  createLocationApiV1NovelsNovelIdLocationsPost,
  createRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsPost,
  createTimelineApiV1NovelsNovelIdTimelinesPost,
  createWorldSettingApiV1NovelsNovelIdWorldSettingsPost,
  deleteCharacterApiV1NovelsNovelIdCharactersCharacterIdDelete,
  deleteLocationApiV1NovelsNovelIdLocationsLocationIdDelete,
  deleteRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsRelIdDelete,
  deleteTimelineApiV1NovelsNovelIdTimelinesTimelineIdDelete,
  deleteWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdDelete,
  getCharacterApiV1NovelsNovelIdCharactersCharacterIdGet,
  getLocationApiV1NovelsNovelIdLocationsLocationIdGet,
  getWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdGet,
  listCharactersApiV1NovelsNovelIdCharactersGet,
  listLocationsApiV1NovelsNovelIdLocationsGet,
  listRelationshipsApiV1NovelsNovelIdCharactersCharacterIdRelationshipsGet,
  listTimelinesApiV1NovelsNovelIdTimelinesGet,
  listWorldSettingsApiV1NovelsNovelIdWorldSettingsGet,
  updateCharacterApiV1NovelsNovelIdCharactersCharacterIdPut,
  updateLocationApiV1NovelsNovelIdLocationsLocationIdPut,
  updateRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsRelIdPut,
  updateTimelineApiV1NovelsNovelIdTimelinesTimelineIdPut,
  updateWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdPut,
} from '@/generated/sdk.gen';
import type {
  Character,
  CharacterCreateInput,
  CharacterUpdateInput,
  Location,
  LocationCreateInput,
  LocationUpdateInput,
  Relationship,
  RelationshipCreateInput,
  RelationshipUpdateInput,
  Timeline,
  TimelineCreateInput,
  TimelineUpdateInput,
  WorldSetting,
  WorldSettingCreateInput,
  WorldSettingType,
  WorldSettingUpdateInput,
} from '../types/world';

function throwOnError(error: unknown): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? '오류가 발생했습니다');
  }
  throw new Error('오류가 발생했습니다');
}

// ── Character ─────────────────────────────────────────────────────────────────

export async function apiGetCharacters(novelId: string, name?: string): Promise<Character[]> {
  const { data, error } = await listCharactersApiV1NovelsNovelIdCharactersGet({
    path: { novel_id: novelId },
    query: name ? { name } : undefined,
  });
  if (error) throwOnError(error);
  return data as Character[];
}

export async function apiGetCharacter(novelId: string, characterId: string): Promise<Character> {
  const { data, error } = await getCharacterApiV1NovelsNovelIdCharactersCharacterIdGet({
    path: { novel_id: novelId, character_id: characterId },
  });
  if (error) throwOnError(error);
  return data as Character;
}

export async function apiCreateCharacter(
  novelId: string,
  body: CharacterCreateInput
): Promise<Character> {
  const { data, error } = await createCharacterApiV1NovelsNovelIdCharactersPost({
    path: { novel_id: novelId },
    body,
  });
  if (error) throwOnError(error);
  return data as Character;
}

export async function apiUpdateCharacter(
  novelId: string,
  characterId: string,
  body: CharacterUpdateInput
): Promise<Character> {
  const { data, error } = await updateCharacterApiV1NovelsNovelIdCharactersCharacterIdPut({
    path: { novel_id: novelId, character_id: characterId },
    body,
  });
  if (error) throwOnError(error);
  return data as Character;
}

export async function apiDeleteCharacter(novelId: string, characterId: string): Promise<void> {
  const { error } = await deleteCharacterApiV1NovelsNovelIdCharactersCharacterIdDelete({
    path: { novel_id: novelId, character_id: characterId },
  });
  if (error) throwOnError(error);
}

// ── Location ──────────────────────────────────────────────────────────────────

export async function apiGetLocations(novelId: string, name?: string): Promise<Location[]> {
  const { data, error } = await listLocationsApiV1NovelsNovelIdLocationsGet({
    path: { novel_id: novelId },
    query: name ? { name } : undefined,
  });
  if (error) throwOnError(error);
  return data as Location[];
}

export async function apiGetLocation(novelId: string, locationId: string): Promise<Location> {
  const { data, error } = await getLocationApiV1NovelsNovelIdLocationsLocationIdGet({
    path: { novel_id: novelId, location_id: locationId },
  });
  if (error) throwOnError(error);
  return data as Location;
}

export async function apiCreateLocation(
  novelId: string,
  body: LocationCreateInput
): Promise<Location> {
  const { data, error } = await createLocationApiV1NovelsNovelIdLocationsPost({
    path: { novel_id: novelId },
    body,
  });
  if (error) throwOnError(error);
  return data as Location;
}

export async function apiUpdateLocation(
  novelId: string,
  locationId: string,
  body: LocationUpdateInput
): Promise<Location> {
  const { data, error } = await updateLocationApiV1NovelsNovelIdLocationsLocationIdPut({
    path: { novel_id: novelId, location_id: locationId },
    body,
  });
  if (error) throwOnError(error);
  return data as Location;
}

export async function apiDeleteLocation(novelId: string, locationId: string): Promise<void> {
  const { error } = await deleteLocationApiV1NovelsNovelIdLocationsLocationIdDelete({
    path: { novel_id: novelId, location_id: locationId },
  });
  if (error) throwOnError(error);
}

// ── WorldSetting ──────────────────────────────────────────────────────────────

export async function apiGetWorldSettings(
  novelId: string,
  name?: string,
  type?: WorldSettingType
): Promise<WorldSetting[]> {
  const { data, error } = await listWorldSettingsApiV1NovelsNovelIdWorldSettingsGet({
    path: { novel_id: novelId },
    query: { name: name ?? null, type: type ?? null },
  });
  if (error) throwOnError(error);
  return data as WorldSetting[];
}

export async function apiGetWorldSetting(
  novelId: string,
  worldSettingId: string
): Promise<WorldSetting> {
  const { data, error } = await getWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdGet({
    path: { novel_id: novelId, world_setting_id: worldSettingId },
  });
  if (error) throwOnError(error);
  return data as WorldSetting;
}

export async function apiCreateWorldSetting(
  novelId: string,
  body: WorldSettingCreateInput
): Promise<WorldSetting> {
  const { data, error } = await createWorldSettingApiV1NovelsNovelIdWorldSettingsPost({
    path: { novel_id: novelId },
    body,
  });
  if (error) throwOnError(error);
  return data as WorldSetting;
}

export async function apiUpdateWorldSetting(
  novelId: string,
  worldSettingId: string,
  body: WorldSettingUpdateInput
): Promise<WorldSetting> {
  const { data, error } = await updateWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdPut({
    path: { novel_id: novelId, world_setting_id: worldSettingId },
    body,
  });
  if (error) throwOnError(error);
  return data as WorldSetting;
}

export async function apiDeleteWorldSetting(
  novelId: string,
  worldSettingId: string
): Promise<void> {
  const { error } = await deleteWorldSettingApiV1NovelsNovelIdWorldSettingsWorldSettingIdDelete({
    path: { novel_id: novelId, world_setting_id: worldSettingId },
  });
  if (error) throwOnError(error);
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export async function apiGetTimelines(novelId: string): Promise<Timeline[]> {
  const { data, error } = await listTimelinesApiV1NovelsNovelIdTimelinesGet({
    path: { novel_id: novelId },
  });
  if (error) throwOnError(error);
  return data as Timeline[];
}

export async function apiCreateTimeline(
  novelId: string,
  body: TimelineCreateInput
): Promise<Timeline> {
  const { data, error } = await createTimelineApiV1NovelsNovelIdTimelinesPost({
    path: { novel_id: novelId },
    body,
  });
  if (error) throwOnError(error);
  return data as Timeline;
}

export async function apiUpdateTimeline(
  novelId: string,
  timelineId: string,
  body: TimelineUpdateInput
): Promise<Timeline> {
  const { data, error } = await updateTimelineApiV1NovelsNovelIdTimelinesTimelineIdPut({
    path: { novel_id: novelId, timeline_id: timelineId },
    body,
  });
  if (error) throwOnError(error);
  return data as Timeline;
}

export async function apiDeleteTimeline(novelId: string, timelineId: string): Promise<void> {
  const { error } = await deleteTimelineApiV1NovelsNovelIdTimelinesTimelineIdDelete({
    path: { novel_id: novelId, timeline_id: timelineId },
  });
  if (error) throwOnError(error);
}

// ── Relationship ──────────────────────────────────────────────────────────────

export async function apiGetRelationships(
  novelId: string,
  characterId: string
): Promise<Relationship[]> {
  const { data, error } =
    await listRelationshipsApiV1NovelsNovelIdCharactersCharacterIdRelationshipsGet({
      path: { novel_id: novelId, character_id: characterId },
    });
  if (error) throwOnError(error);
  return data as Relationship[];
}

export async function apiCreateRelationship(
  novelId: string,
  characterId: string,
  body: RelationshipCreateInput
): Promise<Relationship> {
  const { data, error } =
    await createRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsPost({
      path: { novel_id: novelId, character_id: characterId },
      body,
    });
  if (error) throwOnError(error);
  return data as Relationship;
}

export async function apiUpdateRelationship(
  novelId: string,
  characterId: string,
  relId: string,
  body: RelationshipUpdateInput
): Promise<Relationship> {
  const { data, error } =
    await updateRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsRelIdPut({
      path: { novel_id: novelId, character_id: characterId, rel_id: relId },
      body,
    });
  if (error) throwOnError(error);
  return data as Relationship;
}

export async function apiDeleteRelationship(
  novelId: string,
  characterId: string,
  relId: string
): Promise<void> {
  const { error } =
    await deleteRelationshipApiV1NovelsNovelIdCharactersCharacterIdRelationshipsRelIdDelete({
      path: { novel_id: novelId, character_id: characterId, rel_id: relId },
    });
  if (error) throwOnError(error);
}
