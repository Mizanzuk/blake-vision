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
  // Component render - LOG SEMPRE EXECUTA
  console.log('========================================');
  console.log('[TiptapEditor] RENDER - focusType:', focusType);
  console.log('[TiptapEditor] RENDER - isFocusMode:', isFocusMode);
  console.log('========================================');
  
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

  // Focus Mode implementation - Abordagem CSS direta e robusta
  useEffect(() => {
    if (!editor || !focusType || focusType === 'off') {
      // Remover classes quando desativado
      const container = editor?.view?.dom;
      if (container) {
        container.classList.remove('focus-mode-sentence', 'focus-mode-paragraph');
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => p.classList.remove('focus-active', 'focus-dimmed'));
      }
      return;
    }

    console.log('[Focus Mode] Ativando modo:', focusType);
    
    const updateFocus = () => {
      const container = editor.view.dom;
      const { from } = editor.state.selection;
      
      console.log('[Focus Mode] updateFocus chamado, from:', from);
      
      // Adicionar classe no container
      container.classList.remove('focus-mode-sentence', 'focus-mode-paragraph');
      container.classList.add(`focus-mode-${focusType}`);
      console.log('[Focus Mode] Classe adicionada ao container:', `focus-mode-${focusType}`);
      
      // Encontrar elemento atual
      const domAtPos = editor.view.domAtPos(from);
      let currentElement = domAtPos.node as HTMLElement;
      console.log('[Focus Mode] Elemento inicial:', currentElement.tagName, currentElement);
      
      // Navegar até o parágrafo
      while (currentElement && currentElement.tagName !== 'P' && currentElement !== container) {
        currentElement = currentElement.parentElement as HTMLElement;
      }
      
      console.log('[Focus Mode] Elemento final:', currentElement?.tagName, currentElement);
      
      // Aplicar classes em todos os parágrafos
      const paragraphs = container.querySelectorAll('p');
      console.log('[Focus Mode] Total de parágrafos:', paragraphs.length);
      
      if (paragraphs.length === 0) {
        console.warn('[Focus Mode] Nenhum parágrafo encontrado!');
        return;
      }
      
      // Se não encontrou o parágrafo atual, usar o primeiro
      if (!currentElement || currentElement.tagName !== 'P') {
        console.warn('[Focus Mode] Parágrafo atual não encontrado, usando primeiro parágrafo');
        currentElement = paragraphs[0] as HTMLElement;
      }
      
      paragraphs.forEach(p => {
        p.classList.remove('focus-active', 'focus-dimmed');
        if (p === currentElement) {
          p.classList.add('focus-active');
          console.log('[Focus Mode] Parágrafo ativo:', p);
        } else {
          p.classList.add('focus-dimmed');
        }
      });
      console.log('[Focus Mode] Classes aplicadas com sucesso!');
    };
    
    // Atualizar imediatamente
    updateFocus();
    
    // Atualizar quando a seleção mudar
    const handleUpdate = () => updateFocus();
    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
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
