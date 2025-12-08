import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface FocusModeOptions {
  focusType: 'off' | 'sentence' | 'paragraph';
  typewriterMode: boolean;
}

export const FocusModeExtension = Extension.create<FocusModeOptions>({
  name: 'focusMode',

  addOptions() {
    return {
      focusType: 'off',
      typewriterMode: false,
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

    return [
      new Plugin({
        key: new PluginKey('focusMode'),
        
        props: {
          decorations(state) {
            const { focusType } = extensionThis.options;
            
            // Se focus mode estiver off, não aplicar decorations
            if (focusType === 'off') {
              return DecorationSet.empty;
            }

            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const { from } = selection;

            // Encontrar o parágrafo atual
            let currentParagraphPos: { from: number; to: number } | null = null;
            
            doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph') {
                const nodeFrom = pos;
                const nodeTo = pos + node.nodeSize;
                
                // Verificar se o cursor está dentro deste parágrafo
                if (from >= nodeFrom && from <= nodeTo) {
                  currentParagraphPos = { from: nodeFrom, to: nodeTo };
                  
                  // Se for modo sentença, encontrar sentença atual
                  if (focusType === 'sentence') {
                    const text = node.textContent;
                    const cursorOffset = from - nodeFrom - 1; // -1 para ajustar posição
                    
                    // Regex para detectar sentenças
                    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
                    
                    let currentSentenceStart = 0;
                    let currentSentenceEnd = 0;
                    let accumulatedLength = 0;
                    
                    for (const sentence of sentences) {
                      currentSentenceStart = accumulatedLength;
                      currentSentenceEnd = accumulatedLength + sentence.length;
                      
                      if (cursorOffset >= currentSentenceStart && cursorOffset <= currentSentenceEnd) {
                        // Encontrou a sentença atual
                        currentParagraphPos = {
                          from: nodeFrom + currentSentenceStart + 1,
                          to: nodeFrom + currentSentenceEnd + 1
                        };
                        break;
                      }
                      
                      accumulatedLength += sentence.length;
                    }
                  }
                }
              }
            });

            // Aplicar blur em todos os parágrafos exceto o atual
            doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph') {
                const nodeFrom = pos;
                const nodeTo = pos + node.nodeSize;
                
                // Se não for o parágrafo/sentença atual, aplicar blur
                const isCurrentNode = currentParagraphPos && 
                  nodeFrom >= currentParagraphPos.from && 
                  nodeTo <= currentParagraphPos.to;
                
                if (!isCurrentNode) {
                  decorations.push(
                    Decoration.node(nodeFrom, nodeTo, {
                      class: 'focus-mode-blur',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        
        // Typewriter mode: scroll para centralizar cursor
        view() {
          return {
            update(view) {
              if (!extensionThis.options.typewriterMode) {
                return;
              }

              // Debounce para evitar múltiplos scrolls
              setTimeout(() => {
                const { state } = view;
                const { from } = state.selection;
                
                // Encontrar coordenadas do cursor
                const coords = view.coordsAtPos(from);
                const editorRect = view.dom.getBoundingClientRect();
                
                // Calcular posição central
                const viewportHeight = window.innerHeight;
                const targetY = viewportHeight / 2;
                const currentY = coords.top - editorRect.top;
                const scrollOffset = currentY - targetY;
                
                // Scroll suave
                view.dom.scrollBy({
                  top: scrollOffset,
                  behavior: 'smooth'
                });
              }, 50);
            },
          };
        },
      }),
    ];
  },

});
