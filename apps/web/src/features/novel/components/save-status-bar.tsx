interface SaveStatusBarProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  charCount: number;
  charTarget: number;
}

export function SaveStatusBar({ saveStatus, charCount, charTarget }: SaveStatusBarProps) {
  const statusText = {
    idle: '',
    saving: '저장 중...',
    saved: '저장됨',
    error: '저장 실패',
  }[saveStatus];

  return (
    <div className="flex justify-between items-center px-4 py-2 border-t text-sm">
      <span className={charCount >= charTarget ? 'text-green-500' : 'text-gray-400'}>
        {charCount.toLocaleString()}자 / {charTarget.toLocaleString()}자 목표
      </span>
      <span className={saveStatus === 'error' ? 'text-red-500' : 'text-gray-400'}>
        {statusText}
      </span>
    </div>
  );
}
