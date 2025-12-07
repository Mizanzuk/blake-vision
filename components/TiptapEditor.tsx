'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic } from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onTextSelect?: (text: string, position: { x: number; y: number }) => void;
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Escreva seu texto aqui...',
  className = '',
  onTextSelect,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Atualizar conteúdo quando value mudar externamente
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Handler para seleção de texto
  useEffect(() => {
    if (!editor || !onTextSelect) return;

    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      if (text && text.trim().length > 0) {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        const position = {
          x: (start.left + end.left) / 2,
          y: start.top - 30,
        };

        onTextSelect(text, position);
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor, onTextSelect]);

  if (!editor) {
    return <div className={className}>Carregando editor...</div>;
  }

  return (
    <div className={className}>
      <style jsx global>{`
        /* Container principal */
        .tiptap-editor-wrapper {
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 32rem);
          overflow: hidden;
          border: none;
        }

        /* Toolbar */
        .tiptap-toolbar {
          border: none !important;
          background-color: #f5f1e8 !important;
          padding: 12px 64px !important;
          flex-shrink: 0 !important;
          margin-bottom: 0 !important;
          margin-top: -28px !important;
          display: flex;
          gap: 4px;
        }

        .tiptap-toolbar button {
          width: 28px !important;
          height: 28px !important;
          padding: 4px !important;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tiptap-toolbar button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .tiptap-toolbar button.is-active {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .tiptap-toolbar button svg {
          width: 14px !important;
          height: 14px !important;
        }

        /* Editor */
        .tiptap-editor {
          padding: 48px 64px 48px 64px !important;
          min-height: 400px !important;
          height: 100% !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          border: none !important;
          outline: none !important;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
        }

        .tiptap-editor p {
          margin-bottom: 14px !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
          min-height: 1.5em !important;
        }

        .tiptap-editor p + p {
          margin-top: 14px !important;
        }

        .tiptap-editor p:last-child {
          margin-bottom: 14px !important;
        }

        /* Placeholder */
        .tiptap-editor p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      <div className="tiptap-editor-wrapper">
        {/* Toolbar */}
        <div className="tiptap-toolbar">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Negrito"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Itálico"
          >
            <Italic size={14} />
          </button>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
