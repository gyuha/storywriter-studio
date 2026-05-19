import '@/styles/editor.css';
import { useNavigate } from '@tanstack/react-router';
import { Moon, Search, Sun } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { NavRail, type NavId } from './novel-nav-rail';

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
  '--sw-bg-canvas': '#F2F3F5',
  '--sw-line-default': '#E1E2E4',
  '--sw-line-strong': '#C2C4C8',
  '--sw-fill-hover': 'rgba(112,115,124,0.05)',
  '--sw-status-positive': '#00BF40',
  '--sw-status-positive-bg': 'rgba(0,191,64,0.08)',
  '--sw-status-negative': '#FF3B3B',
  '--sw-status-negative-bg': 'rgba(255,59,59,0.06)',
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
  '--sw-bg-canvas': '#0F1015',
  '--sw-line-default': '#2E3137',
  '--sw-line-strong': '#46474C',
  '--sw-fill-hover': 'rgba(255,255,255,0.06)',
  '--sw-status-positive': '#00BF40',
  '--sw-status-positive-bg': 'rgba(0,191,64,0.12)',
  '--sw-status-negative': '#FF3B3B',
  '--sw-status-negative-bg': 'rgba(255,59,59,0.12)',
  '--sw-status-cautionary': '#FF9200',
} as React.CSSProperties;

export interface NovelShellProps {
  novelId: string;
  activeNav: NavId;
  chapterId?: string;
  children: ReactNode;
}

export function NovelShell({ novelId, activeNav, chapterId, children }: NovelShellProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const tokens = theme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS;

  return (
    <div
      className="sw-editor-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Pretendard JP Variable', 'Pretendard JP', -apple-system, sans-serif",
        ...tokens,
        background: 'var(--sw-bg-surface)',
        color: 'var(--sw-text-primary)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 20px',
          borderBottom: '1px solid var(--sw-line-default)',
          background: 'var(--sw-bg-surface)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0066FF, #0040CC)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L13 6V14H3V6L8 2Z" fill="white" opacity="0.9" />
              <circle cx="8" cy="11" r="1.5" fill="white" opacity="0.7" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--sw-text-primary)',
            }}
          >
            StoryWriter
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--sw-text-assistive)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            STUDIO
          </span>
        </button>
        <div style={{ flex: 1, maxWidth: 480, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 36,
              padding: '0 14px',
              background: 'var(--sw-bg-subtle)',
              borderRadius: 10,
              color: 'var(--sw-text-assistive)',
              fontSize: 13,
            }}
          >
            <Search size={14} />
            <span>검색</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                background: 'var(--sw-bg-muted)',
                padding: '2px 6px',
                borderRadius: 5,
              }}
            >
              ⌘K
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--sw-text-assistive)',
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NavRail novelId={novelId} activeId={activeNav} chapterId={chapterId} />
        {children}
      </div>
    </div>
  );
}
