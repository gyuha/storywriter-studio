import {
  BookOpen,
  BookText,
  Clock,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Novel } from '../types/novel';
import { NovelShell } from './novel-shell';

// ─── Role colors ──────────────────────────────────────────────────────────────

const ROLE_GRADIENT: Record<string, string> = {
  protag: 'linear-gradient(135deg, #FFD580, #FF8C42)',
  mentor: 'linear-gradient(135deg, #93C5FD, #3B82F6)',
  antag: 'linear-gradient(135deg, #2A2A2E, #0F1015)',
  ally: 'linear-gradient(135deg, #C4F0DA, #34D399)',
  memory: 'linear-gradient(135deg, #C4B5FD, #7C3AED)',
  mystery: 'linear-gradient(135deg, #4A5868, #1F2937)',
};

const ROLE_DOT: Record<string, string> = {
  protag: '#00BF40',
  mentor: '#0066FF',
  antag: '#FF3B3B',
  ally: '#00BF40',
  memory: '#9747FF',
  mystery: '#FF9200',
};

const BADGE_BG: Record<string, string> = {
  family: 'rgba(255,146,0,0.12)',
  lover: 'rgba(225,50,110,0.10)',
  ally: 'rgba(0,191,64,0.08)',
  enemy: 'rgba(255,59,59,0.06)',
  mentor: 'var(--sw-primary-tint)',
  mystery: 'rgba(151,71,255,0.12)',
};

const BADGE_COLOR: Record<string, string> = {
  family: '#C76A00',
  lover: '#C2185B',
  ally: '#00803F',
  enemy: '#B82828',
  mentor: 'var(--sw-primary)',
  mystery: '#6E2DB5',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharTrait {
  label: string;
  kind: 'pos' | 'neg' | 'neutral';
}

interface CharChapter {
  id: string;
  label: string;
}

interface CharRel {
  id: string;
  kind: string;
  title: string;
  note: string;
}

interface CharTimeline {
  when: string;
  what: string;
  key?: boolean;
}

interface Character {
  id: string;
  name: string;
  romanized: string;
  initial: string;
  role: string;
  roleLabel: string;
  tagline: string;
  attrs: Record<string, string>;
  appearance: string;
  personality: string;
  traits: CharTrait[];
  background: string;
  chapters: CharChapter[];
  rels: CharRel[];
  aiMemo: string;
  timeline: CharTimeline[];
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'harin',
    name: '유하린',
    romanized: 'Yu Harin',
    initial: '유',
    role: 'protag',
    roleLabel: '주인공',
    tagline: '잠들지 못한 채 천 일째 밤을 맞이한 17세 소녀. 어머니가 남긴 책 속의 문장이 그녀를 낯선 나라로 이끈다.',
    attrs: { 나이: '17세', 성별: '여성', 신장: '162cm', 생일: '겨울, 11월 8일', 눈: '어두운 갈색', 머리: '검은 단발', 체형: '마른 편' },
    appearance: '키는 평균보다 약간 작은 162cm. 어머니에게서 물려받은 어두운 갈색 눈동자가 깊고 차분하다. 검은 단발머리는 끝이 살짝 안으로 말려 있고, 잠들지 못한 밤이 길어진 탓에 늘 옅은 그림자가 눈 아래 드리워 있다.',
    personality: '호기심이 많고 한 번 마음에 둔 일은 끝까지 파고드는 성격. 겉으로는 조용하고 또래에 비해 어른스러워 보이지만, 마음 깊은 곳에는 어머니를 잃은 외로움이 자리 잡고 있다.',
    traits: [{ label: '호기심', kind: 'pos' }, { label: '용기', kind: 'pos' }, { label: '끈기', kind: 'pos' }, { label: '예민함', kind: 'neg' }, { label: '고집', kind: 'neg' }],
    background: '12살에 어머니를 잃은 뒤 아버지와 단둘이 살아왔다. 그 무렵부터 잠을 거의 자지 못하는 불면증이 시작되었고, 의사도 원인을 찾지 못했다. 어머니가 남긴 책 〈문 너머의 나라〉를 읽다가 자기 방의 한쪽 벽에 그림책 속과 똑같은 문이 새겨져 있다는 사실을 발견한다.',
    chapters: [{ id: 'p', label: '프롤로그' }, { id: '1', label: '1화' }, { id: '2', label: '2화' }, { id: '3', label: '3화' }, { id: '4', label: '4화' }, { id: '5', label: '5화' }],
    rels: [
      { id: 'gatekeeper', kind: 'mentor', title: '안내자', note: '낯선 나라에서 처음 만난 존재. 정체를 숨기고 있음.' },
      { id: 'byeoreul', kind: 'ally', title: '동행자', note: '위기에서 만난 빛 정령. 가장 가까운 친구가 되어 감.' },
      { id: 'shadow', kind: 'enemy', title: '운명적 적대', note: '유하린을 노리는 그림자. 정체 미지.' },
    ],
    aiMemo: '유하린의 시점에서 글을 쓸 때는 1인칭, 현재형 시제. 감각 묘사(특히 시각·청각)를 풍부하게. 감정 표현은 직설적이기보다 행동과 호흡으로 드러낸다.',
    timeline: [
      { when: '프롤로그', what: '어머니의 책 〈문 너머의 나라〉를 읽다가 방 벽의 문을 발견한다.', key: true },
      { when: '1화', what: '처음으로 문을 살짝 연다. 안에서 새어 나오는 빛에 두려움과 호기심을 동시에 느낀다.' },
      { when: '2화', what: '용기를 내어 문을 넘어선다. 낯선 나라의 첫 풍경을 마주한다.', key: true },
      { when: '3화', what: '달빛 정원에서 별이슬을 만난다. 동행이 시작된다.' },
    ],
  },
  {
    id: 'gatekeeper',
    name: '잠긴 문지기',
    romanized: 'The Gatekeeper',
    initial: '문',
    role: 'mentor',
    roleLabel: '조연 · 안내자',
    tagline: '낯선 나라의 입구에서 유하린을 처음 맞이한 존재. 모든 것을 알고 있지만 아무것도 알려주지 않는다.',
    attrs: { 나이: '추정 불가', 성별: '남성으로 보임', 신장: '180cm 이상', 눈: '은회색', 머리: '긴 회색 머리', 체형: '마른 장신' },
    appearance: '낡은 회색 망토를 두른 길쭉한 실루엣. 망토 자락이 늘 어딘가에서 불어오는 바람에 미세하게 흔들린다. 보이는 얼굴은 30대 초반쯤이지만 눈빛만큼은 수백 년을 살아본 듯하다.',
    personality: '거의 말이 없고 행동도 절제되어 있다. 그러나 결정적인 순간에는 짧은 한 마디로 상황을 바꿔 놓는다. 절대 거짓말은 하지 않지만, 진실 또한 절대 다 말해 주지 않는다.',
    traits: [{ label: '과묵함', kind: 'neutral' }, { label: '통찰', kind: 'pos' }, { label: '유머', kind: 'pos' }, { label: '비밀주의', kind: 'neg' }],
    background: '낯선 나라의 입구를 지키는 존재. 정체는 작품 후반부까지 베일에 싸여 있다. 판탈로 대공과 깊은 관계가 있으며, 유하린의 어머니 또한 그를 알고 있었던 듯하다.',
    chapters: [{ id: '2', label: '2화' }, { id: '3', label: '3화' }, { id: '4', label: '4화' }, { id: '5', label: '5화' }],
    rels: [
      { id: 'harin', kind: 'mentor', title: '유하린의 안내자', note: '한 발 떨어진 거리에서 그녀를 돕는다.' },
      { id: 'pantalo', kind: 'ally', title: '오래된 인연', note: '천 년 전부터 알고 지낸 사이.' },
      { id: 'shadow', kind: 'enemy', title: '오랜 적', note: '옛 봉인의 한 축을 담당했다.' },
    ],
    aiMemo: '문지기의 대사는 반드시 짧고 정확하게. 비유나 은유는 자주 사용하되 결론을 내리지 않는 형태(질문으로 끝나는 문장 선호)로.',
    timeline: [{ when: '2화', what: '유하린이 문을 넘어선 직후 첫 등장. 그녀의 이름을 부른다.', key: true }],
  },
  {
    id: 'byeoreul',
    name: '별이슬',
    romanized: 'Byeoreul',
    initial: '별',
    role: 'ally',
    roleLabel: '조연 · 동행',
    tagline: '손바닥만 한 빛 정령. 잃어버린 빛 정령의 마지막 후예다.',
    attrs: { 나이: '정령 — 나이 개념 없음', 성별: '성 없음', 신장: '약 10cm', 색: '푸르고 따뜻한 빛', 형태: '구체 모양' },
    appearance: '유하린의 손바닥에 올라설 수 있을 만큼 작은, 은은한 푸른 빛으로 빛나는 구체. 기분에 따라 빛의 색이 미세하게 변한다. 즐거울 때는 따뜻한 노란빛, 슬플 때는 차가운 파란빛.',
    personality: '명랑하고 다정하며 위로의 말을 잘 건넨다. 가벼운 듯하지만 위기 상황에서는 의외로 영리한 판단을 한다.',
    traits: [{ label: '다정함', kind: 'pos' }, { label: '충직', kind: 'pos' }, { label: '낙천', kind: 'pos' }, { label: '감정적', kind: 'neg' }],
    background: '한때 낯선 나라를 가득 채웠던 빛 정령들의 마지막 후예. 동족들이 사라진 이유를 알지 못한 채 홀로 떠돌다 유하린을 만난다.',
    chapters: [{ id: '3', label: '3화' }, { id: '4', label: '4화' }, { id: '5', label: '5화' }],
    rels: [{ id: 'harin', kind: 'ally', title: '처음 만난 친구', note: '유하린을 따라다니며 위로하고 도움을 준다.' }],
    aiMemo: '별이슬의 대사는 짧고 밝게. 의성어·의태어를 자유롭게 사용해도 좋다. 빛의 색 묘사를 감정 단서로 활용할 것.',
    timeline: [{ when: '3화', what: '달빛 정원에서 유하린에게 처음 다가온다. 함께하기로 한다.', key: true }],
  },
  {
    id: 'pantalo',
    name: '판탈로 대공',
    romanized: 'Grand Duke Pantalo',
    initial: '판',
    role: 'memory',
    roleLabel: '회상 · 전 통치자',
    tagline: '천 년 전 낯선 나라를 빚어낸 마법사. 그의 슬픔이 모든 이야기의 시작이다.',
    attrs: { 나이: '외형 30대 후반', 성별: '남성', 신장: '188cm', 눈: '푸른 눈', 머리: '금발' },
    appearance: '고전적인 군주의 모습. 금발은 어깨까지 닿고, 푸른 눈은 늘 무언가를 그리워하는 빛을 띤다. 입가에는 옅은 미소가 새겨져 있지만 그 미소가 한 번도 슬픔과 분리되어 본 적이 없다.',
    personality: '강인하고 사려 깊으나 끝없는 슬픔을 품고 산다. 사랑하는 이를 지키기 위해 세계를 갈라 놓았고, 그 대가로 영원한 고독을 받아들였다.',
    traits: [{ label: '사려 깊음', kind: 'pos' }, { label: '결단력', kind: 'pos' }, { label: '고독', kind: 'neg' }, { label: '회한', kind: 'neg' }],
    background: '천 년 전 그림자에 의해 사랑하던 이를 잃은 마법사. 그림자를 영원히 봉인하기 위해 자기 자신의 세계를 둘로 갈라놓았다.',
    chapters: [{ id: 'p', label: '프롤로그' }, { id: '5', label: '5화 (회상)' }],
    rels: [
      { id: 'shadow', kind: 'enemy', title: '운명의 적', note: '천 년 동안 봉인을 유지해 왔다.' },
      { id: 'gatekeeper', kind: 'ally', title: '오래된 친구', note: '낯선 나라를 함께 지킨다.' },
    ],
    aiMemo: '판탈로의 대사는 격식 있는 옛스러운 어투. 직접 등장보다는 회상 장면이나 누군가의 입을 통해 묘사되는 편이 좋다.',
    timeline: [{ when: '프롤로그', what: '그의 일기가 어머니의 책 첫 장에 실린다.', key: true }],
  },
  {
    id: 'shadow',
    name: '그림자 인영',
    romanized: 'The Shadow',
    initial: '影',
    role: 'antag',
    roleLabel: '적대',
    tagline: '이름도, 형체도 없는 존재. 모든 것을 삼키려는 욕망 자체.',
    attrs: { 나이: '측정 불가', 성별: '없음', 신장: '형체 없음', 색: '검은 안개', 형태: '사람의 그림자 형태' },
    appearance: '특정한 모습이 없다. 누군가의 그림자가 갑자기 일어서듯, 어둠 속에서 사람 형상으로 굳어졌다가 다시 안개로 흩어진다. 눈만큼은 늘 두 점의 붉은 빛으로 또렷이 보인다.',
    personality: '감정이 있는지조차 분명치 않다. 그러나 본능적으로 \'완전함\'을 갈망한다. 천 년 전 봉인된 분노가 응축되어, 모든 빛을 흡수하려 한다.',
    traits: [{ label: '탐욕', kind: 'neg' }, { label: '집요함', kind: 'neg' }, { label: '침묵', kind: 'neutral' }],
    background: '천 년 전 판탈로 대공의 사랑하는 이를 죽인 정체불명의 존재. 봉인된 채 천 년을 보냈지만, 봉인이 약해지기 시작하면서 다시 형체를 갖춰 가고 있다.',
    chapters: [{ id: '4', label: '4화' }, { id: '5', label: '5화' }],
    rels: [
      { id: 'harin', kind: 'enemy', title: '다음 목표', note: '유하린의 빛에서 무언가를 감지한다.' },
      { id: 'pantalo', kind: 'enemy', title: '오랜 적', note: '원한이 천 년을 거슬러 올라간다.' },
    ],
    aiMemo: '그림자의 대사는 극도로 절제한다. 차라리 행동(어둠이 길어진다, 빛이 잠시 꺼진다 등)으로 존재를 드러낸다.',
    timeline: [{ when: '4화', what: '유하린의 뒤에서 처음으로 \'긴 그림자\'가 따라온다.', key: true }],
  },
  {
    id: 'raven',
    name: '검은 까마귀',
    romanized: 'Black Raven',
    initial: '鴉',
    role: 'mystery',
    roleLabel: '미스터리',
    tagline: '두 세계를 오가는 메신저. 그의 부리에 무엇이 매여 있는지 아무도 모른다.',
    attrs: { 나이: '불명', 성별: '남성으로 추정', 신장: '175cm (인간형)', 형태: '까마귀와 인간을 오감' },
    appearance: '인간의 모습일 때는 검은 망토에 깊이 눌러쓴 후드. 까마귀의 모습일 때는 평범한 새보다 한 뼘쯤 크다. 한쪽 다리에 작은 끈이 묶여 있다.',
    personality: '차갑고 비밀스러우며 절대 자기 입장을 드러내지 않는다. 유하린을 돕는 듯한 행동을 하지만, 결정적인 순간에는 사라진다.',
    traits: [{ label: '비밀', kind: 'neg' }, { label: '기민함', kind: 'pos' }, { label: '냉정', kind: 'neutral' }],
    background: '양쪽 세계의 메시지를 전하는 자. 누구의 편인지는 작품 후반까지 밝혀지지 않는다.',
    chapters: [{ id: '3', label: '3화' }, { id: '5', label: '5화' }],
    rels: [{ id: 'harin', kind: 'mystery', title: '관찰자', note: '그녀의 곁에 자주 나타난다.' }],
    aiMemo: '검은 까마귀의 등장은 항상 짧고, 늘 무언가를 두고 떠나야 한다. 직접 대사보다는 인용·암호·종이쪽지 형식이 어울린다.',
    timeline: [{ when: '3화', what: '달빛 정원 나뭇가지 위에서 유하린을 내려다본다.', key: true }],
  },
];

const ROLE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'protag', label: '주인공' },
  { id: 'mentor', label: '조연' },
  { id: 'ally', label: '동행' },
  { id: 'antag', label: '적대' },
  { id: 'memory', label: '회상' },
  { id: 'mystery', label: '미스터리' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({ char, size, fontSize }: { char: Character; size: number; fontSize: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ROLE_GRADIENT[char.role] ?? '#888',
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontWeight: 800,
        fontSize,
        flexShrink: 0,
        position: 'relative',
        fontFamily: 'inherit',
      }}
    >
      {char.initial}
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: ROLE_DOT[char.role] ?? '#888',
          border: '2px solid var(--sw-bg-surface)',
        }}
      />
    </div>
  );
}

function Section({ icon: Icon, title, showEdit = true, children }: {
  icon: React.ElementType;
  title: string;
  showEdit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '24px 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 6, background: 'var(--sw-primary-tint)', color: 'var(--sw-primary)', flexShrink: 0 }}>
          <Icon size={13} />
        </span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.010em', flex: 1, color: 'var(--sw-text-primary)' }}>{title}</h3>
        {showEdit && (
          <button type="button" style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-assistive)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
            편집
          </button>
        )}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--sw-text-secondary)', letterSpacing: '-0.002em' }}>
        {children}
      </div>
    </section>
  );
}

function RelCard({ rel, allChars, onSelect }: { rel: CharRel; allChars: Character[]; onSelect: (id: string) => void }) {
  const target = allChars.find((c) => c.id === rel.id);
  if (!target) return null;

  const badgeBg = BADGE_BG[rel.kind] ?? 'var(--sw-bg-surface)';
  const badgeColor = BADGE_COLOR[rel.kind] ?? 'var(--sw-text-secondary)';

  return (
    <button
      type="button"
      onClick={() => onSelect(target.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--sw-bg-subtle)', borderRadius: 12, border: '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.1s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sw-line-strong)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_GRADIENT[target.role] ?? '#888', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
        {target.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.030em', marginBottom: 3, background: badgeBg, color: badgeColor }}>
          {rel.title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.004em', color: 'var(--sw-text-primary)' }}>{target.name}</div>
        <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.4, marginTop: 1 }}>{rel.note}</div>
      </div>
    </button>
  );
}

function CharList({ items, currentId, setCurrentId, roleFilter, setRoleFilter, search, setSearch }: {
  items: Character[];
  currentId: string;
  setCurrentId: (id: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  return (
    <aside style={{ width: 300, flexShrink: 0, background: 'var(--sw-bg-surface)', borderRight: '1px solid var(--sw-line-default)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* List header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '18px 16px 12px', borderBottom: '1px solid var(--sw-line-default)', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--sw-text-primary)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          캐릭터
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>{items.length}</span>
        </h2>
        <button
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px', borderRadius: 8, background: 'var(--sw-primary)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.010em' }}
        >
          <Plus size={12} /> 추가
        </button>
      </div>

      {/* Search */}
      <div style={{ margin: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', background: 'var(--sw-bg-subtle)', border: '1px solid transparent', borderRadius: 8, color: 'var(--sw-text-assistive)' }}>
        <Search size={13} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 별명 검색"
          style={{ flex: 1, background: 'none', border: 0, outline: 'none', fontSize: 13, color: 'var(--sw-text-primary)' }}
        />
      </div>

      {/* Role filter chips */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px', flexWrap: 'wrap' }}>
        {ROLE_FILTERS.map((r) => {
          const active = roleFilter === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              style={{ height: 26, padding: '0 9px', borderRadius: 9999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? 'var(--sw-text-primary)' : 'var(--sw-bg-subtle)', color: active ? '#FFFFFF' : 'var(--sw-text-assistive)' }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Character list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {items.map((c) => {
          const active = c.id === currentId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCurrentId(c.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', marginBottom: 2, borderRadius: 12, cursor: 'pointer', width: '100%', background: active ? 'var(--sw-primary-tint)' : 'none', border: active ? '1px solid var(--sw-primary-tint-2)' : '1px solid transparent', textAlign: 'left', transition: 'background-color 0.1s' }}
            >
              <AvatarCircle char={c} size={38} fontSize={14} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.004em', color: 'var(--sw-text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', letterSpacing: '0.020em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.roleLabel}</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--sw-text-assistive)', background: 'var(--sw-bg-muted)', borderRadius: 4, padding: '1px 5px' }}>{c.chapters.length}회</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--sw-text-assistive)', fontSize: 13 }}>검색 결과가 없습니다.</div>
        )}
      </div>
    </aside>
  );
}

function CharDetail({ char, allChars, onSelect }: { char: Character; allChars: Character[]; onSelect: (id: string) => void }) {
  const topAttrs = Object.entries(char.attrs).slice(0, 4);

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--sw-bg-canvas)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero header */}
        <header style={{ position: 'relative', padding: '40px 48px 32px', marginBottom: 24, borderRadius: '0 0 24px 24px', overflow: 'hidden', background: 'var(--sw-bg-surface)', borderBottom: '1px solid var(--sw-line-default)' }}>
          {/* Blurred bg */}
          <div style={{ position: 'absolute', inset: 0, background: ROLE_GRADIENT[char.role] ?? '#888', opacity: 0.1, pointerEvents: 'none', filter: 'blur(40px)', transform: 'scale(1.2)' }} />
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', gap: 28, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: ROLE_GRADIENT[char.role] ?? '#888', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 44, letterSpacing: '-0.025em', flexShrink: 0, boxShadow: '0 6px 24px rgba(0,0,0,0.10)', fontFamily: 'inherit' }}>
              {char.initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 9999, background: 'var(--sw-bg-subtle)', color: 'var(--sw-text-secondary)', fontSize: 11, fontWeight: 700, letterSpacing: '0.030em', marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_DOT[char.role] ?? '#888' }} />
                {char.roleLabel}
              </span>
              <h1 style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--sw-text-primary)' }}>{char.name}</h1>
              <div style={{ fontSize: 14, color: 'var(--sw-text-assistive)', letterSpacing: '0.020em', fontFamily: 'monospace', marginBottom: 10 }}>{char.romanized}</div>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--sw-text-secondary)', lineHeight: 1.55, letterSpacing: '-0.004em', maxWidth: 540 }}>{char.tagline}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['편집', '복제', '···'].map((label) => (
                <button key={label} type="button" title={label} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--sw-bg-surface)', display: 'grid', placeItems: 'center', color: 'var(--sw-text-secondary)', border: '1px solid var(--sw-line-default)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 40px 80px' }}>
          {/* Quick stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${topAttrs.length}, 1fr)`, gap: 1, background: 'var(--sw-line-default)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
            {topAttrs.map(([k, v]) => (
              <div key={k} style={{ background: 'var(--sw-bg-surface)', padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', fontWeight: 600, letterSpacing: '0.030em', marginBottom: 4, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sw-text-primary)', letterSpacing: '-0.004em', fontFamily: 'monospace' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* 외형 */}
          <Section icon={User} title="외형">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--sw-line-default)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              {Object.entries(char.attrs).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--sw-bg-subtle)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', letterSpacing: '0.020em', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sw-text-primary)', letterSpacing: '-0.002em' }}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{ margin: 0 }}>{char.appearance}</p>
          </Section>

          {/* 성격 */}
          <Section icon={User} title="성격">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {char.traits.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 28,
                    padding: '0 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '-0.002em',
                    background: t.kind === 'pos' ? 'var(--sw-status-positive-bg)' : t.kind === 'neg' ? 'var(--sw-status-negative-bg)' : 'var(--sw-bg-subtle)',
                    color: t.kind === 'pos' ? '#00803F' : t.kind === 'neg' ? '#B82828' : 'var(--sw-text-secondary)',
                  }}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <p style={{ margin: 0 }}>{char.personality}</p>
          </Section>

          {/* 배경/서사 */}
          <Section icon={BookText} title="배경 / 서사">
            <p style={{ margin: 0 }}>{char.background}</p>
          </Section>

          {/* 관계 */}
          <Section icon={Users} title={`관계 (${char.rels.length})`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {char.rels.map((r, i) => (
                <RelCard key={i} rel={r} allChars={allChars} onSelect={onSelect} />
              ))}
            </div>
          </Section>

          {/* 전개/타임라인 */}
          <Section icon={Clock} title="전개 / 타임라인" showEdit={false}>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
              {char.timeline.map((t, i) => (
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, padding: '10px 0', position: 'relative', borderLeft: `2px solid ${t.key ? 'var(--sw-primary)' : 'var(--sw-line-default)'}`, marginLeft: 6, paddingLeft: 16 }}
                >
                  <div style={{ position: 'absolute', left: -7, top: 16, width: 12, height: 12, borderRadius: '50%', background: t.key ? 'var(--sw-primary)' : 'var(--sw-bg-surface)', border: `2px solid ${t.key ? 'var(--sw-primary)' : 'var(--sw-line-strong)'}` }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>{t.when}</div>
                  <div style={{ fontSize: 13, color: 'var(--sw-text-secondary)', lineHeight: 1.55 }}>{t.what}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* 등장 챕터 */}
          <Section icon={BookOpen} title="등장 챕터" showEdit={false}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {char.chapters.map((c) => (
                <span
                  key={c.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--sw-bg-subtle)', fontSize: 12, fontWeight: 700, color: 'var(--sw-text-secondary)', border: '1px solid var(--sw-line-default)', fontFamily: 'monospace', fontFeatureSettings: '"tnum"' }}
                >
                  {c.label}
                </span>
              ))}
            </div>
          </Section>

          {/* AI 메모 */}
          <Section icon={Sparkles} title="AI 메모 — 이 캐릭터를 쓸 때">
            <div style={{ display: 'flex', gap: 12, padding: 14, background: 'linear-gradient(135deg, var(--sw-primary-tint) 0%, rgba(232,240,255,0.4) 100%)', borderRadius: 12, border: '1px solid var(--sw-primary-tint-2)', fontSize: 13, lineHeight: 1.65, color: 'var(--sw-text-primary)' }}>
              <Sparkles size={14} style={{ color: 'var(--sw-primary)', marginTop: 2, flexShrink: 0 }} />
              <span>{char.aiMemo}</span>
            </div>
          </Section>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface CharactersPageProps {
  novel: Novel;
}

export function CharactersPage({ novel }: CharactersPageProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentId, setCurrentId] = useState(SAMPLE_CHARACTERS[0].id);

  const filtered = useMemo(() => {
    return SAMPLE_CHARACTERS.filter((c) => {
      if (roleFilter !== 'all' && c.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.romanized.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [roleFilter, search]);

  const current = useMemo(
    () => SAMPLE_CHARACTERS.find((c) => c.id === currentId) ?? SAMPLE_CHARACTERS[0],
    [currentId],
  );

  return (
    <NovelShell novelId={novel.id} activeNav="characters">
      {/* Character list */}
        <CharList
          items={filtered}
          currentId={currentId}
          setCurrentId={setCurrentId}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          search={search}
          setSearch={setSearch}
        />

        {/* Character detail */}
        <CharDetail char={current} allChars={SAMPLE_CHARACTERS} onSelect={setCurrentId} />
    </NovelShell>
  );
}
