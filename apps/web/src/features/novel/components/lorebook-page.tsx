import {
  BookOpen,
  BookText,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Lightbulb,
  MapPin,
  Maximize2,
  Network,
  Package,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import type { Novel } from '../types/novel';
import { NovelShell } from './novel-shell';

// ─── Category palette ─────────────────────────────────────────────────────────

const CAT_COLOR_LIGHT: Record<string, string> = {
  place: '#3A7DD0',
  faction: '#B83D5E',
  race: '#1F8A5B',
  magic: '#7A4BD0',
  item: '#C76A00',
  event: '#C42030',
  term: '#5A6470',
};


const HERO_GRADIENT: Record<string, string> = {
  place: 'linear-gradient(135deg, #6FA8DC 0%, #1F4E79 100%)',
  faction: 'linear-gradient(135deg, #E37A95 0%, #6B1D38 100%)',
  race: 'linear-gradient(135deg, #67D4A6 0%, #145E40 100%)',
  magic: 'linear-gradient(135deg, #B89BFF 0%, #4A2A8A 100%)',
  item: 'linear-gradient(135deg, #FFCC80 0%, #8A4B12 100%)',
  event: 'linear-gradient(135deg, #FF8893 0%, #7A1620 100%)',
  term: 'linear-gradient(135deg, #B0BBC6 0%, #404A56 100%)',
};

const HERO_BG: Record<string, string> = {
  place: 'radial-gradient(60% 70% at 20% 30%, #6FA8DC, transparent 70%), radial-gradient(60% 70% at 80% 70%, #1F4E79, transparent 70%)',
  faction: 'radial-gradient(60% 70% at 20% 30%, #E37A95, transparent 70%), radial-gradient(60% 70% at 80% 70%, #6B1D38, transparent 70%)',
  race: 'radial-gradient(60% 70% at 20% 30%, #67D4A6, transparent 70%)',
  magic: 'radial-gradient(60% 70% at 20% 30%, #B89BFF, transparent 70%), radial-gradient(60% 70% at 80% 70%, #4A2A8A, transparent 70%)',
  item: 'radial-gradient(60% 70% at 20% 30%, #FFCC80, transparent 70%)',
  event: 'radial-gradient(60% 70% at 20% 30%, #FF8893, transparent 70%), radial-gradient(60% 70% at 80% 70%, #7A1620, transparent 70%)',
  term: 'radial-gradient(60% 70% at 20% 30%, #B0BBC6, transparent 70%)',
};

const ROLE_GRADIENT: Record<string, string> = {
  protag: 'linear-gradient(135deg, #FFD580, #FF8C42)',
  mentor: 'linear-gradient(135deg, #93C5FD, #3B82F6)',
  antag: 'linear-gradient(135deg, #2A2A2E, #0F1015)',
  ally: 'linear-gradient(135deg, #C4F0DA, #34D399)',
  memory: 'linear-gradient(135deg, #C4B5FD, #7C3AED)',
  mystery: 'linear-gradient(135deg, #4A5868, #1F2937)',
};

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'place',   label: '장소',       icon: MapPin },
  { id: 'faction', label: '세력 · 단체', icon: Users },
  { id: 'race',    label: '종족',       icon: User },
  { id: 'magic',   label: '마법 체계',   icon: Sparkles },
  { id: 'item',    label: '사물 · 유물', icon: Package },
  { id: 'event',   label: '사건 · 연표', icon: Clock },
  { id: 'term',    label: '용어',       icon: BookText },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type AiMode = 'always' | 'trigger' | 'manual';

interface LoreRel {
  id: string;
  kind: string;
  label: string;
}

interface LoreTimeline {
  when: string;
  what: string;
  key?: boolean;
}

interface LoreEntry {
  id: string;
  name: string;
  romanized: string;
  glyph: string;
  cat: string;
  aliases: string[];
  tagline: string;
  attrs: Record<string, string>;
  canon: number;
  description: string;
  keywords: string[];
  keywordsRegex?: string[];
  aiMode: AiMode;
  aiTokens: { entry: number; budget: number };
  rels: LoreRel[];
  chapters: string[];
  timeline: LoreTimeline[];
  aiMemo: string;
}

interface CharRef {
  name: string;
  role: string;
  glyph: string;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_ENTRIES: LoreEntry[] = [
  {
    id: 'strange-land', name: '낯선 나라', romanized: 'The Strange Land', glyph: '낯',
    cat: 'place', aliases: ['문 너머', '잠들지 않는 나라'],
    tagline: '달이 지지 않는 영원한 밤의 세계. 천 년 전 판탈로 대공이 자신의 슬픔을 가두기 위해 빚어낸 평행 세계다.',
    attrs: { 위치: '현실과 평행한 차원', 지리: '달빛 정원 · 천 년 탑 · 봉인의 문', 시간: '지구 시간 1분 = 약 30분', 거주민: '빛 정령, 회상자, 그림자', 출입: "'문'을 통해서만", 통화: '은달 (Moonsilver)' },
    canon: 4,
    description: '현실의 시간과 어긋난 채로 펼쳐진 영원한 박명의 세계. 하늘에는 늘 푸르스름한 보름달이 떠 있고, 모든 빛은 그 달에서부터 흘러나온다. **달의 광량이 줄어들수록 그림자가 짙어진다.** 천 년 전 *판탈로 대공*이 사랑하는 이를 잃고, 그 슬픔에서 비롯된 분노를 봉인하기 위해 자신의 세계를 둘로 쪼개 만든 곳이다.\n\n이 나라에서는 잠들면 현실로 돌아가지 못한다. 그래서 거주민들은 잠을 자지 않는다.',
    keywords: ['낯선 나라', '문 너머', '이상한 나라', '달의 세계', '박명의 나라'],
    keywordsRegex: ['문 ?너머의 ?나라'],
    aiMode: 'trigger',
    aiTokens: { entry: 612, budget: 1200 },
    rels: [
      { id: 'moonlit-garden', kind: 'place', label: '포함' },
      { id: 'millennium-tower', kind: 'place', label: '포함' },
      { id: 'seal-door', kind: 'place', label: '출입구' },
      { id: 'millennium-seal', kind: 'event', label: '결과' },
    ],
    chapters: ['프롤로그', '2화', '3화', '4화', '5화'],
    timeline: [
      { when: '천 년 전', what: '판탈로 대공이 세계를 쪼개어 만들어냄.', key: true },
      { when: '2화', what: '유하린이 처음으로 발을 디딘다.', key: true },
      { when: '5화', what: '봉인의 약화 — 그림자가 다시 형체를 갖춤.' },
    ],
    aiMemo: "장소를 묘사할 때는 항상 '달빛'과 '박명' 키워드로 톤을 잡는다. 시간이 어긋난다는 점을 잊지 말 것.",
  },
  {
    id: 'moonlit-garden', name: '달빛 정원', romanized: 'Moonlit Garden', glyph: '庭',
    cat: 'place', aliases: ['은빛 정원'],
    tagline: '낯선 나라의 입구를 지나면 가장 먼저 마주하는, 은백색 식물이 피어난 정원. 빛 정령들의 마지막 안식처다.',
    attrs: { 위치: '낯선 나라 · 봉인의 문 너머', 특징: '달빛만으로 자라는 식물', 주민: '별이슬을 비롯한 빛 정령 잔존자', 위험도: '낮음' },
    canon: 4,
    description: '검고 부드러운 흙 위로 은백색의 *밤꽃*이 빈틈없이 피어난 작은 정원. 꽃 한 송이는 한 사람의 잊혀진 기억과 짝지어져 있다고 전해진다. 유하린이 별이슬을 처음 만나는 장소이며, **달의 광량이 그 어디보다 짙은 곳**이라 그림자의 침입이 어렵다.',
    keywords: ['달빛 정원', '은빛 정원', '밤꽃', '은백색 꽃'],
    aiMode: 'trigger', aiTokens: { entry: 248, budget: 1200 },
    rels: [
      { id: 'strange-land', kind: 'place', label: '소속' },
      { id: 'light-spirits', kind: 'race', label: '주민' },
    ],
    chapters: ['3화', '4화'],
    timeline: [{ when: '3화', what: '유하린이 별이슬을 처음 만난다.', key: true }],
    aiMemo: '묘사 시 모노톤(은·흑·회)에 집중하고, 단 하나의 따뜻한 색만 점처럼 찍을 것.',
  },
  {
    id: 'millennium-tower', name: '천 년 탑', romanized: 'Millennium Tower', glyph: '塔',
    cat: 'place', aliases: ['봉인의 탑', '판탈로의 탑'],
    tagline: '그림자를 봉인한 천 년 된 탑. 가장 깊은 층에 봉인의 핵이 있다.',
    attrs: { 위치: '낯선 나라 중앙', 층수: '표면 33층 / 실제 알 수 없음', 건축: '판탈로 대공' },
    canon: 3,
    description: '낯선 나라 한가운데 하늘을 향해 솟은 검은 탑. 외벽에는 천 년 전의 \'봉인 주문\'이 빼곡히 새겨져 있다. 탑은 위로 올라갈수록 좁아지는 것처럼 보이지만, 내부의 층은 실제로는 *내려가는 구조*다.',
    keywords: ['천 년 탑', '봉인의 탑', '판탈로의 탑', '검은 탑'],
    aiMode: 'manual', aiTokens: { entry: 184, budget: 1200 },
    rels: [{ id: 'strange-land', kind: 'place', label: '소속' }, { id: 'millennium-seal', kind: 'event', label: '봉인의 장소' }],
    chapters: ['5화'],
    timeline: [{ when: '5화', what: '유하린이 처음으로 탑을 멀리서 본다.', key: true }],
    aiMemo: "탑의 '내부가 아래로 향한다'는 설정은 5화 클라이맥스에서만 명시할 것.",
  },
  {
    id: 'seal-door', name: '봉인의 문', romanized: 'The Sealed Door', glyph: '扉',
    cat: 'place', aliases: ['방의 문', '어머니의 문'],
    tagline: '유하린의 방 벽에 새겨진 문. 어머니가 남긴 책 속 그림과 같은 모양이다.',
    attrs: { 위치: '유하린의 방 / 낯선 나라 입구', 상태: '약화된 봉인', 재질: '검은 떡갈나무', 특징: '유하린에게만 보임' },
    canon: 5,
    description: '현실과 낯선 나라를 잇는 유일한 통로. 어머니의 죽음 이후 *유하린에게만 보이게 되었다*. 문을 여는 순간 시간이 잠시 멈추는 듯한 감각이 있다.',
    keywords: ['문', '봉인의 문', '방의 문', '어머니의 문', '벽의 문'],
    aiMode: 'always', aiTokens: { entry: 156, budget: 1200 },
    rels: [{ id: 'strange-land', kind: 'place', label: '출구' }, { id: 'mothers-book', kind: 'item', label: '관련 유물' }],
    chapters: ['프롤로그', '1화', '2화'],
    timeline: [
      { when: '프롤로그', what: '유하린이 처음으로 발견한다.', key: true },
      { when: '2화', what: '처음으로 문을 넘어선다.', key: true },
    ],
    aiMemo: "문이 '보이는' 묘사는 항상 유하린의 시점에서. 다른 인물의 시점에서는 벽으로 묘사할 것.",
  },
  {
    id: 'light-spirits', name: '빛 정령', romanized: 'Light Spirits', glyph: '靈',
    cat: 'race', aliases: ['밤꽃의 아이들'],
    tagline: '한때 낯선 나라를 가득 채웠던 작은 빛의 존재들. 그림자에 의해 거의 멸종했다.',
    attrs: { 수명: '수백~수천 년', 크기: '5~15cm', '현재 개체수': '약 12개체 (추정)', 약점: '광량 부족' },
    canon: 4,
    description: '달빛을 머금고 태어나, 자신만의 빛을 가지고 살아가는 작은 존재들. 감정에 따라 빛의 색이 변한다. **천 년 전 그림자에 의해 대부분이 사라졌으며**, 현재는 달빛 정원에 소수가 남아 있다.',
    keywords: ['빛 정령', '정령', '광령', '밤꽃의 아이'],
    aiMode: 'trigger', aiTokens: { entry: 220, budget: 1200 },
    rels: [{ id: 'moonlit-garden', kind: 'place', label: '마지막 거처' }],
    chapters: ['3화', '4화'],
    timeline: [
      { when: '천 년 전', what: '대부분이 그림자에 의해 사라짐.', key: true },
      { when: '3화', what: '별이슬이 마지막 후예임이 드러난다.' },
    ],
    aiMemo: "단순한 '귀여운 동행'이 아니다. 그들의 '마지막성'과 '쓸쓸함'을 잊지 말 것.",
  },
  {
    id: 'sleep-law', name: '잠과 꿈의 법칙', romanized: 'Law of Sleep & Dream', glyph: '律',
    cat: 'magic', aliases: ['꿈의 법칙'],
    tagline: "낯선 나라를 지배하는 가장 근본적인 규칙. '잠들면 돌아가지 못한다.'",
    attrs: { 유형: '세계 법칙 (마법 아님)', 예외: '잠들지 못하는 자', 발견: '천 년 전 판탈로' },
    canon: 5,
    description: '낯선 나라에 머무는 동안 한 번이라도 잠이 들면, 현실로 돌아오는 길은 영원히 닫힌다. 단 하나의 예외가 있다 — **태어날 때부터 잠들지 못하는 자**.\n\n이 법칙은 유하린이 이 세계의 \'열쇠\'가 될 수밖에 없는 이유의 핵심이다.',
    keywords: ['잠과 꿈의 법칙', '꿈의 법칙', '잠들면', '불면증'],
    aiMode: 'always', aiTokens: { entry: 198, budget: 1200 },
    rels: [{ id: 'strange-land', kind: 'place', label: '적용 범위' }],
    chapters: ['2화', '5화'],
    timeline: [{ when: '2화', what: '문지기가 유하린에게 처음 설명한다.', key: true }],
    aiMemo: '이 법칙은 작품의 코어 룰. AI가 글을 생성할 때 *항상* 백그라운드 컨텍스트로 포함되어야 한다.',
  },
  {
    id: 'mothers-book', name: '문 너머의 나라', romanized: 'Beyond the Door', glyph: '本',
    cat: 'item', aliases: ['어머니의 책', '그림책'],
    tagline: '유하린의 어머니가 남긴 그림책. 단순한 동화처럼 보이지만, 사실 모든 비밀의 안내서다.',
    attrs: { 형태: '삽화가 있는 그림책 (256면)', 저자: '유하린의 어머니 (필명 不明)', 출판: '사가본 — 한 권만 존재' },
    canon: 5,
    description: '12살에 어머니를 잃은 유하린이 유품 상자에서 발견한 책. 표지에는 *낯선 나라의 문*과 똑같은 그림이 그려져 있다. 책장을 넘길 때마다 한 페이지씩 새로운 글이 떠오르는데, **유하린만 그것을 읽을 수 있다.**',
    keywords: ['문 너머의 나라', '어머니의 책', '그림책', '책'],
    aiMode: 'trigger', aiTokens: { entry: 176, budget: 1200 },
    rels: [{ id: 'seal-door', kind: 'place', label: '그려진 대상' }],
    chapters: ['프롤로그', '1화'],
    timeline: [{ when: '프롤로그', what: "유하린이 책에서 '문'의 그림을 발견.", key: true }],
    aiMemo: "책이 '유하린에게만 새로운 글을 보여준다'는 설정을 유지할 것.",
  },
  {
    id: 'millennium-seal', name: '천 년 전 봉인', romanized: 'The Millennium Seal', glyph: '封',
    cat: 'event', aliases: ['대공의 봉인'],
    tagline: '판탈로 대공이 그림자를 가두기 위해 자기 세계를 둘로 갈라놓은 사건. 모든 이야기의 시작.',
    attrs: { 시점: '현재로부터 약 1000년 전', 관여자: '판탈로, 문지기, 정령족', 대가: '세계의 분리, 영원한 박명' },
    canon: 4,
    description: "판탈로 대공이 사랑하는 이를 잃은 직후, 그림자를 영원히 가두기 위해 자기 자신의 세계를 둘로 갈라놓은 의식. 봉인의 핵은 *천 년 탑*의 가장 깊은 곳에 있으며, 천 년이 지나며 점차 약해지고 있다.",
    keywords: ['천 년 봉인', '봉인', '대공의 봉인', '천 년 전'],
    aiMode: 'trigger', aiTokens: { entry: 162, budget: 1200 },
    rels: [
      { id: 'millennium-tower', kind: 'place', label: '장소' },
      { id: 'strange-land', kind: 'place', label: '결과' },
    ],
    chapters: ['프롤로그', '5화'],
    timeline: [
      { when: '1000년 전', what: '판탈로가 봉인을 시전한다.', key: true },
      { when: '5화', what: '유하린이 봉인의 약화를 처음 목격한다.', key: true },
    ],
    aiMemo: "'봉인'이라는 단어는 작품 후반부까지 명확히 설명하지 않는다. '옛 약속' 등의 우회 표현을 선호할 것.",
  },
  {
    id: 'shadow-term', name: '그림자', romanized: 'Shadow', glyph: '影',
    cat: 'term', aliases: ['長影', '긴 그림자'],
    tagline: '이름이 아니라, 현상의 호칭. 빛이 약해질 때 길어지는 존재 그 자체를 일컫는다.',
    attrs: { 유형: '고유명사이자 현상', '관련 캐릭터': '그림자 인영 (등장인물)' },
    canon: 3,
    description: '작품 내에서 *그림자*는 두 가지 의미로 사용된다. 첫째, 빛이 약해지는 자연 현상. 둘째, 천 년 전 봉인된 *존재*. 두 의미는 사실 같은 것이라는 사실은 5화 중반에 밝혀진다.',
    keywords: ['그림자', '긴 그림자', '그림자가 길어'],
    aiMode: 'always', aiTokens: { entry: 128, budget: 1200 },
    rels: [{ id: 'millennium-seal', kind: 'event', label: '관련 사건' }],
    chapters: ['4화', '5화'],
    timeline: [],
    aiMemo: "'그림자'가 길어진다는 묘사는 항상 *현장의 빛이 줄어드는 인과*와 함께 써야 자연스럽다.",
  },
  {
    id: 'shadow-army', name: '그림자의 군세', romanized: 'The Shadow Host', glyph: '軍',
    cat: 'faction', aliases: ['검은 군대'],
    tagline: '봉인이 약해지며 그림자에서 떨어져 나온 분신들의 무리. 그 자체로는 의지가 없다.',
    attrs: { 규모: '현재 약 100여 개체', 성장: '봉인이 약해질수록 증가', 지휘: '그림자 인영' },
    canon: 3,
    description: '그림자의 일부가 떨어져 나와 사람의 형상을 흉내내는 그림자 무리. 빛에 닿으면 흩어지지만, **달의 광량이 약한 곳에서는 거의 무한히 재생된다.**',
    keywords: ['그림자 군세', '그림자 군대', '검은 군대'],
    aiMode: 'manual', aiTokens: { entry: 132, budget: 1200 },
    rels: [{ id: 'shadow-term', kind: 'term', label: '어원' }],
    chapters: ['5화'],
    timeline: [{ when: '5화', what: '처음으로 다수가 출현한다.', key: true }],
    aiMemo: "'분신'은 사람을 닮았지만, 항상 어딘가가 '하나 부족한' 형상이어야 한다.",
  },
];

const CHARS_INDEX: Record<string, CharRef> = {
  harin: { name: '유하린', role: 'protag', glyph: '유' },
  pantalo: { name: '판탈로 대공', role: 'memory', glyph: '판' },
  byeoreul: { name: '별이슬', role: 'ally', glyph: '별' },
  shadow: { name: '그림자 인영', role: 'antag', glyph: '影' },
  gatekeeper: { name: '잠긴 문지기', role: 'mentor', glyph: '문' },
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function renderRich(text: string): ReactNode {
  const lines = text.split('\n').filter(Boolean);
  return lines.map((line, li) => {
    const parts: ReactNode[] = [];
    let rest = line;
    let k = 0;
    while (rest.length > 0) {
      const bm = rest.match(/^\*\*(.+?)\*\*/);
      const em = rest.match(/^\*(.+?)\*/);
      if (bm) {
        parts.push(<strong key={k++} style={{ color: 'var(--sw-text-primary)', fontWeight: 700 }}>{bm[1]}</strong>);
        rest = rest.slice(bm[0].length);
      } else if (em) {
        parts.push(<em key={k++} style={{ fontStyle: 'normal', background: 'var(--sw-primary-tint)', color: 'var(--sw-primary)', padding: '0 4px', borderRadius: 3, fontWeight: 700, fontSize: '0.95em' }}>{em[1]}</em>);
        rest = rest.slice(em[0].length);
      } else {
        const m = rest.match(/^[^*]+/);
        const chunk = m ? m[0] : rest[0];
        parts.push(<span key={k++}>{chunk}</span>);
        rest = rest.slice(chunk.length);
      }
    }
    return <p key={li} style={{ margin: li < lines.length - 1 ? '0 0 14px' : '0' }}>{parts}</p>;
  });
}

// ─── AI Include Panel ─────────────────────────────────────────────────────────

const AI_MODES = [
  { id: 'always' as AiMode, t: '항상 포함', d: '이 작품의 모든 생성에 자동으로 컨텍스트로 들어갑니다.' },
  { id: 'trigger' as AiMode, t: '키워드 트리거', d: '본문에 아래 키워드가 등장하면 자동으로 첨부합니다.' },
  { id: 'manual' as AiMode, t: '수동', d: '사용자가 @로 직접 참조할 때만 포함합니다.' },
];

function AIIncludePanel({ entry, onChangeMode }: { entry: LoreEntry; onChangeMode?: (m: AiMode) => void }) {
  const pct = Math.min(100, Math.round((entry.aiTokens.entry / entry.aiTokens.budget) * 100));
  const ringDash = 2 * Math.PI * 28;
  const ringOffset = ringDash * (1 - pct / 100);

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--sw-primary-tint) 0%, rgba(232,240,255,0.35) 100%)', border: '1px solid var(--sw-primary-tint-2)', borderRadius: 16, padding: '20px 24px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 26, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', background: 'var(--sw-primary)', color: 'white', flexShrink: 0 }}>
            <Sparkles size={13} />
          </span>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '-0.004em', color: 'var(--sw-text-primary)' }}>AI 자동 포함 규칙</h3>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--sw-text-assistive)', fontWeight: 600 }}>AI가 글을 쓸 때 이 항목을 언제 컨텍스트에 넣을지 결정합니다</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {AI_MODES.map((m) => {
            const active = entry.aiMode === m.id;
            const dotBg = m.id === 'always' ? 'var(--sw-primary)' : m.id === 'trigger' ? 'var(--sw-status-cautionary)' : 'var(--sw-line-strong)';
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMode?.(m.id)}
                style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--sw-bg-surface)', borderRadius: 8, border: `1.5px solid ${active ? 'var(--sw-primary)' : 'transparent'}`, cursor: 'pointer', boxShadow: active ? '0 0 0 2px var(--sw-primary-tint)' : 'none' }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-primary)', letterSpacing: '-0.002em' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotBg, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                  {m.t}
                </div>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.45, marginTop: 3 }}>{m.d}</span>
              </button>
            );
          })}
        </div>

        {entry.aiMode === 'trigger' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: 8, background: 'var(--sw-bg-surface)', borderRadius: 8, border: '1px solid var(--sw-primary-tint-2)' }}>
            {entry.keywords.map((k, i) => (
              <span key={`k${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 4px 0 9px', borderRadius: 4, background: 'var(--sw-primary-tint)', color: 'var(--sw-primary)', fontSize: 12, fontWeight: 700 }}>
                {k}
                <span style={{ width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 3, fontSize: 14, color: 'var(--sw-primary)', cursor: 'pointer' }}>×</span>
              </span>
            ))}
            {(entry.keywordsRegex ?? []).map((k, i) => (
              <span key={`r${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 4px 0 9px', borderRadius: 4, background: 'rgba(255,153,0,0.12)', color: '#B86A00', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                /{k}/
                <span style={{ width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 3, fontSize: 14, cursor: 'pointer' }}>×</span>
              </span>
            ))}
            <input placeholder="키워드 추가 (Enter)" style={{ flex: 1, minWidth: 90, height: 24, background: 'none', border: 0, outline: 'none', fontSize: 12, color: 'var(--sw-text-primary)' }} />
          </div>
        )}

        {entry.aiMode === 'always' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--sw-bg-surface)', borderRadius: 8, border: '1px solid var(--sw-primary-tint-2)', fontSize: 12, color: 'var(--sw-text-secondary)', lineHeight: 1.55 }}>
            <CheckCircle size={14} style={{ color: 'var(--sw-primary)', flexShrink: 0 }} />
            이 항목은 <strong style={{ color: 'var(--sw-text-primary)', margin: '0 3px' }}>작품 시스템 프롬프트의 일부</strong>로 항상 첨부됩니다.
            매 생성마다 토큰을 사용하므로 핵심 설정에만 권장합니다.
          </div>
        )}

        {entry.aiMode === 'manual' && (
          <div style={{ padding: '10px 12px', background: 'var(--sw-bg-surface)', borderRadius: 8, fontSize: 12, color: 'var(--sw-text-assistive)', lineHeight: 1.55 }}>
            에디터에서 <kbd style={{ fontFamily: 'monospace', padding: '1px 5px', background: 'var(--sw-bg-subtle)', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'var(--sw-text-primary)' }}>@{entry.name}</kbd> 처럼 직접 참조할 때만 포함됩니다.
          </div>
        )}
      </div>

      {/* Token gauge */}
      <div title={`${entry.aiTokens.entry} / ${entry.aiTokens.budget} 토큰`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 96, padding: '12px 8px', background: 'var(--sw-bg-surface)', borderRadius: 12, border: '1px solid var(--sw-primary-tint-2)' }}>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 4 }}>
          <svg width="64" height="64" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
            <circle cx="32" cy="32" r="28" stroke="var(--sw-bg-muted)" strokeWidth="6" fill="none" />
            <circle cx="32" cy="32" r="28" stroke={pct > 80 ? 'var(--sw-status-cautionary)' : 'var(--sw-primary)'} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={ringDash} strokeDashoffset={ringOffset} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: 'var(--sw-text-primary)', letterSpacing: '-0.020em', textAlign: 'center', lineHeight: 1.2 }}>
            {entry.aiTokens.entry}
            <span style={{ fontSize: 9, color: 'var(--sw-text-assistive)', fontFamily: 'sans-serif', fontWeight: 600 }}>/{entry.aiTokens.budget}t</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--sw-text-assistive)', fontWeight: 700, letterSpacing: '0.030em', textAlign: 'center', lineHeight: 1.3, textTransform: 'uppercase' }}>토큰<br />점유율</div>
      </div>
    </div>
  );
}

// ─── Mini relationship graph ──────────────────────────────────────────────────

function LoreMiniGraph({ entry, entries }: { entry: LoreEntry; entries: LoreEntry[] }) {
  const W = 560, H = 220, cx = W / 2, cy = H / 2;
  const items = entry.rels.slice(0, 6);

  const nodes = items.map((rel, i) => {
    const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * 78 * 1.6;
    const y = cy + Math.sin(angle) * 78;
    const tgt = entries.find((e) => e.id === rel.id);
    const char = CHARS_INDEX[rel.id];
    return {
      x, y, rel,
      glyph: tgt ? tgt.glyph : char ? char.glyph : '?',
      color: tgt ? `var(--sw-cat-${tgt.cat}, #888)` : 'var(--sw-text-primary)',
      catColor: tgt ? (CAT_COLOR_LIGHT[tgt.cat] ?? '#888') : '#888',
      label: tgt ? tgt.name : char ? char.name : rel.id,
    };
  });

  const catColor = CAT_COLOR_LIGHT[entry.cat] ?? '#888';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxHeight: 240 }} aria-label="관계 미리보기">
      <defs>
        <filter id="soft-lore">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {nodes.map((n, i) => (
        <line key={`e${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="var(--sw-line-default)" strokeWidth="1.5" />
      ))}
      <circle cx={cx} cy={cy} r="28" fill={catColor} opacity="0.15" filter="url(#soft-lore)" />
      <circle cx={cx} cy={cy} r="24" fill={catColor} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{entry.glyph}</text>
      <text x={cx} y={cy + 46} textAnchor="middle" fill="var(--sw-text-primary)" fontSize="11" fontWeight="700">{entry.name}</text>
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={n.x} cy={n.y} r="18" fill="var(--sw-bg-surface)" stroke={n.catColor} strokeWidth="2" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fill={n.catColor} fontSize="13" fontWeight="800">{n.glyph}</text>
          <text x={n.x} y={n.y + 34} textAnchor="middle" fill="var(--sw-text-secondary)" fontSize="10" fontWeight="600">{n.label}</text>
          <text x={n.x} y={n.y - 24} textAnchor="middle" fill="var(--sw-text-assistive)" fontSize="9" fontWeight="600" letterSpacing="0.04em">{n.rel.label.toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Relation card ────────────────────────────────────────────────────────────

function LoreRelCard({ rel, entries, onSelect }: { rel: LoreRel; entries: LoreEntry[]; onSelect?: (id: string) => void }) {
  const loreTarget = entries.find((e) => e.id === rel.id);
  if (loreTarget) {
    const catColor = CAT_COLOR_LIGHT[loreTarget.cat] ?? '#888';
    const catLabel = CATEGORIES.find((c) => c.id === loreTarget.cat)?.label ?? loreTarget.cat;
    return (
      <button
        type="button"
        onClick={() => onSelect?.(loreTarget.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--sw-bg-subtle)', borderRadius: 12, border: '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.1s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sw-line-strong)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, background: catColor, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{loreTarget.glyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.020em', marginBottom: 3, background: `${catColor}22`, color: catColor }}>{rel.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.004em', color: 'var(--sw-text-primary)' }}>{loreTarget.name}</div>
          <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.4, marginTop: 1 }}>{catLabel} · {loreTarget.tagline.slice(0, 28)}…</div>
        </div>
      </button>
    );
  }

  const charTarget = CHARS_INDEX[rel.id];
  if (charTarget) {
    return (
      <button
        type="button"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--sw-bg-subtle)', borderRadius: 12, border: '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.1s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--sw-line-strong)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_GRADIENT[charTarget.role] ?? '#888', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{charTarget.glyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginBottom: 3, background: 'var(--sw-primary-tint)', color: 'var(--sw-primary)' }}>캐릭터 · {rel.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.004em', color: 'var(--sw-text-primary)' }}>{charTarget.name}</div>
          <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', lineHeight: 1.4, marginTop: 1 }}>캐릭터 페이지로 이동</div>
        </div>
      </button>
    );
  }

  return null;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function LBSection({ icon: Icon, title, showEdit = true, action, children }: {
  icon: React.ElementType;
  title: string;
  showEdit?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={{ background: 'var(--sw-bg-surface)', borderRadius: 16, border: '1px solid var(--sw-line-default)', padding: '24px 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 6, background: 'var(--sw-primary-tint)', color: 'var(--sw-primary)', flexShrink: 0 }}>
          <Icon size={13} />
        </span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.010em', flex: 1, color: 'var(--sw-text-primary)' }}>{title}</h3>
        {action}
        {showEdit && !action && (
          <button type="button" style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-assistive)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>편집</button>
        )}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--sw-text-secondary)', letterSpacing: '-0.002em' }}>{children}</div>
    </section>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function LoreDetail({ entry, entries, onSelect, showGraph, onChangeMode }: {
  entry: LoreEntry;
  entries: LoreEntry[];
  onSelect: (id: string) => void;
  showGraph: boolean;
  onChangeMode: (m: AiMode) => void;
}) {
  const catColor = CAT_COLOR_LIGHT[entry.cat] ?? '#888';
  const catLabel = CATEGORIES.find((c) => c.id === entry.cat)?.label ?? entry.cat;

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--sw-bg-canvas)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero */}
        <header style={{ position: 'relative', padding: '36px 48px 32px', marginBottom: 24, background: 'var(--sw-bg-surface)', borderBottom: '1px solid var(--sw-line-default)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: HERO_BG[entry.cat] ?? '', opacity: 0.10, filter: 'blur(60px)', transform: 'scale(1.3)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', gap: 28, alignItems: 'center' }}>
            {/* Glyph card (3:4 ratio) */}
            <div style={{ width: 112, height: 149, borderRadius: 24, background: HERO_GRADIENT[entry.cat] ?? '#888', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 56, letterSpacing: '-0.025em', flexShrink: 0, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              {entry.glyph}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.30) 0%, transparent 55%)', pointerEvents: 'none' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px 0 8px', borderRadius: 9999, background: 'var(--sw-bg-subtle)', color: 'var(--sw-text-secondary)', fontSize: 11, fontWeight: 700, letterSpacing: '0.030em', marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: catColor, display: 'inline-block' }} />
                {catLabel}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', margin: '0 0 4px' }}>
                <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.028em', margin: 0, color: 'var(--sw-text-primary)' }}>{entry.name}</h1>
                <span style={{ fontSize: 14, color: 'var(--sw-text-assistive)', letterSpacing: '0.020em', fontFamily: 'monospace', fontWeight: 500 }}>{entry.romanized}</span>
              </div>
              {entry.aliases.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 12px' }}>
                  {entry.aliases.map((a, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 4, background: 'var(--sw-bg-subtle)', color: 'var(--sw-text-secondary)', fontSize: 11, fontWeight: 600 }}>
                      {i === 0 && <span style={{ color: 'var(--sw-text-assistive)', marginRight: 3 }}>또는 </span>}
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 15, color: 'var(--sw-text-secondary)', lineHeight: 1.6, letterSpacing: '-0.004em', maxWidth: 560, margin: '0 0 14px' }}>{entry.tagline}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 8px', borderRadius: 4, background: 'var(--sw-bg-subtle)', fontSize: 11, fontWeight: 700, color: 'var(--sw-text-secondary)' }}>
                  정전성
                  <span style={{ display: 'inline-flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= entry.canon ? 'var(--sw-status-positive)' : 'var(--sw-line-strong)' }} />
                    ))}
                  </span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>
                  ID: {entry.id} · {entry.chapters.length}회 등장
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-start' }}>
              {['편집', '복제', '···'].map((label) => (
                <button key={label} type="button" style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--sw-bg-surface)', display: 'grid', placeItems: 'center', color: 'var(--sw-text-secondary)', border: '1px solid var(--sw-line-default)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 40px 80px' }}>
          {/* AI Include Panel — signature UX */}
          <AIIncludePanel entry={entry} onChangeMode={onChangeMode} />

          {/* Mini relationship graph */}
          {showGraph && entry.rels.length > 0 && (
            <LBSection
              icon={Network}
              title={`관계도 — ${entry.name}`}
              showEdit={false}
              action={
                <button type="button" style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-assistive)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Maximize2 size={11} /> 전체 보기
                </button>
              }
            >
              <div style={{ background: 'var(--sw-bg-subtle)', borderRadius: 12, padding: '8px 4px' }}>
                <LoreMiniGraph entry={entry} entries={entries} />
              </div>
            </LBSection>
          )}

          {/* Attributes */}
          <LBSection icon={FileText} title="속성">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--sw-line-default)', borderRadius: 12, overflow: 'hidden' }}>
              {Object.entries(entry.attrs).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--sw-bg-subtle)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, color: 'var(--sw-text-assistive)', letterSpacing: '0.020em', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sw-text-primary)', letterSpacing: '-0.002em' }}>{v}</div>
                </div>
              ))}
            </div>
          </LBSection>

          {/* Description */}
          <LBSection icon={BookText} title="본문 설정">
            {renderRich(entry.description)}
          </LBSection>

          {/* Relations */}
          {entry.rels.length > 0 && (
            <LBSection icon={Network} title={`관련 항목 (${entry.rels.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {entry.rels.map((r, i) => (
                  <LoreRelCard key={i} rel={r} entries={entries} onSelect={onSelect} />
                ))}
              </div>
            </LBSection>
          )}

          {/* Timeline */}
          {entry.timeline.length > 0 && (
            <LBSection icon={Clock} title="등장 / 전개" showEdit={false}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {entry.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 16, padding: '10px 0', borderLeft: `2px solid ${t.key ? 'var(--sw-primary)' : 'var(--sw-line-default)'}`, marginLeft: 6, paddingLeft: 18, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -7, top: 16, width: 12, height: 12, borderRadius: '50%', background: t.key ? 'var(--sw-primary)' : 'var(--sw-bg-surface)', border: `2px solid ${t.key ? 'var(--sw-primary)' : 'var(--sw-line-strong)'}` }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>{t.when}</div>
                    <div style={{ fontSize: 13, color: 'var(--sw-text-secondary)', lineHeight: 1.55 }}>{t.what}</div>
                  </div>
                ))}
              </div>
            </LBSection>
          )}

          {/* Chapters */}
          <LBSection icon={BookOpen} title="등장 챕터" showEdit={false}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {entry.chapters.map((c) => (
                <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--sw-bg-subtle)', fontSize: 12, fontWeight: 700, color: 'var(--sw-text-secondary)', border: '1px solid var(--sw-line-default)', fontFamily: 'monospace', fontFeatureSettings: '"tnum"' }}>
                  {c}
                </span>
              ))}
            </div>
          </LBSection>

          {/* AI memo */}
          <LBSection icon={Sparkles} title="AI 메모 — 이 항목을 다룰 때">
            <div style={{ display: 'flex', gap: 12, padding: 14, background: 'linear-gradient(135deg, var(--sw-primary-tint) 0%, rgba(232,240,255,0.4) 100%)', borderRadius: 12, border: '1px solid var(--sw-primary-tint-2)', fontSize: 13, lineHeight: 1.65, color: 'var(--sw-text-primary)' }}>
              <Lightbulb size={14} style={{ color: 'var(--sw-primary)', marginTop: 2, flexShrink: 0 }} />
              <span>{entry.aiMemo}</span>
            </div>
          </LBSection>
        </div>
      </div>
    </section>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type ViewMode = 'category' | 'alpha' | 'graph';

function LoreSide({ entries, currentId, setCurrentId, search, setSearch, mode, setMode, openCats, toggleCat }: {
  entries: LoreEntry[];
  currentId: string;
  setCurrentId: (id: string) => void;
  search: string;
  setSearch: (s: string) => void;
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  openCats: Record<string, boolean>;
  toggleCat: (id: string) => void;
}) {
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) m[e.cat] = (m[e.cat] ?? 0) + 1;
    return m;
  }, [entries]);

  const aiStats = useMemo(() => {
    const s = { always: 0, trigger: 0, manual: 0 };
    for (const e of entries) s[e.aiMode]++;
    return s;
  }, [entries]);

  return (
    <aside style={{ width: 320, flexShrink: 0, background: 'var(--sw-bg-surface)', borderRight: '1px solid var(--sw-line-default)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '18px 16px 14px', borderBottom: '1px solid var(--sw-line-default)', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--sw-text-primary)', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          로어북
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>{entries.length}</span>
        </h2>
        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px', borderRadius: 8, background: 'var(--sw-primary)', color: 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Plus size={12} /> 항목 추가
        </button>
      </div>

      {/* Search */}
      <div style={{ margin: '12px 16px 6px', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', background: 'var(--sw-bg-subtle)', border: '1px solid transparent', borderRadius: 8, color: 'var(--sw-text-assistive)' }}>
        <Search size={13} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목, 별칭, 키워드 검색"
          style={{ flex: 1, background: 'none', border: 0, outline: 'none', fontSize: 13, color: 'var(--sw-text-primary)' }}
        />
      </div>

      {/* View mode switch */}
      <div style={{ display: 'inline-flex', margin: '0 16px 8px', padding: 3, background: 'var(--sw-bg-subtle)', borderRadius: 8 }}>
        {(['category', 'alpha', 'graph'] as ViewMode[]).map((m) => {
          const labels = { category: '카테고리', alpha: '가나다순', graph: '관계도' };
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{ flex: 1, height: 26, padding: '0 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '-0.002em', color: active ? 'var(--sw-text-primary)' : 'var(--sw-text-assistive)', background: active ? 'var(--sw-bg-surface)' : 'none', border: 'none', cursor: 'pointer', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Entry list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {mode === 'category' && CATEGORIES.map((cat) => {
          const list = entries.filter((e) => e.cat === cat.id);
          if (list.length === 0) return null;
          const isOpen = openCats[cat.id] !== false;
          const color = CAT_COLOR_LIGHT[cat.id] ?? '#888';
          const CatIcon = cat.icon;
          return (
            <div key={cat.id} style={{ marginBottom: 4 }}>
              <button
                type="button"
                onClick={() => toggleCat(cat.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px 8px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: 'var(--sw-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', letterSpacing: '0.010em' }}
              >
                <ChevronDown size={12} style={{ color: 'var(--sw-text-assistive)', flexShrink: 0, transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                <span style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 6, background: color, flexShrink: 0 }}>
                  <CatIcon size={12} color="white" />
                </span>
                <span style={{ flex: 1 }}>{cat.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--sw-text-assistive)', background: 'var(--sw-bg-subtle)', padding: '2px 7px', borderRadius: 9999 }}>
                  {catCounts[cat.id] ?? 0}
                </span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '2px 0 8px 32px' }}>
                  {list.map((e) => {
                    const active = e.id === currentId;
                    const dotBg = e.aiMode === 'always' ? 'var(--sw-primary)' : e.aiMode === 'trigger' ? 'var(--sw-status-cautionary)' : 'var(--sw-line-strong)';
                    const dotShadow = e.aiMode === 'always' ? '0 0 0 2px var(--sw-primary-tint)' : 'none';
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setCurrentId(e.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', background: active ? 'var(--sw-primary-tint)' : 'none', border: active ? '1px solid var(--sw-primary-tint-2)' : '1px solid transparent', position: 'relative' }}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0, background: color }}>{e.glyph}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: active ? 700 : 600, color: 'var(--sw-text-primary)', letterSpacing: '-0.002em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotBg, boxShadow: dotShadow, flexShrink: 0 }} title={e.aiMode === 'always' ? '항상 포함' : e.aiMode === 'trigger' ? '키워드 트리거' : '수동'} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {mode === 'alpha' && (
          <div style={{ padding: '4px 0' }}>
            {[...entries].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((e) => {
              const active = e.id === currentId;
              const color = CAT_COLOR_LIGHT[e.cat] ?? '#888';
              const dotBg = e.aiMode === 'always' ? 'var(--sw-primary)' : e.aiMode === 'trigger' ? 'var(--sw-status-cautionary)' : 'var(--sw-line-strong)';
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setCurrentId(e.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', background: active ? 'var(--sw-primary-tint)' : 'none', border: active ? '1px solid var(--sw-primary-tint-2)' : '1px solid transparent', marginBottom: 1 }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, color: 'white', flexShrink: 0, background: color }}>{e.glyph}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--sw-text-primary)', letterSpacing: '-0.002em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotBg, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {mode === 'graph' && (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--sw-text-assistive)', fontSize: 12, lineHeight: 1.6 }}>
            관계도 보기는 디테일 패널 상단에서 미리보기로 표시됩니다.
            <br /><br />
            <span style={{ display: 'inline-block', padding: '4px 8px', background: 'var(--sw-bg-subtle)', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>곧 출시</span>
          </div>
        )}

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--sw-text-assistive)', fontSize: 13 }}>검색 결과가 없습니다.</div>
        )}
      </div>

      {/* Footer: AI stats */}
      <div style={{ borderTop: '1px solid var(--sw-line-default)', padding: '12px 14px', background: 'var(--sw-bg-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--sw-text-primary)' }}>
          <Sparkles size={12} style={{ color: 'var(--sw-primary)' }} /> AI 자동 포함 상태
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--sw-text-assistive)', fontFamily: 'monospace' }}>
          {[
            { color: 'var(--sw-primary)', count: aiStats.always, label: '항상' },
            { color: 'var(--sw-status-cautionary)', count: aiStats.trigger, label: '트리거' },
            { color: 'var(--sw-line-strong)', count: aiStats.manual, label: '수동' },
          ].map((s) => (
            <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <b style={{ color: 'var(--sw-text-primary)', fontWeight: 700, fontFamily: 'sans-serif' }}>{s.count}</b>&nbsp;{s.label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface LorebookPageProps {
  novel: Novel;
}

export function LorebookPage({ novel }: LorebookPageProps) {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<ViewMode>('category');
  const [currentId, setCurrentId] = useState(SAMPLE_ENTRIES[0].id);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [entries, setEntries] = useState<LoreEntry[]>(SAMPLE_ENTRIES);
  const [showGraph] = useState(true);

  const toggleCat = (id: string) => setOpenCats((s) => ({ ...s, [id]: s[id] === false ? true : false }));

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.romanized.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)) ||
      e.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [entries, search]);

  const current = useMemo(
    () => entries.find((e) => e.id === currentId) ?? entries[0],
    [currentId, entries],
  );

  const handleChangeMode = (m: AiMode) => {
    setEntries((all) => all.map((e) => (e.id === currentId ? { ...e, aiMode: m } : e)));
  };

  return (
    <NovelShell novelId={novel.id} activeNav="lorebook">
      {/* Sidebar */}
        <LoreSide
          entries={filtered}
          currentId={currentId}
          setCurrentId={setCurrentId}
          search={search}
          setSearch={setSearch}
          mode={mode}
          setMode={setMode}
          openCats={openCats}
          toggleCat={toggleCat}
        />

        {/* Detail */}
        <LoreDetail
          entry={current}
          entries={entries}
          onSelect={setCurrentId}
          showGraph={showGraph}
          onChangeMode={handleChangeMode}
        />
    </NovelShell>
  );
}
