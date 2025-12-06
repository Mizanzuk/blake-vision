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
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva seu texto aqui...',
  className = '',
}: RichTextEditorProps) {
  // Configuração do toolbar (apenas negrito e itálico)
  const modules = {
    toolbar: [
      ['bold', 'italic'],
    ],
  };

  const formats = ['bold', 'italic'];

  return (
    <div className={className}>
      <style jsx global>{`
        .ql-container {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        .ql-editor {
          padding: 48px 64px !important;
          min-height: 200px;
        }
        
        .ql-editor p {
          margin-bottom: 21px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
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
