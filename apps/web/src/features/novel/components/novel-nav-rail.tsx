import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Globe, Palette, PenLine, Settings, Users } from 'lucide-react';
import type { ComponentType } from 'react';

export type NavId = 'overview' | 'write' | 'characters' | 'lorebook' | 'storybible';

export interface NavRailProps {
  novelId: string;
  activeId: NavId;
  chapterId?: string;
}

interface NavItem {
  id: NavId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick?: () => void;
  disabled?: boolean;
}

export function NavRail({ novelId, activeId, chapterId }: NavRailProps) {
  const navigate = useNavigate();

  const goToOverview = () => navigate({ to: '/novels/$novelId', params: { novelId } });
  const goToCharacters = () =>
    navigate({ to: '/novels/$novelId/characters', params: { novelId } });
  const goToLorebook = () => navigate({ to: '/novels/$novelId/lorebook', params: { novelId } });
  const goToWorld = () => navigate({ to: '/novels/$novelId/world', params: { novelId } });
  const goToEditor = () => {
    if (chapterId) {
      navigate({
        to: '/novels/$novelId/chapters/$chapterId/edit',
        params: { novelId, chapterId },
      });
    }
  };

  const items: NavItem[] = [
    { id: 'overview', label: '작품 설정', icon: BookOpen, onClick: goToOverview },
    {
      id: 'write',
      label: '글쓰기',
      icon: PenLine,
      onClick: chapterId ? goToEditor : undefined,
      disabled: !chapterId && activeId !== 'write',
    },
    { id: 'characters', label: '캐릭터', icon: Users, onClick: goToCharacters },
    { id: 'lorebook', label: '로어북', icon: Globe, onClick: goToLorebook },
    { id: 'storybible', label: '비주얼바이블', icon: Palette, onClick: goToWorld },
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
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;
        return (
          <button
            type="button"
            key={item.id}
            disabled={item.disabled}
            onClick={item.disabled ? undefined : item.onClick}
            title={item.label}
            style={{
              width: 52,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '9px 0',
              borderRadius: 10,
              color: isActive ? 'var(--sw-primary)' : 'var(--sw-text-assistive)',
              background: isActive ? 'var(--sw-primary-tint)' : 'none',
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
        title="설정"
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
