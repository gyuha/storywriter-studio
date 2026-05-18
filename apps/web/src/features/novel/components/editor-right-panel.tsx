import { useState } from 'react';
import {
  Lightbulb,
  MapPin,
  Send,
  Sparkles,
  StickyNote,
} from 'lucide-react';

type RightTab = 'chat' | 'proofread' | 'character' | 'background';

interface ChatMessage { role: 'ai' | 'user'; text: string }

function TabBackground() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary */}
      <div style={{ background: 'var(--sw-bg-subtle)', borderRadius: 10, padding: '14px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--sw-text-primary)' }}>
          <StickyNote size={14} style={{ color: 'var(--sw-primary)' }} />
          현재 챕터 요약
        </h4>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--sw-text-secondary)' }}>
          유하린이 오래된 문을 열고 낯선 세계로 들어서는 장면입니다. 문 너머의 세계는 아름답지만 동시에 미지의 위험이 도사리고 있을 가능성이 있습니다.
        </p>
      </div>

      {/* Places */}
      <div>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 10px 4px', color: 'var(--sw-text-primary)' }}>
          <MapPin size={14} style={{ color: 'var(--sw-primary)' }} />
          장소 / 배경
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { name: '오래된 문', desc: '세월의 흔적을 머금은 고대의 문', gradient: 'radial-gradient(80% 100% at 50% 90%, #C9A876 0%, #6B4423 60%, #2A1810 100%)' },
            { name: '촛불 복도', desc: '낡은 왕궁의 복도', gradient: 'linear-gradient(180deg, #1A0E08 0%, #4A2818 50%, #C77A3D 90%)' },
            { name: '낯선 나라', desc: '끝없이 펼쳐진 낯선 하늘과 대지', gradient: 'linear-gradient(180deg, #FFA8C0 0%, #FFB8E0 35%, #B0D8F0 70%, #506890 100%)' },
          ].map((p) => (
            <div key={p.name} style={{ background: 'var(--sw-bg-surface)', border: '1px solid var(--sw-line-default)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 56, background: p.gradient }} />
              <div style={{ padding: '6px 8px 4px', fontSize: 12, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{p.name}</div>
              <div style={{ padding: '0 8px 8px', fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.4 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Setting notes */}
      <div style={{ background: 'var(--sw-bg-subtle)', borderRadius: 10, padding: 14 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--sw-text-primary)' }}>
          <StickyNote size={14} style={{ color: 'var(--sw-primary)' }} />
          설정 메모
        </h4>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {['문은 신비한 빛나는 진표 역할을 함', '등장인물: 판탈로 대공의 의식에서 유래', '문을 통과하면 시간과 공간이 뒤틀림', '낯선 나라는 아름다움과 위험이 공존함'].map((note) => (
            <li key={note} style={{ fontSize: 13, color: 'var(--sw-text-secondary)', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 4, top: 8, width: 4, height: 4, borderRadius: '50%', background: 'var(--sw-text-assistive)', display: 'block' }} />
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* AI prompt suggestions */}
      <div style={{ background: 'var(--sw-bg-subtle)', borderRadius: 10, padding: 14 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--sw-text-primary)' }}>
          <Sparkles size={14} style={{ color: 'var(--sw-primary)' }} />
          AI 제안 프롬프트
        </h4>
        {['낯선 나라의 첫 인상을 묘장 중심으로 묘사해줘.', '이 세계의 규칙이 유하린에게 어떤 영향을 줄 수 있을까?', '문이 선택한 자만 통과할 수 있다는 설정을 추가해줘.'].map((p) => (
          <button key={p} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 6, background: 'var(--sw-bg-surface)', border: '1px solid var(--sw-line-default)', borderRadius: 6, fontSize: 13, color: 'var(--sw-text-primary)', lineHeight: 1.5, cursor: 'pointer' }}>
            {p}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--sw-text-assistive)', lineHeight: 1.5 }}>
          <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>더 나은 결과를 위해 구체적이고 상세한 프롬프트를 사용해 보세요.</span>
        </div>
      </div>
    </div>
  );
}

function TabCharacter() {
  const chars = [
    { name: '유하린', role: '주인공 · 17세 · 호기심 많은 소녀', grad: 'linear-gradient(135deg,#FFD580,#FF8C42)' },
    { name: '잠긴 문지기', role: '안내자 · 정체 불명', grad: 'linear-gradient(135deg,#93C5FD,#3B82F6)' },
    { name: '판탈로 대공', role: '전 통치자 · 회상 속 등장', grad: 'linear-gradient(135deg,#C4B5FD,#7C3AED)' },
    { name: '그림자 인영', role: '적대 · 4화부터 본격 등장', grad: 'linear-gradient(135deg,#FCA5A5,#DC2626)' },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-4 sw-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'var(--sw-primary-tint)', borderRadius: 10, padding: 14, marginBottom: 4 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: 'var(--sw-text-primary)' }}>
          <Sparkles size={14} style={{ color: 'var(--sw-primary)' }} />
          이 챕터 등장 인물
        </h4>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--sw-text-primary)' }}>본문에서 자동 감지된 캐릭터입니다. AI 컨텍스트에 자동 포함됩니다.</p>
      </div>
      {chars.map((c, i) => (
        <div key={c.name} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px', cursor: 'pointer', border: '1px solid transparent' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.grad, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{c.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)' }}>{c.role}</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--sw-primary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked={i < 2} style={{ accentColor: 'var(--sw-primary)' }} />
            <span>포함</span>
          </label>
        </div>
      ))}
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
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--sw-text-secondary)' }}>본문에서 자동 감지된 표현입니다. 적용하면 에디터에 반영됩니다.</p>
      </div>
      {items.map((item) => (
        <div key={item.wrong} style={{ background: 'var(--sw-bg-subtle)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${borderColor[item.type as keyof typeof borderColor]}` }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: labelColor[item.type as keyof typeof labelColor], marginBottom: 4 }}>{item.label}</span>
          <span style={{ textDecoration: 'line-through', color: 'var(--sw-text-assistive)', fontSize: 13 }}>{item.wrong}</span>
          <span style={{ fontSize: 13, color: 'var(--sw-text-primary)' }}> → <strong>{item.correct}</strong></span>
          <div style={{ fontSize: 12, color: 'var(--sw-text-assistive)', marginTop: 4 }}>{item.why}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: 'var(--sw-text-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>적용</button>
            <button style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: 'var(--sw-bg-surface)', color: 'var(--sw-text-primary)', border: '1px solid var(--sw-line-default)', cursor: 'pointer' }}>무시</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabChat() {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: 'ai', text: '이 챕터의 분위기를 조금 더 신비롭게 가져가고 싶은데, 어떤 묘사를 추가하면 좋을까요?' },
    { role: 'user', text: '유하린이 문을 통과한 직후의 감각을 더 강조하고 싶어요.' },
    { role: 'ai', text: "'차가운 공기 사이로 낯익은 향이 스며들었다. 마치 어린 시절 외할머니 댁의 정원처럼.' — 이런 식으로 익숙한 감각이 낯선 공간에 겹치게 표현하면 묘한 그리움이 생깁니다." },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { role: 'user', text: input }, { role: 'ai', text: '잠시만요, 이전 챕터의 흐름과 캐릭터 설정을 참고해 답변을 준비할게요…' }]);
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
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
}

export function EditorRightPanel({ activeTab, onTabChange }: EditorRightPanelProps) {
  const tabs: { id: RightTab; label: string }[] = [
    { id: 'chat', label: '채팅' },
    { id: 'proofread', label: '교정' },
    { id: 'character', label: '캐릭터' },
    { id: 'background', label: '배경 및 설정' },
  ];

  return (
    <aside style={{ width: 320, background: 'var(--sw-bg-surface)', borderLeft: '1px solid var(--sw-line-default)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Tab bar */}
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

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'background' && <TabBackground />}
        {activeTab === 'character' && <TabCharacter />}
        {activeTab === 'proofread' && <TabProofread />}
        {activeTab === 'chat' && <TabChat />}
      </div>
    </aside>
  );
}
