'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { registerQuillMention } from '@/app/lib/quill-setup';

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
  const [isReady, setIsReady] = useState(false);

  // Registrar quill-mention antes de renderizar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    registerQuillMention().then(() => {
      setIsReady(true);
    });
  }, []);

  // Função para buscar entidades
  const fetchEntities = async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log('Entidades encontradas:', data);
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
        console.log('🔍 Buscando:', searchTerm);
        
        if (searchTerm.length === 0) {
          renderList([], searchTerm);
          return;
        }

        const matches = await fetchEntities(searchTerm);
        console.log('📋 Matches:', matches);
        renderList(matches, searchTerm);
      },
      renderItem: function (item: any) {
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
        console.log('✅ Entity mentioned:', item);
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

  // Não renderizar até estar pronto
  if (!isReady) {
    return <div className={className}>Carregando editor...</div>;
  }

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
          background-color: #ffffff !important;
          border: 1px solid #e0e0e0 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          max-height: 300px !important;
          overflow-y: auto !important;
          z-index: 9999 !important;
          padding: 4px 0 !important;
        }

        .ql-mention-list {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .ql-mention-list-item {
          padding: 8px 12px !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
        }

        .ql-mention-list-item:hover,
        .ql-mention-list-item.selected {
          background-color: #f5f1e8 !important;
        }

        .mention-item {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .mention-icon {
          font-size: 16px !important;
        }

        .mention-name {
          flex: 1 !important;
          font-weight: 500 !important;
          color: #333 !important;
        }

        .mention-type {
          font-size: 12px !important;
          color: #999 !important;
          text-transform: capitalize !important;
        }

        /* Mention no texto */
        .mention {
          background-color: #e8f4f8 !important;
          color: #0066cc !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
        }

        .mention:hover {
          background-color: #d0e8f0 !important;
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
