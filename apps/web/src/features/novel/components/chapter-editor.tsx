import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { useChapterAutosave } from '../hooks/use-chapter-autosave';
import { SaveStatusBar } from './save-status-bar';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ChapterEditorProps {
  novelId: string;
  chapterId: string;
  initialContent: Record<string, unknown> | null; // D-28: JSON object
  onCharCountChange?: (count: number) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

const CHAR_TARGET = 5000;

export function ChapterEditor({ novelId, chapterId, initialContent, onCharCountChange, onSaveStatusChange }: ChapterEditorProps) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Link.configure({ openOnClick: false }),
    ],
    content: null,
    immediatelyRender: false, // MANDATORY — React 19 hydration
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON()); // D-28: getJSON() not getHTML()
    },
  });

  // Initialize content after editor mounts
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent); // JSON object — no parsing needed
    }
  }, [editor, initialContent]);

  const { saveStatus } = useChapterAutosave(novelId, chapterId, content);

  const charCount = editor?.storage.characterCount.characters() ?? 0;

  useEffect(() => { onCharCountChange?.(charCount); }, [charCount, onCharCountChange]);
  useEffect(() => { onSaveStatusChange?.(saveStatus); }, [saveStatus, onSaveStatusChange]);

  const handleLink = () => {
    const url = window.prompt('링크 URL을 입력하세요');
    if (!url) {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    editor?.chain().focus().setLink({ href: url }).run();
  };

  // When used standalone (outside EditorLayout), show the original toolbar + status bar
  const standalone = !onCharCountChange && !onSaveStatusChange;

  if (standalone) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 p-2 border-b flex-wrap">
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>굵게</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>기울임</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>H2</button>
          <button type="button" onClick={handleLink} className={`px-2 py-1 text-sm rounded ${editor?.isActive('link') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>링크</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EditorContent editor={editor} className="prose max-w-none min-h-full outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px]" />
        </div>
        <SaveStatusBar saveStatus={saveStatus} charCount={charCount} charTarget={CHAR_TARGET} />
      </div>
    );
  }

  // When embedded in EditorLayout: render editor content only (no toolbar, no status bar)
  return (
    <EditorContent
      editor={editor}
      className="sw-prose [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[480px]"
    />
  );
}
