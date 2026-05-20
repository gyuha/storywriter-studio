import { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type BeatType = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution' | 'other';

interface StoryBeat {
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

const BEAT_TYPE_LABELS: Record<BeatType, string> = {
  setup: '발단',
  rising: '전개',
  climax: '절정',
  falling: '하강',
  resolution: '결말',
  other: '기타',
};

const BEAT_TYPE_COLORS: Record<BeatType, string> = {
  setup: '#5c7cfa',
  rising: '#37b24d',
  climax: '#e03131',
  falling: '#f59f00',
  resolution: '#7950f2',
  other: '#868e96',
};

const BEAT_TYPES: BeatType[] = ['setup', 'rising', 'climax', 'falling', 'resolution', 'other'];

async function apiFetchBeats(novelId: string): Promise<StoryBeat[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('스토리 비트를 불러올 수 없습니다');
  return res.json() as Promise<StoryBeat[]>;
}

async function apiCreateBeat(novelId: string, data: Partial<StoryBeat>): Promise<StoryBeat> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('생성 실패');
  return res.json() as Promise<StoryBeat>;
}

async function apiUpdateBeat(novelId: string, beatId: string, data: Partial<StoryBeat>): Promise<StoryBeat> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`/api/v1/novels/${novelId}/story-beats/${beatId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('수정 실패');
  return res.json() as Promise<StoryBeat>;
}

async function apiDeleteBeat(novelId: string, beatId: string): Promise<void> {
  const token = localStorage.getItem('access_token');
  await fetch(`/api/v1/novels/${novelId}/story-beats/${beatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

interface BeatFormProps {
  novelId: string;
  beat?: StoryBeat;
  onClose: () => void;
  nextOrderKey: number;
}

function BeatForm({ novelId, beat, onClose, nextOrderKey }: BeatFormProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(beat?.title ?? '');
  const [content, setContent] = useState(beat?.content ?? '');
  const [beatType, setBeatType] = useState<BeatType>(beat?.beat_type ?? 'other');

  const saveMutation = useMutation({
    mutationFn: () =>
      beat
        ? apiUpdateBeat(novelId, beat.id, { title, content: content || null, beat_type: beatType })
        : apiCreateBeat(novelId, { title, content: content || null, beat_type: beatType, order_key: nextOrderKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story-beats', novelId] });
      onClose();
    },
  });

  return (
    <div style={{ background: 'var(--sw-bg-surface)', border: '1px solid var(--sw-line-default)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="비트 제목"
          style={{ height: 38, padding: '0 12px', border: '1px solid var(--sw-line-default)', borderRadius: 8, fontSize: 14, background: 'var(--sw-bg-subtle)', color: 'var(--sw-text-primary)', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BEAT_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setBeatType(t)}
              style={{ height: 28, padding: '0 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1.5px solid ${beatType === t ? BEAT_TYPE_COLORS[t] : 'var(--sw-line-default)'}`, background: beatType === t ? BEAT_TYPE_COLORS[t] : 'var(--sw-bg-subtle)', color: beatType === t ? 'white' : 'var(--sw-text-secondary)', cursor: 'pointer' }}
            >
              {BEAT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 비트에서 무슨 일이 일어나는지 메모하세요"
          rows={3}
          style={{ padding: '10px 12px', border: '1px solid var(--sw-line-default)', borderRadius: 8, fontSize: 13, background: 'var(--sw-bg-subtle)', color: 'var(--sw-text-primary)', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-line-default)', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--sw-text-secondary)' }}>취소</button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || saveMutation.isPending}
            style={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--sw-primary)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !title.trim() || saveMutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saveMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            {beat ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface StoryBeatListProps {
  novelId: string;
}

export function StoryBeatList({ novelId }: StoryBeatListProps) {
  const qc = useQueryClient();
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: beats, isLoading } = useQuery({
    queryKey: ['story-beats', novelId],
    queryFn: () => apiFetchBeats(novelId),
  });

  const deleteMutation = useMutation({
    mutationFn: (beatId: string) => apiDeleteBeat(novelId, beatId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['story-beats', novelId] }),
  });

  const nextOrderKey = beats ? (beats.length + 1) * 1.0 : 1.0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> 비트 추가
        </button>
      </div>

      {addingNew && (
        <BeatForm
          novelId={novelId}
          onClose={() => setAddingNew(false)}
          nextOrderKey={nextOrderKey}
        />
      )}

      {beats && beats.length === 0 && !addingNew && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--sw-text-assistive)', fontSize: 14 }}>
          스토리 비트를 추가하여 플롯 구조를 관리하세요.
        </div>
      )}

      {beats && beats.map((beat) => (
        <div key={beat.id}>
          {editingId === beat.id ? (
            <BeatForm
              novelId={novelId}
              beat={beat}
              onClose={() => setEditingId(null)}
              nextOrderKey={nextOrderKey}
            />
          ) : (
            <div
              style={{ display: 'flex', gap: 12, padding: '12px 14px', border: '1px solid var(--sw-line-default)', borderRadius: 10, marginBottom: 8, background: 'var(--sw-bg-surface)', alignItems: 'flex-start' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, padding: '0 8px', borderRadius: 6, background: BEAT_TYPE_COLORS[beat.beat_type], color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                {BEAT_TYPE_LABELS[beat.beat_type]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sw-text-primary)', marginBottom: 2 }}>{beat.title}</div>
                {beat.content && (
                  <div style={{ fontSize: 13, color: 'var(--sw-text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{beat.content}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button type="button" onClick={() => setEditingId(beat.id)} className="p-1 rounded hover:bg-muted" title="수정">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`'${beat.title}'을(를) 삭제하시겠습니까?`)) {
                      deleteMutation.mutate(beat.id);
                    }
                  }}
                  className="p-1 rounded hover:bg-muted text-destructive"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
