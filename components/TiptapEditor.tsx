'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import './TiptapEditor.css';

// Suggestion plugin para mentions
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import MentionList from './MentionList';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onTextSelect?: (text: string, position: { x: number; y: number }) => void;
}

const suggestion: Omit<SuggestionOptions, 'editor'> = {
  items: async ({ query }) => {
    // Buscar fichas da API
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.entities || [];
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
      return [];
    }
  },

  render: () => {
    let component: ReactRenderer<any>;
    let popup: TippyInstance[];

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

export default function TiptapEditor({ value, onChange, placeholder, className, onTextSelect }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Comece a escrever...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Handle text selection for agent buttons
  useEffect(() => {
    if (!editor || !onTextSelect) return;

    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text.trim().length > 0) {
        const coords = editor.view.coordsAtPos(from);
        onTextSelect(text, { x: coords.left, y: coords.top });
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor, onTextSelect]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-editor ${className || ''}`}>
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          type="button"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          type="button"
        >
          I
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
