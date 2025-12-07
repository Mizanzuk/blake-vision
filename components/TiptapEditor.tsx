'use client';

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
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
  const editorRef = useRef<HTMLDivElement>(null);

  // Função para buscar entidades
  const fetchEntities = async (query: string) => {
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      return [];
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Desabilitar headings
        blockquote: false, // Desabilitar blockquotes
        codeBlock: false, // Desabilitar code blocks
        horizontalRule: false, // Desabilitar horizontal rules
        bulletList: false, // Desabilitar listas
        orderedList: false, // Desabilitar listas ordenadas
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: async ({ query }) => {
            if (query.length === 0) return [];
            return await fetchEntities(query);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionList(props);
                
                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return component.onKeyDown(props);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
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
    <div className={className} ref={editorRef}>
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

        /* Mentions */
        .mention {
          background-color: #e8f4f8 !important;
          color: #0066cc !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
        }

        .mention:hover {
          background-color: #d0e8f0 !important;
        }

        /* Mention dropdown */
        .mention-list {
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-height: 300px;
          overflow-y: auto;
          padding: 4px 0;
        }

        .mention-list-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mention-list-item:hover,
        .mention-list-item.is-selected {
          background-color: #f5f1e8;
        }

        .mention-icon {
          font-size: 16px;
        }

        .mention-name {
          flex: 1;
          font-weight: 500;
          color: #333;
        }

        .mention-type {
          font-size: 12px;
          color: #999;
          text-transform: capitalize;
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

// Mention List Component
class MentionList {
  items: any[];
  selectedIndex: number;
  element: HTMLElement;
  props: any;

  constructor(props: any) {
    this.items = props.items;
    this.selectedIndex = 0;
    this.props = props;

    this.element = document.createElement('div');
    this.element.className = 'mention-list';

    this.render();
  }

  updateProps(props: any) {
    this.props = props;
    this.items = props.items;
    this.selectedIndex = 0;
    this.render();
  }

  onKeyDown({ event }: any) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.selectedIndex = ((this.selectedIndex + this.items.length) - 1) % this.items.length;
    this.render();
  }

  downHandler() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.render();
  }

  enterHandler() {
    this.selectItem(this.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.items[index];

    if (item) {
      this.props.command({ id: item.id, label: item.value });
    }
  }

  render() {
    const icons: Record<string, string> = {
      character: '👤',
      location: '📍',
      event: '📅',
      object: '🔷',
    };

    this.element.innerHTML = this.items
      .map((item, index) => {
        const icon = icons[item.type] || '🔹';
        return `
          <div class="mention-list-item ${index === this.selectedIndex ? 'is-selected' : ''}" data-index="${index}">
            <span class="mention-icon">${icon}</span>
            <span class="mention-name">${item.value}</span>
            <span class="mention-type">${item.type}</span>
          </div>
        `;
      })
      .join('');

    // Add click handlers
    const items = this.element.querySelectorAll('.mention-list-item');
    items.forEach((item, index) => {
      item.addEventListener('click', () => this.selectItem(index));
    });
  }

  destroy() {
    this.element.remove();
  }
}

// Tippy.js import (needed for mention dropdown)
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
