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
            y: rect.top - 10,
          };
          onTextSelect(selectedText, position);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect]);

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Container do Quill */
        .ql-container {
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
          border: 1px solid #d1d5db !important;
          border-radius: 0 0 0.5rem 0.5rem !important;
          flex: 1 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Toolbar - Botões menores e mais leves */
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
        
        /* Container externo sem borda */
        .ql-container {
          flex: 1 !important;
          overflow: hidden !important;
          border: none !important;
          position: relative !important;
          max-height: calc(100vh - 32rem) !important;
        }
        
        /* Wrapper sem borda */
        .ql-snow {
          border: none !important;
          max-height: calc(100vh - 32rem) !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Editor interno com scroll */
        .ql-editor {
          padding: 48px 64px 48px 64px !important;
          min-height: 400px !important;
          height: 100% !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          border: none !important;
        }
        
        /* Remover linha rosa do foco */
        .ql-editor:focus {
          outline: none !important;
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
        
        /* Parágrafos vazios visíveis quando selecionados */
        .ql-editor p:empty {
          min-height: 1.5em !important; /* Altura mínima para parágrafos vazios */
        }
        
        .ql-editor p:empty::before {
          content: '\200B'; /* Zero-width space para tornar selecionável */
          display: inline-block;
        }
      `}} />
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
