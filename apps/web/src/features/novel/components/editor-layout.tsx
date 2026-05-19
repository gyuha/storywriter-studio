import '@/styles/editor.css';
import { useNavigate } from '@tanstack/react-router';
import {
  Bell,
  BookMarked,
  BookOpen,
  ChevronDown,
  FileText,
  Globe,
  Image,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useCreateChapterMutation,
  useReorderChapterMutation,
  useUpdateChapterMutation,
} from '../hooks/use-chapter-mutations';
import { useChapters } from '../hooks/use-chapter-queries';
import type { Chapter, ChapterStatus, Novel } from '../types/novel';
import { ChapterEditor } from './chapter-editor';
import { ChapterSortableList } from './chapter-sortable-list';
import { EditorRightPanel } from './editor-right-panel';

// ─── Design tokens ────────────────────────────────────────────────────────────

const LIGHT_TOKENS = {
  '--sw-primary': '#0066FF',
  '--sw-primary-hover': '#0052CC',
  '--sw-primary-tint': '#E8F0FF',
  '--sw-primary-tint-2': '#D6E4FF',
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
  '--sw-status-cautionary': '#FF9200',
} as React.CSSProperties;

const DARK_TOKENS = {
  '--sw-primary': '#1F75FF',
  '--sw-primary-hover': '#4990FF',
  '--sw-primary-tint': 'rgba(31,117,255,0.16)',
  '--sw-primary-tint-2': 'rgba(31,117,255,0.24)',
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
  '--sw-status-cautionary': '#FF9200',
} as React.CSSProperties;

// ─── AI sample draft ──────────────────────────────────────────────────────────

const AI_DRAFT = `달빛이 흙길을 은빛으로 적셨다. 유하린은 자신도 모르게 무릎을 굽혔다. 발 아래 풀잎은 살아있는 듯 가볍게 떨렸고, 손끝에 닿는 흙은 따스했다. 마치 누군가 갓 데워둔 것처럼.

저 멀리, 안개 너머로 푸르스름한 빛이 떠올랐다. 도시도 아니고 마을도 아닌, 그저 빛 자체로 존재하는 무언가. 그것은 숨을 쉬듯 천천히 부풀어 올랐다 가라앉기를 반복하고 있었다.

"이건…"

그녀의 목소리는 자신의 귀에도 낯설게 들렸다. 마치 다른 사람이 그녀의 입을 빌려 말하는 듯한.

문이 등 뒤에서 천천히 닫혔다. 돌아갈 길은 사라졌다. 그러나 이상하게도 유하린은 두렵지 않았다.`;

// ─── Nav rail ────────────────────────────────────────────────────────────────

function NavRail({ novelId }: { novelId: string }) {
  const navigate = useNavigate();
  const navItems = [
    { id: 'overview', label: '작품 설정', icon: BookOpen, href: `/novels/${novelId}` },
    { id: 'write', label: '글쓰기', icon: PenLine, active: true },
    { id: 'characters', label: '캐릭터', icon: Users, href: `/novels/${novelId}/characters` },
    { id: 'lorebook', label: '로어북', icon: Globe, href: `/novels/${novelId}/lorebook` },
    { id: 'storybible', label: '스토리바이블', icon: BookMarked, disabled: true },
  ];

  return (
    <nav
      style={{
        width: 64,
        background: 'var(--sw-bg-surface)',
        borderRight: '1px solid var(--sw-line-default)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 2,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.id}
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              if (item.href) navigate({ to: item.href as '/' });
            }}
            title={item.label}
            style={{
              width: 52,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '9px 0',
              borderRadius: 10,
              color: item.active ? 'var(--sw-primary)' : 'var(--sw-text-assistive)',
              background: item.active ? 'var(--sw-primary-tint)' : 'none',
              border: 'none',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.4 : 1,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.03em',
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
            {item.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button
        type="button"
        style={{
          width: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '9px 0',
          borderRadius: 10,
          color: 'var(--sw-text-assistive)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 500,
        }}
      >
        <Settings size={18} strokeWidth={1.8} />
        설정
      </button>
    </nav>
  );
}

// ─── Chapter panel ────────────────────────────────────────────────────────────

function ChapterPanel({
  novel,
  novelId,
  currentChapterId,
}: {
  novel: Novel;
  novelId: string;
  currentChapterId: string;
}) {
  const navigate = useNavigate();
  const { data: chapters, isLoading, isError } = useChapters(novelId);
  const reorderMutation = useReorderChapterMutation();
  const createMutation = useCreateChapterMutation();
  const updateMutation = useUpdateChapterMutation();

  const handleChapterClick = (chapter: Chapter) => {
    navigate({
      to: '/novels/$novelId/chapters/$chapterId/edit',
      params: { novelId, chapterId: chapter.id },
    });
  };

  const handleAddChapter = () => {
    const n = (chapters?.length ?? 0) + 1;
    createMutation.mutate({ novelId, data: { title: `챕터 ${n}` } });
  };

  return (
    <aside
      style={{
        width: 272,
        background: 'var(--sw-bg-surface)',
        borderRight: '1px solid var(--sw-line-default)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Project card */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 14,
          alignItems: 'center',
          borderBottom: '1px solid var(--sw-line-default)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background:
              'radial-gradient(120% 80% at 30% 20%, #93B6FF 0%, transparent 50%), radial-gradient(120% 80% at 70% 80%, #5E72E4 0%, transparent 60%), linear-gradient(135deg, #1E3A8A, #0F172A)',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
          }}
        >
          📚
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.004em',
              color: 'var(--sw-text-primary)',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {novel.title}
            <ChevronDown size={12} style={{ color: 'var(--sw-text-assistive)' }} />
          </div>
          {novel.genre && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--sw-text-assistive)',
                letterSpacing: '0.03em',
                marginBottom: 1,
              }}
            >
              {novel.genre}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: 'var(--sw-text-assistive)',
              fontFamily: 'var(--sw-font-mono)',
              letterSpacing: '0.03em',
            }}
          >
            총 <strong style={{ color: 'var(--sw-text-secondary)' }}>{novel.chapter_count}</strong>
            화
          </div>
        </div>
      </div>

      {/* Chapter list header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 6px',
        }}
      >
        <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--sw-text-primary)' }}>
          챕터
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={handleAddChapter}
            disabled={createMutation.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              height: 26,
              padding: '0 9px',
              borderRadius: 6,
              background: 'var(--sw-primary-tint)',
              color: 'var(--sw-primary)',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.015em',
            }}
          >
            {createMutation.isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Plus size={11} />
            )}
            챕터 추가
          </button>
        </div>
      </div>

      {/* Chapter list */}
      <div className="sw-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: 'var(--sw-text-assistive)' }}
            />
          </div>
        ) : isError ? (
          <p style={{ fontSize: 12, color: 'var(--sw-status-negative)', padding: '0 8px' }}>
            챕터를 불러올 수 없습니다
          </p>
        ) : chapters && chapters.length > 0 ? (
          <ChapterSortableList
            chapters={chapters}
            currentChapterId={currentChapterId}
            novelId={novelId}
            onReorder={(activeId, newOrderKey) =>
              reorderMutation.mutate({ novelId, chapterId: activeId, order_key: newOrderKey })
            }
            onChapterClick={handleChapterClick}
            onStatusChange={(chapterId, status: ChapterStatus) =>
              updateMutation.mutate({ novelId, chapterId, data: { status } })
            }
          />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--sw-text-assistive)', padding: '0 8px' }}>
            챕터가 없습니다
          </p>
        )}
      </div>
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  theme,
  onThemeToggle,
  onQuickGenerate,
  aiGenerating,
}: {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onQuickGenerate: () => void;
  aiGenerating: boolean;
}) {
  return (
    <header
      style={{
        height: 56,
        display: 'grid',
        gridTemplateColumns: '336px 1fr auto',
        alignItems: 'center',
        background: 'var(--sw-bg-surface)',
        borderBottom: '1px solid var(--sw-line-default)',
        padding: '0 16px 0 0',
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--sw-primary-tint)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--sw-primary)',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M3 26 C 4 20, 7 8, 14 7 C 19 7, 20 14, 22 18 C 24 22, 27 23, 29 22"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="14" cy="7" r="2.2" fill="currentColor" />
            <path
              d="M25 4 L25 8 M23 6 L27 6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: 'var(--sw-text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            StoryWriter
          </span>
          <span
            style={{
              display: 'inline-block',
              width: 1,
              height: 13,
              background: 'var(--sw-line-strong)',
              margin: '0 8px',
              transform: 'translateY(1px)',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontWeight: 500,
              fontSize: 13,
              color: 'var(--sw-text-assistive)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Studio
          </span>
        </div>
        {/* Theme toggle */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--sw-bg-subtle)',
            borderRadius: 999,
            padding: 3,
            marginLeft: 8,
          }}
        >
          <button
            type="button"
            onClick={() => theme === 'dark' && onThemeToggle()}
            title="라이트 모드"
            style={{
              width: 28,
              height: 24,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              color: theme === 'light' ? 'var(--sw-text-primary)' : 'var(--sw-text-assistive)',
              background: theme === 'light' ? 'var(--sw-bg-surface)' : 'none',
              border: 'none',
              cursor: 'pointer',
              boxShadow: theme === 'light' ? '0 1px 2px rgba(23,23,25,0.06)' : 'none',
            }}
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            onClick={() => theme === 'light' && onThemeToggle()}
            title="다크 모드"
            style={{
              width: 28,
              height: 24,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              color: theme === 'dark' ? 'var(--sw-text-primary)' : 'var(--sw-text-assistive)',
              background: theme === 'dark' ? 'var(--sw-bg-surface)' : 'none',
              border: 'none',
              cursor: 'pointer',
              boxShadow: theme === 'dark' ? '0 1px 2px rgba(23,23,25,0.06)' : 'none',
            }}
          >
            <Moon size={13} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 38,
          padding: '0 14px',
          background: 'var(--sw-bg-subtle)',
          borderRadius: 10,
          color: 'var(--sw-text-assistive)',
          maxWidth: 480,
          justifySelf: 'center',
          width: '100%',
        }}
      >
        <Search size={15} />
        <input
          placeholder="검색"
          style={{
            flex: 1,
            background: 'none',
            border: 0,
            outline: 'none',
            fontSize: 14,
            color: 'var(--sw-text-primary)',
          }}
        />
        <kbd
          style={{
            fontFamily: 'var(--sw-font-mono)',
            fontSize: 11,
            padding: '2px 6px',
            background: 'var(--sw-bg-surface)',
            borderRadius: 4,
            border: '1px solid var(--sw-line-default)',
            color: 'var(--sw-text-assistive)',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onQuickGenerate}
          disabled={aiGenerating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 14px',
            borderRadius: 8,
            background: 'var(--sw-primary)',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: aiGenerating ? 'not-allowed' : 'pointer',
            opacity: aiGenerating ? 0.7 : 1,
          }}
        >
          <Sparkles size={14} />
          {aiGenerating ? '생성 중…' : '빠른 생성'}
        </button>
        <button
          type="button"
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 8,
            color: 'var(--sw-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Bell size={17} />
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              background: 'var(--sw-status-negative)',
              borderRadius: '50%',
              border: '2px solid var(--sw-bg-surface)',
            }}
          />
        </button>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#FFB199,#FF7E5F)',
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          유
        </div>
      </div>
    </header>
  );
}

// ─── Action row (above editor) ────────────────────────────────────────────────

function ActionRow({
  chapterTitle,
  model,
  onModelChange,
  onAIGenerate,
  aiGenerating,
}: {
  chapterTitle: string;
  model: string;
  onModelChange: (m: string) => void;
  onAIGenerate: () => void;
  aiGenerating: boolean;
}) {
  const [modelOpen, setModelOpen] = useState(false);
  const models = [
    { id: 'claude', name: 'Claude Sonnet', tag: '추천', color: '#C96442' },
    { id: 'gpt', name: 'GPT-4o', tag: '빠름', color: '#0F8B6C' },
    { id: 'gemini', name: 'Gemini 2.0', tag: '긴 컨텍스트', color: '#4889F4' },
  ];
  const current = models.find((m) => m.id === model) ?? models[0];

  return (
    <div style={{ padding: '20px 48px 0', maxWidth: 760, width: '100%', margin: '0 auto' }}>
      {/* Chapter heading */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.023em',
          margin: '0 0 14px',
          color: 'var(--sw-text-primary)',
        }}
      >
        {chapterTitle}
      </h1>
      {/* Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: '저장', icon: <Save size={13} />, cls: 'save' },
          { label: '요약', icon: <FileText size={13} /> },
          { label: '장면 이미지', icon: <Image size={13} /> },
          { label: '다시쓰기', icon: <RotateCcw size={13} /> },
        ].map((pill) => (
          <button
            type="button"
            key={pill.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 13px',
              borderRadius: 999,
              background: 'var(--sw-bg-subtle)',
              color: 'var(--sw-text-primary)',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid var(--sw-line-default)',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            <span
              style={{
                color: pill.cls === 'save' ? 'var(--sw-primary)' : 'var(--sw-text-assistive)',
              }}
            >
              {pill.icon}
            </span>
            {pill.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Model picker */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setModelOpen(!modelOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 13px',
              borderRadius: 999,
              background: 'var(--sw-bg-subtle)',
              color: 'var(--sw-text-primary)',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid var(--sw-line-default)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: current.color,
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {current.name[0]}
            </span>
            {current.name}
            <ChevronDown size={12} />
          </button>
          {modelOpen && (
            <div
              onMouseLeave={() => setModelOpen(false)}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: 'var(--sw-bg-surface)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(23,23,25,0.12)',
                border: '1px solid var(--sw-line-default)',
                minWidth: 220,
                padding: 6,
                zIndex: 50,
              }}
            >
              {models.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    onModelChange(m.id);
                    setModelOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    width: '100%',
                    background: m.id === model ? 'var(--sw-primary-tint)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: m.color,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {m.name[0]}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--sw-text-primary)',
                      flex: 1,
                    }}
                  >
                    {m.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--sw-text-assistive)' }}>{m.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* AI generate */}
        <button
          type="button"
          onClick={onAIGenerate}
          disabled={aiGenerating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 16px',
            borderRadius: 999,
            background: 'var(--sw-primary)',
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: aiGenerating ? 'not-allowed' : 'pointer',
            opacity: aiGenerating ? 0.7 : 1,
          }}
        >
          <Sparkles size={13} />
          {aiGenerating ? '생성 중…' : 'AI 초안 생성'}
        </button>
      </div>
    </div>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({
  charCount,
  saveStatus,
  focusMode,
  onFocusModeToggle,
}: {
  charCount: number;
  saveStatus: string;
  focusMode: boolean;
  onFocusModeToggle: () => void;
}) {
  const readMin = Math.max(1, Math.round(charCount / 350));
  const pct = Math.min(1, charCount / 5000);

  return (
    <div
      style={{
        height: 42,
        background: 'var(--sw-bg-surface)',
        borderTop: '1px solid var(--sw-line-default)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 14,
        fontSize: 13,
        color: 'var(--sw-text-assistive)',
        flexShrink: 0,
      }}
    >
      {/* Word count with bar */}
      <span
        style={{
          fontFamily: 'var(--sw-font-mono)',
          color: 'var(--sw-text-secondary)',
          fontWeight: 700,
        }}
      >
        {charCount.toLocaleString()}자
      </span>
      <div
        style={{
          width: 80,
          height: 5,
          background: 'var(--sw-bg-muted)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: 'var(--sw-primary)',
            borderRadius: 999,
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <span>/ 5,000자 목표</span>
      <span
        style={{ width: 1, height: 14, background: 'var(--sw-line-default)', display: 'block' }}
      />
      <span>
        예상 읽기{' '}
        <span style={{ fontFamily: 'var(--sw-font-mono)', color: 'var(--sw-text-secondary)' }}>
          {readMin}분
        </span>
      </span>
      <span
        style={{ width: 1, height: 14, background: 'var(--sw-line-default)', display: 'block' }}
      />
      <span
        style={{
          color:
            saveStatus === 'saved'
              ? 'var(--sw-status-positive)'
              : saveStatus === 'error'
                ? 'var(--sw-status-negative)'
                : 'var(--sw-text-assistive)',
        }}
      >
        {saveStatus === 'saving'
          ? '저장 중…'
          : saveStatus === 'saved'
            ? '✓ 저장됨'
            : saveStatus === 'error'
              ? '저장 실패'
              : ''}
      </span>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onFocusModeToggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          padding: '0 12px',
          borderRadius: 6,
          background: 'var(--sw-bg-subtle)',
          color: 'var(--sw-text-primary)',
          fontSize: 13,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        {focusMode ? '집필 모드 종료' : '집필 모드'}
      </button>
    </div>
  );
}

// ─── AI toast ─────────────────────────────────────────────────────────────────

function AIToast({ model, onCancel }: { model: string; onCancel: () => void }) {
  const modelName = model === 'claude' ? 'Claude' : model === 'gpt' ? 'GPT-4o' : 'Gemini';
  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: '#171719',
        color: 'white',
        borderRadius: 999,
        boxShadow: '0 8px 24px rgba(23,23,25,0.2)',
        fontSize: 13,
        fontWeight: 700,
        zIndex: 100,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="sw-ai-pulse" />
      <span>{modelName}가 다음 단락을 작성 중…</span>
      <button
        type="button"
        onClick={onCancel}
        style={{
          padding: '3px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.12)',
          color: 'white',
          fontSize: 12,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        취소
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface EditorLayoutProps {
  novel: Novel;
  chapter: Chapter;
  novelId: string;
  chapterId: string;
}

export function EditorLayout({ novel, chapter, novelId, chapterId }: EditorLayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [focusMode, setFocusMode] = useState(false);
  const [rightTab, setRightTab] = useState<'chat' | 'proofread' | 'character' | 'background'>(
    'background'
  );
  const [model, setModel] = useState('claude');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAI = useCallback(() => {
    if (aiGenerating) return;
    setAiGenerating(true);
    let i = 0;
    aiTimerRef.current = setInterval(() => {
      i += Math.ceil(Math.random() * 4);
      if (i >= AI_DRAFT.length) {
        if (aiTimerRef.current) clearInterval(aiTimerRef.current);
        setTimeout(() => setAiGenerating(false), 400);
      }
    }, 30);
  }, [aiGenerating]);

  const cancelAI = useCallback(() => {
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    setAiGenerating(false);
  }, []);

  useEffect(
    () => () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    },
    []
  );

  const tokens = theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;

  return (
    <div
      style={{
        ...tokens,
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          '"Pretendard JP Variable","Pretendard JP","Pretendard",-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif',
        color: 'var(--sw-text-primary)',
        background: 'var(--sw-bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      {!focusMode && (
        <TopBar
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          onQuickGenerate={startAI}
          aiGenerating={aiGenerating}
        />
      )}

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Nav rail */}
        {!focusMode && <NavRail novelId={novelId} />}

        {/* Chapter panel */}
        {!focusMode && (
          <ChapterPanel novel={novel} novelId={novelId} currentChapterId={chapterId} />
        )}

        {/* Main editor area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--sw-bg-surface)',
            position: 'relative',
          }}
        >
          {aiGenerating && <AIToast model={model} onCancel={cancelAI} />}

          {/* Scrollable editor content */}
          <div
            className="sw-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '28px 0 0',
            }}
          >
            <div style={{ width: '100%', maxWidth: 760, padding: '0 48px 64px' }}>
              {/* Action row */}
              <ActionRow
                chapterTitle={chapter.title}
                model={model}
                onModelChange={setModel}
                onAIGenerate={startAI}
                aiGenerating={aiGenerating}
              />
              {/* Chapter Editor (TipTap) */}
              <div style={{ marginTop: 20, paddingLeft: 48 }}>
                <div className="sw-prose" style={{ color: 'var(--sw-text-primary)' }}>
                  <ChapterEditor
                    novelId={novelId}
                    chapterId={chapterId}
                    initialContent={chapter.content}
                    onCharCountChange={setCharCount}
                    onSaveStatusChange={setSaveStatus}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <StatusBar
            charCount={charCount}
            saveStatus={saveStatus}
            focusMode={focusMode}
            onFocusModeToggle={() => setFocusMode((f) => !f)}
          />
        </main>

        {/* Right panel */}
        {!focusMode && <EditorRightPanel activeTab={rightTab} onTabChange={setRightTab} />}
      </div>

      {/* Focus mode exit button */}
      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          style={{
            position: 'fixed',
            top: 18,
            right: 18,
            height: 34,
            padding: '0 14px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--sw-bg-surface)',
            color: 'var(--sw-text-primary)',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(23,23,25,0.12)',
            zIndex: 200,
            border: '1px solid var(--sw-line-default)',
            cursor: 'pointer',
          }}
        >
          <Minimize2 size={14} />
          집필 모드 종료
        </button>
      )}
    </div>
  );
}
