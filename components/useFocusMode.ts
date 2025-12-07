import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface UseFocusModeProps {
  editor: Editor | null;
  focusType: 'off' | 'sentence' | 'paragraph';
  typewriterMode: boolean;
}

export function useFocusMode({ editor, focusType, typewriterMode }: UseFocusModeProps) {
  useEffect(() => {
    if (!editor) return;

    const updateFocus = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Remove all focus classes first
      const proseMirror = editor.view.dom;
      proseMirror.querySelectorAll('.focus-active, .focus-dimmed').forEach(el => {
        el.classList.remove('focus-active', 'focus-dimmed');
      });

      if (focusType === 'off') return;

      // Get all paragraphs
      const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
      
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

      if (!currentParagraph) return;

      if (focusType === 'paragraph') {
        // Dim all paragraphs except current
        paragraphs.forEach(p => {
          if (p === currentParagraph) {
            p.classList.add('focus-active');
          } else {
            p.classList.add('focus-dimmed');
          }
        });
      } else if (focusType === 'sentence') {
        // For sentence focus, we need to split text into sentences
        const text = currentParagraph.textContent || '';
        const cursorOffset = window.getSelection()?.anchorOffset || 0;
        
        // Simple sentence detection (split by . ! ?)
        const sentences = text.split(/([.!?]+\s+)/);
        let charCount = 0;
        let currentSentenceIndex = 0;
        
        for (let i = 0; i < sentences.length; i++) {
          charCount += sentences[i].length;
          if (charCount >= cursorOffset) {
            currentSentenceIndex = i;
            break;
          }
        }

        // For now, dim all other paragraphs (sentence-level dimming is complex)
        paragraphs.forEach(p => {
          if (p === currentParagraph) {
            p.classList.add('focus-active');
          } else {
            p.classList.add('focus-dimmed');
          }
        });
      }
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

  // Typewriter mode effect
  useEffect(() => {
    if (!editor || !typewriterMode) return;

    const scrollToCursor = () => {
      const { view } = editor;
      const { selection } = view.state;
      const coords = view.coordsAtPos(selection.from);
      
      const editorRect = view.dom.getBoundingClientRect();
      const scrollContainer = view.dom.closest('.overflow-y-auto') as HTMLElement;
      
      if (scrollContainer) {
        const targetScroll = coords.top - editorRect.top - (window.innerHeight / 2);
        scrollContainer.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    };

    editor.on('selectionUpdate', scrollToCursor);
    editor.on('update', scrollToCursor);

    return () => {
      editor.off('selectionUpdate', scrollToCursor);
      editor.off('update', scrollToCursor);
    };
  }, [editor, typewriterMode]);
}
