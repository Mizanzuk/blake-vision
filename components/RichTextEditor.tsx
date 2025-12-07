'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Importar React-Quill dinamicamente (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onTextSelect?: (text: string, position: { x: number; y: number }) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva seu texto aqui...',
  className = '',
  onTextSelect,
}: RichTextEditorProps) {
  // Configuração do toolbar (apenas negrito e itálico)
  const modules = {
    toolbar: [
      ['bold', 'italic'],
    ],
  };

  const formats = ['bold', 'italic'];

  // Handler para seleção de texto
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0 && onTextSelect) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          const position = {
            x: rect.left + rect.width / 2,
            y: rect.top - 30, // Botões aparecem 30px acima da seleção
          };
          onTextSelect(selectedText, position);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect]);

  // NOVA FUNCIONALIDADE: Adicionar ZWSP em parágrafos vazios
  useEffect(() => {
    const addZeroWidthSpaceToEmptyParagraphs = () => {
      const editor = document.querySelector('.ql-editor');
      if (!editor) return;

      const paragraphs = editor.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const children = p.childNodes;
        // Se o parágrafo tem apenas um <br>, substituir por ZWSP + <br>
        if (children.length === 1 && children[0].nodeName === 'BR') {
          // Adicionar zero-width space antes do <br>
          const textNode = document.createTextNode('\u200B');
          p.insertBefore(textNode, children[0]);
        }
      });
    };

    // Executar após cada mudança no editor
    const observer = new MutationObserver(addZeroWidthSpaceToEmptyParagraphs);
    const editor = document.querySelector('.ql-editor');
    
    if (editor) {
      observer.observe(editor, {
        childList: true,
        subtree: true,
      });
      
      // Executar uma vez no início
      addZeroWidthSpaceToEmptyParagraphs();
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <div className={className}>
      <style jsx global>{`
        /* Remover todas as bordas */
        .ql-container {
          border: none !important;
        }

        .ql-snow {
          border: none !important;
          max-height: calc(100vh - 32rem) !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .ql-editor {
          border: none !important;
        }

        .ql-editor:focus {
          outline: none !important;
        }

        /* Toolbar styling */
        .ql-toolbar {
          border: none !important;
          background-color: #f5f1e8 !important;
          padding: 12px 64px !important;
          flex-shrink: 0 !important;
          margin-bottom: 0 !important;
          margin-top: -28px !important;
        }

        .ql-toolbar button {
          width: 28px !important;
          height: 28px !important;
          padding: 4px !important;
        }

        .ql-toolbar button svg {
          width: 14px !important;
          height: 14px !important;
        }

        /* Container e altura */
        .ql-container {
          flex: 1 !important;
          overflow: hidden !important;
          border: none !important;
          position: relative !important;
          max-height: calc(100vh - 32rem) !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Editor padding e scroll */
        .ql-editor {
          padding: 48px 64px 48px 64px !important;
          min-height: 400px !important;
          height: 100% !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          border: none !important;
        }

        /* Tipografia */
        .ql-container {
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
        }

        .ql-editor p {
          margin-bottom: 14px !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
        }

        .ql-editor p + p {
          margin-top: 14px !important;
        }

        .ql-editor p:last-child {
          margin-bottom: 14px !important;
        }

        /* NOVA FUNCIONALIDADE: Parágrafos vazios selecionáveis */
        .ql-editor p {
          min-height: 1.5em !important;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
