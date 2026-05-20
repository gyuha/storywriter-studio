export interface Character {
  id: string;
  novel_id: string;
  name: string;
  appearance: string | null;
  personality: string | null;
  background: string | null;
  role: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreateInput {
  name: string;
  appearance?: string;
  personality?: string;
  background?: string;
  role?: string;
  summary?: string;
}

export interface CharacterUpdateInput {
  name?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  role?: string;
  summary?: string;
}

export interface Location {
  id: string;
  novel_id: string;
  name: string;
  description: string | null;
  location_relation: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationCreateInput {
  name: string;
  description?: string;
  location_relation?: string;
  summary?: string;
}

export interface LocationUpdateInput {
  name?: string;
  description?: string;
  location_relation?: string;
  summary?: string;
}

export interface Timeline {
  id: string;
  novel_id: string;
  event_name: string;
  event_date: string | null;
  description: string | null;
  chapter_id: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineCreateInput {
  event_name: string;
  event_date?: string;
  description?: string;
  chapter_id?: string;
  summary?: string;
}

export interface TimelineUpdateInput {
  event_name?: string;
  event_date?: string;
  description?: string;
  chapter_id?: string;
  summary?: string;
}

export type RelationshipType = 'lover' | 'enemy' | 'ally' | 'family';

export interface Relationship {
  id: string;
  novel_id: string;
  character_id_a: string;
  character_id_b: string;
  type: RelationshipType;
  description: string | null;
  direction: 'source' | 'target';
  other_character_id: string;
  created_at: string;
  updated_at: string;
}

export interface RelationshipCreateInput {
  character_id_b: string;
  type: RelationshipType;
  description?: string;
}

export interface RelationshipUpdateInput {
  type?: RelationshipType;
  description?: string;
}

export type WorldSettingType = 'magic_system' | 'nation_faction' | 'history' | 'rule';

export interface WorldSetting {
  id: string;
  novel_id: string;
  name: string;
  type: WorldSettingType;
  content: Record<string, unknown>;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldSettingCreateInput {
  name: string;
  type: WorldSettingType;
  content?: Record<string, unknown>;
  summary?: string;
}

export interface WorldSettingUpdateInput {
  name?: string;
  type?: WorldSettingType;
  content?: Record<string, unknown>;
  summary?: string;
}
