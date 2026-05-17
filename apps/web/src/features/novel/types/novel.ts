export interface Novel {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  chapter_count: number;
}

export type ChapterStatus = 'draft' | 'reviewing' | 'done';

export interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: Record<string, unknown> | null; // D-28: TipTap getJSON() result stored as JSONB
  order_key: number;
  status: ChapterStatus;
  created_at: string;
  updated_at: string;
}

export interface NovelCreateInput {
  title: string;
  genre?: string;
  description?: string;
  cover_image_url?: string;
}

export interface NovelUpdateInput {
  title?: string;
  genre?: string;
  description?: string;
  cover_image_url?: string;
}

export interface NovelListResponse {
  items: Novel[];
  total: number;
}
