'use client';

import { useEditor, EditorContent } from '@tiptap/react';
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

// Helper: Encontrar sentença atual baseado na posição do cursor
function findCurrentSentence(text: string, cursorPosition: number): { start: number; end: number } | null {
  if (!text || cursorPosition < 0) return null;
  
  // Regex para detectar sentenças (termina com . ! ? seguido de espaço ou fim)
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)/g;
  const sentences: { start: number; end: number; text: string }[] = [];
  
  let match;
  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  // Se não encontrou sentenças com pontuação, considerar todo o texto como uma sentença
  if (sentences.length === 0) {
    return { start: 0, end: text.length };
  }
  
  // Encontrar sentença que contém o cursor
  for (const sentence of sentences) {
    if (cursorPosition >= sentence.start && cursorPosition <= sentence.end) {
      return { start: sentence.start, end: sentence.end };
    }
  }
  
  // Se cursor está após última sentença, usar última sentença
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1];
    if (cursorPosition >= lastSentence.end) {
      return { start: lastSentence.start, end: lastSentence.end };
    }
  }
  
  return null;
}

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
  // FOCUS MODE - PARAGRAPH ONLY (SIMPLIFIED)
  // ========================================
  useEffect(() => {
    if (!editor || focusType !== 'paragraph') {
      // Limpar todos os estilos quando desativado
      const container = editor?.view?.dom;
      if (container) {
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach((p: HTMLElement) => {
          p.style.opacity = '';
          p.style.filter = '';
          p.style.transition = '';
        });
      }
      return;
    }

    console.log('[Focus Mode] Ativando Modo Parágrafo');
    
    const updateFocus = () => {
      try {
        const container = editor.view.dom;
        const { from } = editor.state.selection;
        
        console.log('[Focus Mode] updateFocus - from:', from);
        
        // Encontrar parágrafo atual
        const domAtPos = editor.view.domAtPos(from);
        let currentParagraph: HTMLElement | null = null;
        let node = domAtPos.node as Node;
        
        // Navegar até encontrar <p>
        while (node && node !== container) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
            currentParagraph = node as HTMLElement;
            break;
          }
          node = node.parentNode!;
        }
        
        console.log('[Focus Mode] Parágrafo atual:', currentParagraph?.textContent?.substring(0, 50));
        
        // Aplicar estilos em todos os parágrafos
        const paragraphs = container.querySelectorAll('p');
        console.log('[Focus Mode] Total de parágrafos:', paragraphs.length);
        
        // MODO PARÁGRAFO: Destacar parágrafo inteiro
        paragraphs.forEach((p: HTMLElement) => {
          if (p === currentParagraph) {
            // Parágrafo ativo: nítido
            p.style.opacity = '1';
            p.style.filter = 'none';
            p.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
            console.log('[Focus Mode] Parágrafo ativo:', p.textContent?.substring(0, 30));
          } else {
            // Outros parágrafos: blur
            p.style.opacity = '0.3';
            p.style.filter = 'blur(1px)';
            p.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
          }
        });
        
        console.log('[Focus Mode] Estilos aplicados com sucesso!');
      } catch (error) {
        console.error('[Focus Mode] Erro ao aplicar estilos:', error);
      }
    };
    
    // Atualizar imediatamente
    updateFocus();
    
    // Listeners para eventos do editor
    const handleUpdate = () => {
      console.log('[Focus Mode] Evento disparado');
      updateFocus();
    };
    
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    editor.on('focus', handleUpdate);
    
    return () => {
      console.log('[Focus Mode] Limpando listeners');
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
      editor.off('focus', handleUpdate);
    };
  }, [editor, focusType]);

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
