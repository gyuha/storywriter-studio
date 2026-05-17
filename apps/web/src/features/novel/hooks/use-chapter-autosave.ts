import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useUpdateChapterMutation } from './use-chapter-mutations';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useChapterAutosave(
  novelId: string,
  chapterId: string,
  content: Record<string, unknown> | null // D-28: JSON object — NOT string
): { saveStatus: SaveStatus } {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [debouncedContent] = useDebounce(content, 3000);
  const mutation = useUpdateChapterMutation();

  useEffect(() => {
    if (!debouncedContent || Object.keys(debouncedContent).length === 0) return;
    setSaveStatus('saving');
    mutation.mutate(
      { novelId, chapterId, data: { content: debouncedContent } },
      {
        onSuccess: () => setSaveStatus('saved'),
        onError: () => setSaveStatus('error'),
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent]);

  return { saveStatus };
}
