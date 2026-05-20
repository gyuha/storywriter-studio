import { useState } from 'react';
import {
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { useCharacters } from '@/features/world/hooks/use-world-queries';
import { useLocations } from '@/features/world/hooks/use-world-queries';
import { useWorldSettings } from '@/features/world/hooks/use-world-queries';

export type RightTab = 'chat' | 'proofread' | 'character' | 'background';

export interface ContextItem {
  type: 'character' | 'location' | 'world_setting';
  id: string;
}

interface ChatMessage { role: 'ai' | 'user'; text: string }

function TabBackground({
  novelId,
  contextItems,
  onContextToggle,
}: {
  novelId: string;
  contextItems: Record<string, boolean>;
  onContextToggle: (id: string, type: ContextItem['type']) => void;
}) {
  const { data: locations, isLoading: locLoading } = useLocations(novelId);
  const { data: worldSettings, isLoading: wsLoading } = useWorldSettings(novelId);
  const isLoading = locLoading || wsLoading;

  return (
    <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--sw-text-assistive)' }} />
        </div>
      )}

      {/* Locations */}
      {locations && locations.length > 0 && (
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 10px 4px', color: 'var(--sw-text-primary)' }}>
            <MapPin size={14} style={{ color: 'var(--sw-primary)' }} />
            장소 / 배경
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {locations.map((loc) => (
              <div key={loc.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px', border: contextItems[loc.id] ? '1px solid var(--sw-primary)' : '1px solid transparent' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{loc.name}</div>
                  {loc.summary && <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.summary}</div>}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--sw-primary)', cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={!!contextItems[loc.id]} onChange={() => onContextToggle(loc.id, 'location')} style={{ accentColor: 'var(--sw-primary)' }} />
                  <span>포함</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* World Settings */}
      {worldSettings && worldSettings.length > 0 && (
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 10px 4px', color: 'var(--sw-text-primary)' }}>
            <Sparkles size={14} style={{ color: 'var(--sw-primary)' }} />
            세계관 설정
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {worldSettings.map((ws) => (
              <div key={ws.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px', border: contextItems[ws.id] ? '1px solid var(--sw-primary)' : '1px solid transparent' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{ws.name}</div>
                  {ws.summary && <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.summary}</div>}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--sw-primary)', cursor: 'pointer', flexShrink: 0 }}>
                  <input type="checkbox" checked={!!contextItems[ws.id]} onChange={() => onContextToggle(ws.id, 'world_setting')} style={{ accentColor: 'var(--sw-primary)' }} />
                  <span>포함</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (!locations?.length && !worldSettings?.length) && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--sw-text-assistive)', fontSize: 13 }}>
          등록된 장소 또는 세계관 설정이 없습니다.
        </div>
      )}
    </div>
  );
}

function TabCharacter({
  novelId,
  contextItems,
  onContextToggle,
}: {
  novelId: string;
  contextItems: Record<string, boolean>;
  onContextToggle: (id: string, type: ContextItem['type']) => void;
}) {
  const { data: characters, isLoading } = useCharacters(novelId);

  const GRADIENTS = [
    'linear-gradient(135deg,#FFD580,#FF8C42)',
    'linear-gradient(135deg,#93C5FD,#3B82F6)',
    'linear-gradient(135deg,#C4B5FD,#7C3AED)',
    'linear-gradient(135deg,#FCA5A5,#DC2626)',
    'linear-gradient(135deg,#6EE7B7,#10B981)',
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'var(--sw-primary-tint)', borderRadius: 10, padding: 14, marginBottom: 4 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: 'var(--sw-text-primary)' }}>
          <Users size={14} style={{ color: 'var(--sw-primary)' }} />
          캐릭터
        </h4>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--sw-text-primary)' }}>
          AI 컨텍스트에 포함할 캐릭터를 선택하세요.
        </p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--sw-text-assistive)' }} />
        </div>
      )}

      {characters?.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px', cursor: 'pointer', border: contextItems[c.id] ? '1px solid var(--sw-primary)' : '1px solid transparent' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: GRADIENTS[i % GRADIENTS.length], display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, flexShrink: 0, fontSize: 15 }}>{c.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role ?? '역할 미지정'}</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--sw-primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!contextItems[c.id]} onChange={() => onContextToggle(c.id, 'character')} style={{ accentColor: 'var(--sw-primary)' }} />
            <span>포함</span>
          </label>
        </div>
      ))}

      {!isLoading && !characters?.length && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--sw-text-assistive)', fontSize: 13 }}>
          등록된 캐릭터가 없습니다.
        </div>
      )}
    </div>
  );
}

function TabProofread() {
  const items = [
    { type: 'err', label: '맞춤법', wrong: '바람이 스치 지나감', correct: '바람이 스쳐 지나감', why: "'스치다'의 활용형은 '스쳐'입니다." },
    { type: 'warn', label: '띄어쓰기', wrong: '한발, 또 한발.', correct: '한 발, 또 한 발.', why: '단위 명사는 띄어 씁니다.' },
    { type: 'sug', label: '문장 개선 제안', wrong: '눈앞의 문은 더욱 선명하게 모습을 드러냈다.', correct: '눈앞에 펼쳐진 문이 한층 또렷이 모습을 드러냈다.', why: "반복되는 '더욱' 표현을 다양화하면 리듬이 살아납니다." },
  ];
  const borderColor = { err: '#FF3B3B', warn: '#FF9200', sug: '#0066FF' };
  const labelColor = { err: '#FF3B3B', warn: '#FF9200', sug: '#0066FF' };

  return (
    <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'var(--sw-bg-subtle)', borderRadius: 10, padding: 14 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: 'var(--sw-text-primary)' }}>
          맞춤법 검사
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--sw-text-assistive)' }}>3개 발견</span>
        </h4>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--sw-text-secondary)' }}>본문에서 자동 감지된 표현입니다.</p>
      </div>
      {items.map((item) => (
        <div key={item.wrong} style={{ background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${borderColor[item.type as keyof typeof borderColor]}` }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: labelColor[item.type as keyof typeof labelColor], marginBottom: 4 }}>{item.label}</span>
          <span style={{ textDecoration: 'line-through', color: 'var(--sw-text-assistive)', fontSize: 13 }}>{item.wrong}</span>
          <span style={{ fontSize: 13, color: 'var(--sw-text-primary)' }}> → <strong>{item.correct}</strong></span>
          <div style={{ fontSize: 12, color: 'var(--sw-text-assistive)', marginTop: 4 }}>{item.why}</div>
        </div>
      ))}
    </div>
  );
}

function TabChat() {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: 'ai', text: '세계관 데이터베이스의 캐릭터/장소 설정을 참고하여 답변드릴 수 있습니다.' },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { role: 'user', text: input }, { role: 'ai', text: '잠시만요, 설정을 참고해 답변을 준비할게요…' }]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'ai' ? 'var(--sw-primary-tint)' : 'linear-gradient(135deg,#FFB199,#FF7E5F)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: m.role === 'ai' ? 'var(--sw-primary)' : 'white', flexShrink: 0 }}>
              {m.role === 'ai' ? 'AI' : '나'}
            </div>
            <div style={{ flex: 1, background: m.role === 'ai' ? 'var(--sw-bg-subtle)' : 'var(--sw-primary-tint)', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.55, color: 'var(--sw-text-secondary)' }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--sw-line-default)', padding: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="AI에게 질문하거나 아이디어를 요청하세요…"
          rows={2}
          style={{ flex: 1, background: 'var(--sw-bg-subtle)', border: '1px solid transparent', borderRadius: 12, padding: '8px 12px', resize: 'none', outline: 'none', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit', color: 'var(--sw-text-primary)' }}
        />
        <button onClick={send} style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 8, background: 'var(--sw-primary)', color: 'white', cursor: 'pointer', border: 'none', flexShrink: 0 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

interface EditorRightPanelProps {
  novelId: string;
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  contextItems: Record<string, boolean>;
  onContextToggle: (id: string, type: ContextItem['type']) => void;
}

export function EditorRightPanel({ novelId, activeTab, onTabChange, contextItems, onContextToggle }: EditorRightPanelProps) {
  const tabs: { id: RightTab; label: string }[] = [
    { id: 'chat', label: '채팅' },
    { id: 'proofread', label: '교정' },
    { id: 'character', label: '캐릭터' },
    { id: 'background', label: '배경/설정' },
  ];

  return (
    <aside style={{ width: 320, background: 'var(--sw-bg-surface)', borderLeft: '1px solid var(--sw-line-default)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--sw-line-default)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              height: 44,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: activeTab === t.id ? 'var(--sw-primary)' : 'var(--sw-text-assistive)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              borderBottom: activeTab === t.id ? '2px solid var(--sw-primary)' : '2px solid transparent',
              letterSpacing: '0.015em',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'background' && (
          <TabBackground novelId={novelId} contextItems={contextItems} onContextToggle={onContextToggle} />
        )}
        {activeTab === 'character' && (
          <TabCharacter novelId={novelId} contextItems={contextItems} onContextToggle={onContextToggle} />
        )}
        {activeTab === 'proofread' && <TabProofread />}
        {activeTab === 'chat' && <TabChat />}
      </div>
    </aside>
  );
}
