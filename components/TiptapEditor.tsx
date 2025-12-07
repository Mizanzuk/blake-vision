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
  focusType?: 'off' | 'sentence' | 'paragraph';
  typewriterMode?: boolean;
  isFocusMode?: boolean;
  showToolbar?: boolean;
  editorRef?: any;
}

const suggestion: Omit<SuggestionOptions, 'editor'> = {
  char: '@',
  items: async ({ query }) => {
    console.log('[TIPTAP] Mention triggered! Query:', query);
    // Buscar fichas da API
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      console.log('[TIPTAP] Entities found:', data.length || 0);
      return data || [];
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
        console.log('[TIPTAP] Mention dropdown onStart');
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

export default function TiptapEditor({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  onTextSelect, 
  showToolbar = true, 
  editorRef,
  focusType = 'off',
  typewriterMode = false,
  isFocusMode = false
}: TiptapEditorProps) {
  // Component render
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
  }); // Sem dependências - editor criado apenas uma vez

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      try {
        editor.commands.setContent(value);
      } catch (error) {
        console.error('[TiptapEditor] Error setting content:', error);
        throw error;
      }
    }
  }, [value, editor]);

  // Component lifecycle
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Handle text selection for agent buttons (only on mouseup)
  useEffect(() => {
    if (!editor || !onTextSelect) return;

    const handleMouseUp = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text.trim().length > 0) {
        const coords = editor.view.coordsAtPos(from);
        onTextSelect(text, { x: coords.left, y: coords.top });
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      editorElement.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor, onTextSelect]);

  // Expose editor instance to parent
  // CORREÇÃO: Mover ANTES do return null para garantir mesma ordem de hooks
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Focus Mode implementation
  useEffect(() => {
    console.log('[Focus Mode] useEffect executado, focusType:', focusType, 'editor:', !!editor);
    if (!editor) return;

    const updateFocus = () => {
      console.log('[Focus Mode] updateFocus chamado');
      const proseMirror = editor.view.dom;
      
      // Remove all focus classes first
      proseMirror.querySelectorAll('.focus-active, .focus-dimmed').forEach(el => {
        el.classList.remove('focus-active', 'focus-dimmed');
      });

      if (!focusType || focusType === 'off') {
        console.log('[Focus Mode] focusType é off, retornando');
        return;
      }

      console.log('[Focus Mode] Aplicando foco, tipo:', focusType);

      // Get all paragraphs
      const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
      console.log('[Focus Mode] Encontrados', paragraphs.length, 'parágrafos');
      
      // Find current paragraph
      let currentParagraph: Element | null = null;
      let currentNode = proseMirror.ownerDocument.getSelection()?.anchorNode;
      
      while (currentNode && currentNode !== proseMirror) {
        if (currentNode.nodeName === 'P') {
          currentParagraph = currentNode as Element;
          break;
        }
        currentNode = currentNode.parentNode;
      }

      if (!currentParagraph && paragraphs.length > 0) {
        currentParagraph = paragraphs[0];
      }

      console.log('[Focus Mode] Parágrafo atual encontrado:', !!currentParagraph);

      if (!currentParagraph) return;

      // Apply focus classes
      paragraphs.forEach(p => {
        if (p === currentParagraph) {
          p.classList.add('focus-active');
          console.log('[Focus Mode] Classe focus-active adicionada');
        } else {
          p.classList.add('focus-dimmed');
        }
      });
    };

    // Update focus on selection change
    editor.on('selectionUpdate', updateFocus);
    editor.on('update', updateFocus);
    
    // Initial update
    updateFocus();

    return () => {
      editor.off('selectionUpdate', updateFocus);
      editor.off('update', updateFocus);
    };
  }, [editor, focusType]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-editor ${className || ''}`}>
      {showToolbar && (
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
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
