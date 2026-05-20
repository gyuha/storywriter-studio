import { useState } from 'react';
import { NovelShell } from '@/features/novel/components/novel-shell';
import { CharacterList } from './character-list';
import { LocationList } from './location-list';
import { TimelineList } from './timeline-list';
import { WorldSettingList } from './world-setting-list';

type TabId = 'characters' | 'locations' | 'world-settings' | 'timelines';

const TABS: { id: TabId; label: string }[] = [
  { id: 'characters', label: '캐릭터' },
  { id: 'locations', label: '장소' },
  { id: 'world-settings', label: '세계관 설정' },
  { id: 'timelines', label: '시간표' },
];

interface WorldPageProps {
  novelId: string;
}

export function WorldPage({ novelId }: WorldPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('characters');

  return (
    <NovelShell novelId={novelId} activeNav="storybible">
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 20,
            color: 'var(--sw-text-primary)',
          }}
        >
          세계관 관리
        </h1>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--sw-line-default)',
            marginBottom: 20,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--sw-primary)' : 'var(--sw-text-assistive)',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--sw-primary)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'characters' && <CharacterList novelId={novelId} />}
        {activeTab === 'locations' && <LocationList novelId={novelId} />}
        {activeTab === 'world-settings' && <WorldSettingList novelId={novelId} />}
        {activeTab === 'timelines' && <TimelineList novelId={novelId} />}
      </div>
    </NovelShell>
  );
}
