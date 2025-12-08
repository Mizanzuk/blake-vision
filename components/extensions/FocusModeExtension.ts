import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface FocusModeOptions {
  mode: 'off' | 'sentence' | 'paragraph';
}

/**
 * FocusMode Extension for Tiptap
 * 
 * Implementa o modo foco de forma robusta e nativa ao Tiptap.
 * Aplica decorações (não classes) aos nós do documento para criar
 * o efeito de dimming/highlighting sem conflitar com o schema do editor.
 * 
 * Vantagens desta abordagem:
 * - Integração nativa com Tiptap
 * - Performance otimizada (usa decorações ao invés de manipulação DOM)
 * - Não conflita com o schema do editor
 * - Atualiza automaticamente quando a seleção muda
 * - Código limpo e testável
 */
export const FocusModeExtension = Extension.create<FocusModeOptions>({
  name: 'focusMode',

  addOptions() {
    return {
      mode: 'off',
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

    return [
      new Plugin({
        key: new PluginKey('focusMode'),

        state: {
          init() {
            return DecorationSet.empty;
          },

          apply(tr, oldState) {
            // Se o modo está off, não aplicar decorações
            if (extensionThis.options.mode === 'off') {
              return DecorationSet.empty;
            }

            const { doc, selection } = tr;
            const decorations: Decoration[] = [];

            // Encontrar o nó atual baseado na seleção
            const { from } = selection;
            let currentNode: any = null;
            let currentPos = 0;

            doc.descendants((node, pos) => {
              if (extensionThis.options.mode === 'paragraph') {
                // Modo parágrafo: destacar o parágrafo atual
                if (node.type.name === 'paragraph') {
                  if (pos <= from && from <= pos + node.nodeSize) {
                    currentNode = node;
                    currentPos = pos;
                  }
                }
              } else if (extensionThis.options.mode === 'sentence') {
                // Modo sentença: destacar a sentença atual
                // (implementação simplificada - destaca o parágrafo por enquanto)
                // TODO: Implementar detecção de sentença real
                if (node.type.name === 'paragraph') {
                  if (pos <= from && from <= pos + node.nodeSize) {
                    currentNode = node;
                    currentPos = pos;
                  }
                }
              }
            });

            // Aplicar decorações de dimming a todos os nós, exceto o atual
            doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph') {
                const isDimmed = currentNode && (pos !== currentPos);

                if (isDimmed) {
                  // Aplicar decoração de dimming
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'focus-dimmed',
                    })
                  );
                } else if (currentNode && pos === currentPos) {
                  // Aplicar decoração de destaque ao nó atual
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'focus-active',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
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

  // Adicionar comando para mudar o modo
  addCommands() {
    return {
      setFocusMode:
        (mode: 'off' | 'sentence' | 'paragraph') =>
        ({ commands }) => {
          this.options.mode = mode;
          // Forçar atualização do editor
          return commands.focus();
        },
    };
  },

  // Adicionar CSS global para as decorações
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              if (!attributes.class) {
                return {};
              }
              return {
                class: attributes.class,
              };
            },
          },
        },
      },
    ];
  },
});

export default FocusModeExtension;
