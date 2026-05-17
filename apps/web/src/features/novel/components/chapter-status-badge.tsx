import type { ChapterStatus } from '../types/novel';

interface ChapterStatusBadgeProps {
  status: ChapterStatus;
}

const STATUS_CONFIG: Record<ChapterStatus, { label: string; className: string }> = {
  draft: { label: '초안', className: 'bg-gray-100 text-gray-600' },
  reviewing: { label: '검토 중', className: 'bg-yellow-100 text-yellow-700' },
  done: { label: '완성', className: 'bg-green-100 text-green-700' },
};

export function ChapterStatusBadge({ status }: ChapterStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
