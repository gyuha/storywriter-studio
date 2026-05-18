import '@/styles/editor.css';
import { useNavigate } from '@tanstack/react-router';
import {
  Archive,
  Bell,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  FileText,
  Globe,
  Image,
  Loader2,
  Moon,
  PenLine,
  Save,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useChapters } from '../hooks/use-chapter-queries';
import { useDeleteNovelMutation, useUpdateNovelMutation } from '../hooks/use-novel-mutations';
import type { Novel } from '../types/novel';

// ─── Design tokens (same as editor-layout) ────────────────────────────────────

const LIGHT_TOKENS = {
  '--sw-primary': '#0066FF',
  '--sw-primary-hover': '#0052CC',
  '--sw-primary-tint': '#E8F0FF',
  '--sw-text-primary': '#171719',
  '--sw-text-secondary': '#2E3137',
  '--sw-text-assistive': '#70737C',
  '--sw-bg-surface': '#FFFFFF',
  '--sw-bg-subtle': '#F7F7F8',
  '--sw-bg-muted': '#EEEFF1',
  '--sw-line-default': '#E1E2E4',
  '--sw-line-strong': '#C2C4C8',
  '--sw-fill-hover': 'rgba(112,115,124,0.05)',
  '--sw-status-positive': '#00BF40',
  '--sw-status-negative': '#FF3B3B',
  '--sw-status-negative-bg': 'rgba(255,59,59,0.06)',
} as React.CSSProperties;

const DARK_TOKENS = {
  '--sw-primary': '#1F75FF',
  '--sw-primary-hover': '#4990FF',
  '--sw-primary-tint': 'rgba(31,117,255,0.16)',
  '--sw-text-primary': '#F7F7F8',
  '--sw-text-secondary': '#DBDCDF',
  '--sw-text-assistive': '#8E9197',
  '--sw-bg-surface': '#171719',
  '--sw-bg-subtle': '#1F2024',
  '--sw-bg-muted': '#2A2C31',
  '--sw-line-default': '#2E3137',
  '--sw-line-strong': '#46474C',
  '--sw-fill-hover': 'rgba(255,255,255,0.06)',
  '--sw-status-positive': '#00BF40',
  '--sw-status-negative': '#FF3B3B',
  '--sw-status-negative-bg': 'rgba(255,59,59,0.12)',
} as React.CSSProperties;

// ─── Section nav config ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'basic', label: '기본 정보', icon: FileText },
  { id: 'cover', label: '커버 & 표지', icon: Image },
  { id: 'publish', label: '연재 정보', icon: BookOpen },
  { id: 'ai', label: 'AI 어시스턴트', icon: Sparkles },
  { id: 'writing', label: '집필 환경', icon: PenLine },
  { id: 'backup', label: '백업 & 내보내기', icon: Save },
] as const;

const DANGER_SECTION = { id: 'danger', label: '위험 영역', icon: Bell };

// ─── Form atoms ───────────────────────────────────────────────────────────────

function Row({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, padding: '16px 0', borderTop: '1px solid var(--sw-line-default)', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sw-text-primary)', paddingTop: 8, letterSpacing: '-0.004em' }}>
        {label}{required && <span style={{ color: 'var(--sw-status-negative)', marginLeft: 2 }}>*</span>}
        {hint && <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--sw-text-assistive)', marginTop: 4, lineHeight: 1.5, letterSpacing: 0 }}>{hint}</span>}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

function WsInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ height: 40, width: '100%', padding: '0 14px', background: 'var(--sw-bg-subtle)', border: '1px solid transparent', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'var(--sw-text-primary)', outline: 'none', boxSizing: 'border-box' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--sw-primary)'; e.target.style.background = 'var(--sw-bg-surface)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--sw-bg-subtle)'; }}
      />
      {maxLength && <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--sw-text-assistive)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value.length} / {maxLength}</div>}
    </>
  );
}

function WsTextarea({ value, onChange, placeholder, maxLength, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; rows?: number;
}) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        style={{ width: '100%', padding: '10px 14px', background: 'var(--sw-bg-subtle)', border: '1px solid transparent', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'var(--sw-text-primary)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--sw-primary)'; e.target.style.background = 'var(--sw-bg-surface)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--sw-bg-subtle)'; }}
      />
      {maxLength && <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--sw-text-assistive)', marginTop: 4 }}>{value.length} / {maxLength}</div>}
    </>
  );
}

function WsSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ height: 40, width: '100%', padding: '0 36px 0 14px', background: `var(--sw-bg-subtle) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2370737C' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 14px center`, border: '1px solid transparent', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'var(--sw-text-primary)', outline: 'none', appearance: 'none', boxSizing: 'border-box' }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function WsTags({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, background: 'var(--sw-bg-subtle)', borderRadius: 10, border: '1px solid transparent', minHeight: 40, alignItems: 'center' }}>
      {value.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 26, padding: '0 4px 0 10px', borderRadius: 8, background: 'var(--sw-bg-surface)', border: '1px solid var(--sw-line-default)', fontSize: 12, fontWeight: 700, color: 'var(--sw-text-secondary)' }}>
          {t}
          <button type="button" onClick={() => remove(i)} style={{ display: 'grid', placeItems: 'center', width: 18, height: 18, borderRadius: 6, color: 'var(--sw-text-assistive)' }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !input && value.length) remove(value.length - 1);
        }}
        placeholder={value.length ? '태그 추가…' : '쉼표 또는 엔터로 추가'}
        style={{ flex: 1, minWidth: 100, height: 26, background: 'none', border: 0, outline: 'none', fontSize: 13 }}
      />
    </div>
  );
}

function RadioCards({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', border: `1.5px solid ${value === o.value ? 'var(--sw-primary)' : 'var(--sw-line-default)'}`, borderRadius: 10, background: value === o.value ? 'var(--sw-primary-tint)' : 'var(--sw-bg-surface)', cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: value === o.value ? 'var(--sw-primary)' : 'var(--sw-text-primary)' }}>{o.label}</span>
          {o.desc && <span style={{ fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.45 }}>{o.desc}</span>}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ title, desc, value, onChange }: {
  title: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--sw-line-default)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sw-text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--sw-text-assistive)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{ width: 40, height: 24, borderRadius: 999, background: value ? 'var(--sw-primary)' : 'var(--sw-bg-muted)', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}
      >
        <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s' }} />
      </button>
    </div>
  );
}

function SectionHead({ icon: Icon, title, desc, danger }: {
  icon: React.ElementType; title: string; desc?: string; danger?: boolean;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--sw-text-primary)' }}>
        <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8, background: danger ? 'rgba(255,59,59,0.12)' : 'var(--sw-primary-tint)', color: danger ? 'var(--sw-status-negative)' : 'var(--sw-primary)', flexShrink: 0 }}>
          <Icon size={14} />
        </span>
        {title}
      </h2>
      {desc && <p style={{ margin: 0, fontSize: 13, color: 'var(--sw-text-assistive)', lineHeight: 1.55 }}>{desc}</p>}
    </div>
  );
}

// ─── Content sections ─────────────────────────────────────────────────────────

function SectionBasic({ title, genre, description, onChange }: {
  title: string; genre: string; description: string;
  onChange: (patch: { title?: string; genre?: string; description?: string }) => void;
}) {
  const [tags, setTags] = useState(['판타지', '성장', '모험', '1인칭', '여성주인공']);
  const [tagline, setTagline] = useState('잠들지 못한 채 펼쳐지는, 천 일의 꿈을 좇는 이야기.');
  return (
    <section id="basic" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={FileText} title="기본 정보" desc="제목과 장르, 시놉시스 — 작품의 정체성을 결정합니다." />
      <Row label="제목" required>
        <WsInput value={title} onChange={(v) => onChange({ title: v })} maxLength={60} />
      </Row>
      <Row label="한 줄 소개" hint="플랫폼 메인에 노출되는 카피">
        <WsInput value={tagline} onChange={setTagline} maxLength={80} />
      </Row>
      <Row label="장르" required>
        <WsSelect value={genre ?? 'fantasy'} onChange={(v) => onChange({ genre: v })} options={[
          { value: 'fantasy', label: '판타지' },
          { value: 'romance', label: '로맨스' },
          { value: 'romance-fantasy', label: '로맨스 판타지' },
          { value: 'modern', label: '현대물' },
          { value: 'regress', label: '회귀/환생/빙의' },
          { value: 'wuxia', label: '무협' },
          { value: 'thriller', label: '스릴러' },
          { value: 'other', label: '기타' },
        ]} />
      </Row>
      <Row label="시놉시스" hint="독자에게 보여지는 작품 설명">
        <WsTextarea value={description ?? ''} onChange={(v) => onChange({ description: v })} maxLength={1000} rows={6} placeholder="작품 소개를 입력하세요" />
      </Row>
      <Row label="태그" hint="검색·추천에 사용됩니다 (최대 10개)">
        <WsTags value={tags} onChange={(v) => setTags(v.slice(0, 10))} />
      </Row>
    </section>
  );
}

const COVER_COLORS = [
  { id: 'c1', bg: 'linear-gradient(180deg, #5A3A6E 0%, #C25B73 100%)' },
  { id: 'c2', bg: 'linear-gradient(180deg, #1B1740 0%, #5C3A8A 100%)' },
  { id: 'c3', bg: 'linear-gradient(180deg, #2A1A12 0%, #C9A24E 100%)' },
  { id: 'c4', bg: 'linear-gradient(180deg, #FFD580 0%, #8B4070 100%)' },
  { id: 'c5', bg: 'linear-gradient(180deg, #2E3A4A 0%, #B5C8D5 100%)' },
  { id: 'c6', bg: 'linear-gradient(180deg, #0F1620 0%, #2C3A4A 100%)' },
];

function SectionCover() {
  const [cover, setCover] = useState('c1');
  const selected = COVER_COLORS.find((c) => c.id === cover) ?? COVER_COLORS[0];
  return (
    <section id="cover" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={Image} title="커버 & 표지" desc="작품 목록과 챕터 사이드바에 표시되는 시각 요소입니다." />
      <Row label="커버 이미지">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 120, aspectRatio: '3/4', borderRadius: 10, background: selected.bg, display: 'grid', placeItems: 'center', fontSize: 40, flexShrink: 0 }}>🌙</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--sw-text-primary)' }}>
              <Image size={14} /> 이미지 업로드
            </button>
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--sw-text-assistive)' }}>
              <Sparkles size={14} /> AI로 생성
            </button>
            <p style={{ fontSize: 11, color: 'var(--sw-text-assistive)', margin: 0, lineHeight: 1.5 }}>권장 3:4 비율, 최대 5MB.</p>
          </div>
        </div>
      </Row>
      <Row label="컬러 테마" hint="이미지가 없을 때 사용됩니다">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COVER_COLORS.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCover(c.id)}
              style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, border: `2px solid ${cover === c.id ? 'var(--sw-text-primary)' : 'transparent'}`, cursor: 'pointer', boxShadow: cover === c.id ? '0 0 0 2px white inset' : 'none' }}
            />
          ))}
        </div>
      </Row>
    </section>
  );
}

function SectionPublish({ chapterCount }: { chapterCount: number }) {
  const [status, setStatus] = useState('active');
  const [targetChapters, setTargetChapters] = useState(80);
  const [chapterGoal, setChapterGoal] = useState(5000);
  const [startDate, setStartDate] = useState('2026-04-12');
  const progress = Math.min(100, Math.round((chapterCount / targetChapters) * 100));
  return (
    <section id="publish" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={BookOpen} title="연재 정보" desc="작품의 진행 상태와 목표를 관리합니다." />
      <Row label="연재 상태" required>
        <RadioCards value={status} onChange={setStatus} options={[
          { value: 'draft', label: '초안', desc: '혼자만 보이는 단계' },
          { value: 'active', label: '연재 중', desc: '회차를 발행하는 중' },
          { value: 'hiatus', label: '휴재', desc: '잠시 멈춤' },
          { value: 'completed', label: '완결', desc: '이야기가 끝났음' },
        ]} />
      </Row>
      <Row label="목표 회차" hint="전체 분량 추정 — 진행률에 사용">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <WsInput value={String(targetChapters)} onChange={(v) => setTargetChapters(Number(v) || 0)} />
          <span style={{ color: 'var(--sw-text-assistive)', fontSize: 13 }}>화</span>
        </div>
      </Row>
      <Row label="회차당 목표 글자 수">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <WsInput value={String(chapterGoal)} onChange={(v) => setChapterGoal(Number(v) || 0)} />
          <span style={{ color: 'var(--sw-text-assistive)', fontSize: 13 }}>자</span>
        </div>
      </Row>
      <Row label="연재 시작일">
        <WsInput value={startDate} onChange={setStartDate} placeholder="2026-05-01" />
      </Row>
      <Row label="현재 진행">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 14 }}>{chapterCount}화 / {targetChapters}화</span>
          <div style={{ flex: 1, height: 6, background: 'var(--sw-bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--sw-primary)' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--sw-text-assistive)', minWidth: 32 }}>{progress}%</span>
        </div>
      </Row>
    </section>
  );
}

function SectionAI() {
  const [model, setModel] = useState('claude');
  const [styleGuide, setStyleGuide] = useState('1인칭 현재형. 감각적 묘사(시각·후각·청각)를 풍부하게 사용. 대화체는 자연스러운 한국어 구어를 따른다.');
  const [prevChapter, setPrevChapter] = useState(true);
  const [characters, setCharacters] = useState(true);
  const [places, setPlaces] = useState(true);
  const [world, setWorld] = useState(false);
  const [bannedWords, setBannedWords] = useState(['그러나', '하지만']);
  const models = [
    { id: 'claude', name: 'Claude Sonnet 4.5', desc: '긴 문맥·일관된 문체에 강합니다', letter: 'C', color: '#C96442' },
    { id: 'gpt', name: 'GPT-4o', desc: '응답이 빠르고 아이디어 발산에 좋습니다', letter: 'G', color: '#0F8B6C' },
    { id: 'gemini', name: 'Gemini 2.0 Pro', desc: '매우 긴 컨텍스트 (200k+)를 다룹니다', letter: 'G', color: '#4889F4' },
  ];
  return (
    <section id="ai" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={Sparkles} title="AI 어시스턴트" desc="이 작품에서 AI가 따를 톤·맥락 규칙을 정합니다." />
      <Row label="기본 모델" required>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {models.map((m) => (
            <button type="button" key={m.id} onClick={() => setModel(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `1.5px solid ${model === m.id ? 'var(--sw-primary)' : 'var(--sw-line-default)'}`, borderRadius: 10, background: model === m.id ? 'var(--sw-primary-tint)' : 'var(--sw-bg-surface)', cursor: 'pointer' }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: m.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{m.letter}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sw-text-assistive)', marginTop: 1 }}>{m.desc}</div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${model === m.id ? 'var(--sw-primary)' : 'var(--sw-line-strong)'}`, background: model === m.id ? 'var(--sw-primary)' : 'none', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
                {model === m.id && <Check size={11} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
      </Row>
      <Row label="문체 가이드" hint="AI가 글을 생성할 때 따를 톤·문체·서술 시점">
        <WsTextarea value={styleGuide} onChange={setStyleGuide} maxLength={500} rows={4} placeholder="예: 1인칭, 현재형 시제 사용…" />
      </Row>
      <Row label="자동 컨텍스트" hint="AI 생성 시 자동으로 시스템 프롬프트에 포함됩니다">
        <div>
          <ToggleRow title="이전 챕터 요약 포함" desc="직전 1~2개 챕터의 요약을 컨텍스트에 자동 첨부합니다." value={prevChapter} onChange={setPrevChapter} />
          <ToggleRow title="등장 캐릭터 시트 포함" desc="현재 챕터에서 언급된 캐릭터의 설정을 자동 포함합니다." value={characters} onChange={setCharacters} />
          <ToggleRow title="장소 설정 포함" desc="배경이 되는 장소의 설정을 자동 포함합니다." value={places} onChange={setPlaces} />
          <ToggleRow title="세계관 규칙 포함" desc="마법체계·세력 등 세계관 규칙을 자동 포함합니다." value={world} onChange={setWorld} />
        </div>
      </Row>
      <Row label="금기어" hint="AI가 절대 사용하지 않을 단어 (쉼표 또는 엔터로 추가)">
        <WsTags value={bannedWords} onChange={setBannedWords} />
      </Row>
    </section>
  );
}

function SectionWriting() {
  const [font, setFont] = useState('pretendard');
  const [width, setWidth] = useState('medium');
  const [autoSave, setAutoSave] = useState(true);
  const [versionHistory, setVersionHistory] = useState(true);
  return (
    <section id="writing" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={PenLine} title="집필 환경" desc="이 작품의 에디터 기본 설정입니다." />
      <Row label="에디터 폰트">
        <WsSelect value={font} onChange={setFont} options={[
          { value: 'pretendard', label: 'Pretendard JP (산세리프)' },
          { value: 'noto', label: 'Noto Serif KR (세리프)' },
          { value: 'myeongjo', label: '나눔명조 (명조)' },
        ]} />
      </Row>
      <Row label="에디터 폭">
        <RadioCards value={width} onChange={setWidth} options={[
          { value: 'narrow', label: '좁게', desc: '약 640px — 집중' },
          { value: 'medium', label: '중간', desc: '약 760px — 권장' },
          { value: 'wide', label: '넓게', desc: '약 920px — 여유' },
        ]} />
      </Row>
      <Row label="자동 저장">
        <div>
          <ToggleRow title="자동 저장 사용" desc="입력이 멈춘 후 1.5초 뒤에 자동으로 저장합니다." value={autoSave} onChange={setAutoSave} />
          <ToggleRow title="버전 히스토리 보관" desc="시간별 스냅샷을 보관해 언제든 되돌릴 수 있습니다." value={versionHistory} onChange={setVersionHistory} />
        </div>
      </Row>
    </section>
  );
}

function SectionBackup() {
  const [backupFreq, setBackupFreq] = useState('daily');
  return (
    <section id="backup" style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={Save} title="백업 & 내보내기" desc="작품 데이터를 안전하게 보관하고 다른 형식으로 내보냅니다." />
      <Row label="자동 백업 주기">
        <WsSelect value={backupFreq} onChange={setBackupFreq} options={[
          { value: 'off', label: '사용 안 함' },
          { value: 'daily', label: '매일' },
          { value: 'weekly', label: '매주' },
        ]} />
      </Row>
      <Row label="내보내기" hint="모든 회차와 설정을 하나의 파일로">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['TXT (회차별)', 'TXT (전체)', 'EPUB', 'JSON (백업용)'].map((label) => (
            <button type="button" key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--sw-text-primary)' }}>
              <FileText size={13} /> {label}
            </button>
          ))}
        </div>
      </Row>
      <Row label="마지막 백업">
        <span style={{ fontSize: 13, color: 'var(--sw-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>2026-05-17 오전 03:00 — 자동 (12.4 MB)</span>
      </Row>
    </section>
  );
}

function SectionDanger({ novelId }: { novelId: string }) {
  const deleteMutation = useDeleteNovelMutation();
  const handleDelete = () => {
    if (window.confirm('모든 회차·캐릭터·설정이 즉시 삭제됩니다. 정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(novelId);
    }
  };
  return (
    <section id="danger" style={{ background: 'var(--sw-status-negative-bg)', borderRadius: 16, border: '1px solid rgba(255,59,59,0.2)', padding: '28px 32px', scrollMarginTop: 24 }}>
      <SectionHead icon={Bell} title="위험 영역" desc="아래 작업은 되돌릴 수 없습니다. 신중하게 선택하세요." danger />
      {[
        { title: '작품 보관 (Archive)', desc: '목록에서 숨기지만 데이터는 그대로 유지됩니다. 언제든 복원할 수 있습니다.', label: '보관', icon: Archive, danger: false },
        { title: '작품 복제', desc: '현재 작품의 설정과 회차를 그대로 복제한 새 작품을 만듭니다.', label: '복제', icon: Copy, danger: false },
      ].map((item) => (
        <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px dashed rgba(255,59,59,0.16)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sw-text-primary)' }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--sw-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
          </div>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <item.icon size={13} /> {item.label}
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sw-status-negative)' }}>작품 영구 삭제</div>
          <div style={{ fontSize: 12, color: 'var(--sw-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>모든 회차·캐릭터·설정이 즉시 삭제됩니다. 30일 내 복구 불가.</div>
        </div>
        <button type="button" onClick={handleDelete} disabled={deleteMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-status-negative)', background: 'none', color: 'var(--sw-status-negative)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} 영구 삭제
        </button>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface NovelSettingsPageProps {
  novel: Novel;
}

export function NovelSettingsPage({ novel }: NovelSettingsPageProps) {
  const navigate = useNavigate();
  const { data: chapters } = useChapters(novel.id);
  const firstChapterId = chapters?.[0]?.id;

  const goToEditor = () => {
    if (firstChapterId) {
      navigate({ to: '/novels/$novelId/chapters/$chapterId/edit', params: { novelId: novel.id, chapterId: firstChapterId } });
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const tokens = theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;

  const updateMutation = useUpdateNovelMutation();
  const [draft, setDraft] = useState({ title: novel.title, genre: novel.genre ?? 'fantasy', description: novel.description ?? '' });
  const [saved, setSaved] = useState(true);

  const handleChange = (patch: Partial<typeof draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    updateMutation.mutate({ id: novel.id, data: { title: draft.title, genre: draft.genre, description: draft.description } }, {
      onSuccess: () => setSaved(true),
    });
  };

  // Section nav + scroll spy
  const ALL_SECTIONS = [...SECTIONS, DANGER_SECTION];
  const [activeId, setActiveId] = useState<string>('basic');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleNavClick = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const scroller = contentRef.current;
    if (!scroller) return;
    const onScroll = () => {
      let curr = ALL_SECTIONS[0].id;
      for (const s of ALL_SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop - 100 <= scroller.scrollTop) curr = s.id;
      }
      setActiveId(curr);
    };
    scroller.addEventListener('scroll', onScroll);
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  // NavRail items
  const navItems = [
    { id: 'overview', label: '작품 설정', icon: BookOpen, active: true },
    { id: 'write', label: '글쓰기', icon: PenLine, onClick: goToEditor },
    { id: 'characters', label: '캐릭터', icon: Users, onClick: () => navigate({ to: '/novels/$novelId/characters', params: { novelId: novel.id } }) },
    { id: 'lorebook', label: '로어북', icon: Globe, disabled: true },
    { id: 'storybible', label: '스토리바이블', icon: BookMarked, disabled: true },
  ];

  return (
    <div
      className="sw-editor-root"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard JP Variable', 'Pretendard JP', -apple-system, sans-serif", ...tokens, background: 'var(--sw-bg-surface)', color: 'var(--sw-text-primary)' }}
    >
      {/* Top bar */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', borderBottom: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', flexShrink: 0, zIndex: 10 }}>
        <button type="button" onClick={() => navigate({ to: '/' })} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #0066FF, #0040CC)', display: 'grid', placeItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L13 6V14H3V6L8 2Z" fill="white" opacity="0.9"/><circle cx="8" cy="11" r="1.5" fill="white" opacity="0.7"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--sw-text-primary)' }}>StoryWriter</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sw-text-assistive)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>STUDIO</span>
        </button>
        <div style={{ flex: 1, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', background: 'var(--sw-bg-subtle)', borderRadius: 10, color: 'var(--sw-text-assistive)', fontSize: 13 }}>
            <Search size={14} /><span>검색</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--sw-bg-muted)', padding: '2px 6px', borderRadius: 5 }}>⌘K</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ width: 34, height: 34, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--sw-text-assistive)' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* NavRail */}
        <nav style={{ width: 64, background: 'var(--sw-bg-surface)', borderRight: '1px solid var(--sw-line-default)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 2, flexShrink: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                disabled={item.disabled}
                onClick={item.onClick}
                title={item.label}
                style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0', borderRadius: 10, color: item.active ? 'var(--sw-primary)' : 'var(--sw-text-assistive)', background: item.active ? 'var(--sw-primary-tint)' : 'none', border: 'none', cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.4 : 1, fontSize: 10, fontWeight: 500, letterSpacing: '0.03em' }}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button type="button" title="설정" style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0', borderRadius: 10, color: 'var(--sw-text-assistive)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500 }}>
            <Settings size={18} strokeWidth={1.8} />설정
          </button>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--sw-bg-subtle)' }}>
          {/* Sub-header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 32px', background: 'var(--sw-bg-surface)', borderBottom: '1px solid var(--sw-line-default)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(180deg, #5A3A6E 0%, #C25B73 100%)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>🌙</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--sw-text-assistive)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button type="button" onClick={goToEditor} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sw-text-assistive)', padding: 0, fontSize: 12 }}>{draft.title}</button>
                  <span>/</span>
                  <span>작품 설정</span>
                </div>
                <h1 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--sw-text-primary)' }}>작품 설정</h1>
              </div>
            </div>
            {saved && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--sw-status-positive)', fontWeight: 700 }}>
                <CheckCircle size={14} /> 모든 변경사항 저장됨
              </span>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={goToEditor} disabled={!firstChapterId} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', fontSize: 13, fontWeight: 600, cursor: firstChapterId ? 'pointer' : 'not-allowed', color: 'var(--sw-text-primary)', opacity: firstChapterId ? 1 : 0.4 }}>
                <PenLine size={14} /> 에디터로
              </button>
              <button type="button" onClick={handleSave} disabled={updateMutation.isPending || saved} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--sw-primary)', color: 'white', fontSize: 13, fontWeight: 700, cursor: saved ? 'default' : 'pointer', opacity: saved ? 0.5 : 1 }}>
                {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null} 변경사항 저장
              </button>
            </div>
          </div>

          {/* Settings body */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
            {/* Settings nav */}
            <aside style={{ borderRight: '1px solid var(--sw-line-default)', background: 'var(--sw-bg-surface)', padding: '24px 12px', overflowY: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--sw-text-assistive)', textTransform: 'uppercase', padding: '12px 12px 6px' }}>작품 관리</div>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button type="button" key={s.id} onClick={() => handleNavClick(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 12px', borderRadius: 8, color: activeId === s.id ? 'var(--sw-primary)' : 'var(--sw-text-secondary)', background: activeId === s.id ? 'var(--sw-primary-tint)' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left' }}>
                    <Icon size={14} style={{ opacity: 0.85, flexShrink: 0 }} />{s.label}
                  </button>
                );
              })}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--sw-text-assistive)', textTransform: 'uppercase', padding: '20px 12px 6px' }}>고급</div>
              <button type="button" onClick={() => handleNavClick('danger')} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 12px', borderRadius: 8, color: activeId === 'danger' ? 'var(--sw-status-negative)' : 'var(--sw-status-negative)', background: activeId === 'danger' ? 'var(--sw-status-negative-bg)' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left', opacity: 0.85 }}>
                <Bell size={14} style={{ flexShrink: 0 }} />위험 영역
              </button>
            </aside>

            {/* Scrollable content */}
            <div ref={contentRef} style={{ overflowY: 'auto', padding: '32px 40px 80px' }}>
              <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionBasic title={draft.title} genre={draft.genre} description={draft.description} onChange={handleChange} />
                <SectionCover />
                <SectionPublish chapterCount={novel.chapter_count} />
                <SectionAI />
                <SectionWriting />
                <SectionBackup />
                <SectionDanger novelId={novel.id} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
