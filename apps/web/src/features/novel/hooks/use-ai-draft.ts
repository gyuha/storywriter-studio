import { useCallback, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface ContextItem {
  type: 'character' | 'location' | 'world_setting';
  id: string;
}

interface UseAiDraftOptions {
  novelId: string;
  chapterId: string;
  editorRef: React.RefObject<Editor | null>;
}

export function useAiDraft({ novelId, chapterId, editorRef }: UseAiDraftOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (contextItems: ContextItem[], includePrevSummary = true) => {
      if (isGenerating) return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      const editor = editorRef.current;
      if (!editor) return;

      setIsGenerating(true);
      const abort = new AbortController();
      abortRef.current = abort;

      // Move cursor to end and insert a newline separator before draft
      editor.commands.focus('end');
      editor.commands.insertContent('\n\n');

      try {
        const response = await fetch(
          `/api/v1/novels/${novelId}/chapters/${chapterId}/draft`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              context_items: contextItems,
              include_prev_summary: includePrevSummary,
            }),
            signal: abort.signal,
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`Draft request failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isErrorEvent = false;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              isErrorEvent = line === 'event: error';
              continue;
            }
            if (line === '') {
              isErrorEvent = false;
              continue;
            }
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break outer;
            if (data && !isErrorEvent) {
              editor.commands.insertContent(data);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('AI draft error:', err);
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [isGenerating, novelId, chapterId, editorRef]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return { generate, cancel, isGenerating };
}
