'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Importar React-Quill dinamicamente (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import 'quill-mention/dist/quill.mention.css';

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
  const quillRef = useRef<any>(null);

  // Configurar quill-mention após o componente montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupMention = async () => {
      // Importar Quill e quill-mention
      const Quill = (await import('quill')).default;
      const QuillMention = (await import('quill-mention')).default;
      
      // Registrar o módulo
      Quill.register('modules/mention', QuillMention);
    };

    setupMention();
  }, []);

  // Função para buscar entidades
  const fetchEntities = async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      return [];
    }
  };

  // Configuração do toolbar e modules
  const modules = {
    toolbar: [
      ['bold', 'italic'],
    ],
    mention: {
      allowedChars: /^[A-Za-z\sÀ-ÿ0-9_]*$/,
      mentionDenotationChars: ['@'],
      source: async function (searchTerm: string, renderList: (matches: any[], searchTerm: string) => void) {
        if (searchTerm.length === 0) {
          renderList([], searchTerm);
          return;
        }

        const matches = await fetchEntities(searchTerm);
        renderList(matches, searchTerm);
      },
      renderItem: function (item: any, searchTerm: string) {
        // Ícones por tipo de entidade
        const icons: Record<string, string> = {
          character: '👤',
          location: '📍',
          event: '📅',
          object: '🔷',
        };
        
        const icon = icons[item.type] || '🔹';
        return `<div class="mention-item">
          <span class="mention-icon">${icon}</span>
          <span class="mention-name">${item.value}</span>
          <span class="mention-type">${item.type}</span>
        </div>`;
      },
      dataAttributes: ['id', 'value', 'type', 'link'],
      onSelect: function (item: any, insertItem: (item: any) => void) {
        console.log('Entity mentioned:', item);
        insertItem(item);
      },
    },
  };

  const formats = ['bold', 'italic', 'mention'];

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
            y: rect.top - 30,
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

        .ql-editor p {
          min-height: 1.5em !important;
        }

        /* Quill Mention Styles */
        .ql-mention-list-container {
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-height: 300px;
          overflow-y: auto;
          z-index: 9999;
        }

        .ql-mention-list {
          list-style: none;
          margin: 0;
          padding: 4px 0;
        }

        .ql-mention-list-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .ql-mention-list-item:hover,
        .ql-mention-list-item.selected {
          background-color: #f5f1e8;
        }

        .mention-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mention-icon {
          font-size: 16px;
        }

        .mention-name {
          flex: 1;
          font-weight: 500;
          color: #333;
        }

        .mention-type {
          font-size: 12px;
          color: #999;
          text-transform: capitalize;
        }

        /* Mention no texto */
        .mention {
          background-color: #e8f4f8;
          color: #0066cc;
          padding: 2px 4px;
          border-radius: 3px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .mention:hover {
          background-color: #d0e8f0;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
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
