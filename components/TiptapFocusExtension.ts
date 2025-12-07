import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface FocusOptions {
  focusType: 'off' | 'sentence' | 'paragraph';
}

const focusModePluginKey = new PluginKey('focusMode');

export const FocusMode = Extension.create<FocusOptions>({
  name: 'focusMode',

  addOptions() {
    return {
      focusType: 'off',
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: focusModePluginKey,
        
        state: {
          init: () => DecorationSet.empty,
          
          apply(tr, oldState, oldEditorState, newEditorState) {
            const focusType = extension.options.focusType;
            
            if (focusType === 'off') {
              return DecorationSet.empty;
            }

            const { selection } = newEditorState;
            const { $from } = selection;
            
            let focusStart: number = 0;
            let focusEnd: number = 0;

            if (focusType === 'paragraph') {
              // Encontrar início e fim do parágrafo
              const resolvedPos = newEditorState.doc.resolve($from.pos);
              
              // Pegar o nó do parágrafo
              let depth = resolvedPos.depth;
              while (depth > 0 && resolvedPos.node(depth).type.name !== 'paragraph') {
                depth--;
              }
              
              if (depth > 0) {
                focusStart = resolvedPos.start(depth);
                focusEnd = resolvedPos.end(depth);
              } else {
                // Fallback: todo o documento
                focusStart = 0;
                focusEnd = newEditorState.doc.content.size;
              }

            } else if (focusType === 'sentence') {
              // Encontrar início e fim da sentença
              const text = newEditorState.doc.textBetween(0, newEditorState.doc.content.size, '\n', '\n');
              const cursorPos = $from.pos;
              
              // Encontrar início da sentença (após ., !, ? ou início do texto)
              let start = cursorPos;
              while (start > 0) {
                const char = text[start - 1];
                if (char === '.' || char === '!' || char === '?' || char === '\n') {
                  break;
                }
                start--;
              }
              
              // Pular espaços no início
              while (start < text.length && text[start] === ' ') {
                start++;
              }
              
              // Encontrar fim da sentença
              let end = cursorPos;
              while (end < text.length) {
                const char = text[end];
                if (char === '.' || char === '!' || char === '?') {
                  end++;
                  break;
                }
                if (char === '\n') {
                  break;
                }
                end++;
              }
              
              focusStart = start;
              focusEnd = end;

            }

            const decorations: Decoration[] = [];

            // Aplicar dimming antes da área focada
            if (focusStart > 0) {
              decorations.push(
                Decoration.inline(0, focusStart, {
                  class: 'focus-dimmed',
                })
              );
            }

            // Aplicar highlight na área focada
            if (focusStart < focusEnd) {
              decorations.push(
                Decoration.inline(focusStart, focusEnd, {
                  class: 'focus-active',
                })
              );
            }

            // Aplicar dimming depois da área focada
            if (focusEnd < newEditorState.doc.content.size) {
              decorations.push(
                Decoration.inline(focusEnd, newEditorState.doc.content.size, {
                  class: 'focus-dimmed',
                })
              );
            }

            return DecorationSet.create(newEditorState.doc, decorations);
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
