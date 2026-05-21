export type BeatType = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution' | 'other';

export interface StoryBeat {
  id: string;
  novel_id: string;
  chapter_id: string | null;
  title: string;
  content: string | null;
  beat_type: BeatType;
  order_key: number;
  created_at: string;
  updated_at: string;
}

export const BEAT_TYPE_LABELS: Record<BeatType, string> = {
  setup: '발단',
  rising: '전개',
  climax: '절정',
  falling: '하강',
  resolution: '결말',
  other: '기타',
};

export const BEAT_TYPE_COLORS: Record<BeatType, string> = {
  setup: '#5c7cfa',
  rising: '#37b24d',
  climax: '#e03131',
  falling: '#f59f00',
  resolution: '#7950f2',
  other: '#868e96',
};

export const BEAT_TYPES: BeatType[] = [
  'setup',
  'rising',
  'climax',
  'falling',
  'resolution',
  'other',
];
