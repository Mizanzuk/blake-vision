'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar React-Quill dinamicamente (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface Entity {
  id: string;
  value: string;
  type: string;
  link?: string;
}

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(0);

  // Configuração do toolbar
  const modules = {
    toolbar: [
      ['bold', 'italic'],
    ],
  };

  const formats = ['bold', 'italic', 'link'];

  // Buscar entidades
  const fetchEntities = async (searchTerm: string) => {
    try {
      const response = await fetch(`/api/entities/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log('🔍 Entidades encontradas:', data);
      return data;
    } catch (error) {
      console.error('Error fetching entities:', error);
      return [];
    }
  };

  // Detectar @ e mostrar dropdown
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();

    const handleTextChange = async (delta: any, oldDelta: any, source: string) => {
      if (source !== 'user') return; // Ignorar mudanças programáticas

      const selection = quill.getSelection();
      if (!selection) return;

      const cursorPosition = selection.index;
      const text = quill.getText(0, cursorPosition);
      
      console.log('📝 Texto até cursor:', text.substring(Math.max(0, text.length - 20)));
      
      // Procurar @ antes do cursor
      const lastAtIndex = text.lastIndexOf('@');
      
      if (lastAtIndex !== -1 && lastAtIndex >= cursorPosition - 20) {
        const textAfterAt = text.substring(lastAtIndex + 1, cursorPosition);
        
        console.log('🎯 Texto após @:', textAfterAt);
        
        // Verificar se não há espaço ou quebra de linha após @
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          setMentionSearch(textAfterAt);
          setMentionStartIndex(lastAtIndex);
          
          // Buscar entidades
          const results = await fetchEntities(textAfterAt);
          setEntities(results);
          setSelectedIndex(0);
          
          // Calcular posição do dropdown
          const bounds = quill.getBounds(cursorPosition);
          const editorRect = quill.root.getBoundingClientRect();
          
          setMentionPosition({
            top: bounds.bottom + editorRect.top + window.scrollY,
            left: bounds.left + editorRect.left + window.scrollX,
          });
          
          setShowMentions(true);
          console.log('✅ Dropdown ativado');
          return;
        }
      }
      
      setShowMentions(false);
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, []);

  // Handler para seleção de texto (Urizen/Urthona)
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

  // Inserir mention
  const insertMention = (entity: Entity) => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (!selection) return;

    console.log('📌 Inserindo mention:', entity);

    // Deletar @ e texto de busca
    const deleteLength = mentionSearch.length + 1; // +1 para o @
    quill.deleteText(mentionStartIndex, deleteLength);

    // Inserir link com o nome da entidade
    quill.insertText(mentionStartIndex, entity.value, 'link', entity.link || `#${entity.id}`);
    quill.insertText(mentionStartIndex + entity.value.length, ' ');
    
    // Mover cursor para depois do espaço
    quill.setSelection(mentionStartIndex + entity.value.length + 1);

    setShowMentions(false);
    setMentionSearch('');
    setEntities([]);
  };

  // Navegação por teclado
  useEffect(() => {
    if (!showMentions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMentions || entities.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % entities.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + entities.length) % entities.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(entities[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMentions, entities, selectedIndex]);

  // Ícones por tipo
  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      character: '👤',
      location: '📍',
      event: '📅',
      object: '🔷',
    };
    return icons[type] || '🔹';
  };

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

        /* Links (mentions) */
        .ql-editor a {
          background-color: #e8f4f8 !important;
          color: #0066cc !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
        }

        .ql-editor a:hover {
          background-color: #d0e8f0 !important;
        }
      `}</style>

      <ReactQuill
        ref={quillRef as any}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />

      {/* Dropdown de Mentions */}
      {showMentions && entities.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '4px 0',
            minWidth: '250px',
          }}
        >
          {entities.map((entity, index) => (
            <div
              key={entity.id}
              onClick={() => insertMention(entity)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f5f1e8' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span style={{ fontSize: '16px' }}>{getIcon(entity.type)}</span>
              <span style={{ flex: 1, fontWeight: 500, color: '#333' }}>{entity.value}</span>
              <span style={{ fontSize: '12px', color: '#999', textTransform: 'capitalize' }}>
                {entity.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
