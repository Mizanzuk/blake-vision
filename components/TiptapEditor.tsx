'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import Focus from '@tiptap/extension-focus';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState, useCallback, useRef } from 'react';
import './TiptapEditor.css';
import FontSelector, { FontFamily } from './FontSelector';



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
  fontFamily?: FontFamily;
  onFontChange?: (font: FontFamily) => void;
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
  isFocusMode = false,
  fontFamily = 'serif',
  onFontChange
}: TiptapEditorProps) {
  console.log('========================================');
  console.log('[TiptapEditor] RENDER - focusType:', focusType);
  console.log('[TiptapEditor] RENDER - typewriterMode:', typewriterMode);
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
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
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
      try {
        editor.commands.setContent(value);
      } catch (error) {
        console.error('[TiptapEditor] Error setting content:', error);
        throw error;
      }
    }
  }, [value, editor]);

  // Handle text selection for agent buttons
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
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);



  // ========================================
  // TYPEWRITER MODE
  // ========================================
  useEffect(() => {
    if (!editor || !typewriterMode) return;

    console.log('[Typewriter Mode] Ativando...');
    
    let timeoutId: NodeJS.Timeout;
    
    const handleTypewriter = () => {
      // Cancelar timeout anterior
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        try {
          const { from } = editor.state.selection;
          const coords = editor.view.coordsAtPos(from);
          
          // Encontrar container scrollável
          const editorDom = editor.view.dom;
          const scrollContainer = editorDom.parentElement;
          
          if (!scrollContainer) return;
          
          // Calcular posição para centralizar cursor
          const containerHeight = scrollContainer.clientHeight;
          const cursorTop = coords.top - scrollContainer.getBoundingClientRect().top + scrollContainer.scrollTop;
          const targetScroll = cursorTop - (containerHeight / 2);
          
          console.log('[Typewriter Mode] Scroll para:', targetScroll);
          
          // Scroll suave
          scrollContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } catch (error) {
          console.error('[Typewriter Mode] Erro:', error);
        }
      }, 50); // Debounce de 50ms
    };
    
    // Atualizar imediatamente
    handleTypewriter();
    
    // Listeners
    editor.on('update', handleTypewriter);
    editor.on('selectionUpdate', handleTypewriter);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      editor.off('update', handleTypewriter);
      editor.off('selectionUpdate', handleTypewriter);
    };
  }, [editor, typewriterMode]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`tiptap-editor ${className || ''} ${focusType && focusType !== 'off' ? 'focus-mode-active' : ''}`}>
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
          {onFontChange && (
            <>
              <div className="toolbar-divider" />
              <FontSelector value={fontFamily} onChange={onFontChange} />
            </>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
// Force rebuild: Sun Dec  7 23:41:27 EST 2025
