import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { useEffect, useState } from 'react';
import { useChapterAutosave } from '../hooks/use-chapter-autosave';
import { SaveStatusBar } from './save-status-bar';

interface ChapterEditorProps {
  novelId: string;
  chapterId: string;
  initialContent: Record<string, unknown> | null; // D-28: JSON object
}

const CHAR_TARGET = 5000;

export function ChapterEditor({ novelId, chapterId, initialContent }: ChapterEditorProps) {
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

  const handleLink = () => {
    const url = window.prompt('링크 URL을 입력하세요');
    if (!url) {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    editor?.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b flex-wrap">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          굵게
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          기울임
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          H1
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          H2
        </button>
        <button
          onClick={handleLink}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'k') {
              e.preventDefault();
              handleLink();
            }
          }}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('link') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          링크
        </button>
      </div>
      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent
          editor={editor}
          className="prose max-w-none min-h-full outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px]"
        />
      </div>
      {/* Status bar */}
      <SaveStatusBar saveStatus={saveStatus} charCount={charCount} charTarget={CHAR_TARGET} />
    </div>
  );
}
