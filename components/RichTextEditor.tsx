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
      <style jsx global>{`
        .ql-container {
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          border: none !important;
        }
        
        .ql-editor {
          padding: 48px 64px 120px 64px !important;
          min-height: 400px;
          max-height: 70vh;
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        
        .ql-editor p {
          margin-bottom: 14px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        .ql-editor p + p {
          margin-top: 14px !important;
        }
        
        .ql-editor p:last-child {
          margin-bottom: 0 !important;
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
