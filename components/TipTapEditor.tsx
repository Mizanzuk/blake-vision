'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEffect, useRef } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange?: (from: number, to: number, text: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export default function TipTapEditor({
  content,
  onChange,
  onSelectionChange,
  placeholder = 'Escreva seu texto aqui...',
  className = '',
  editable = true,
}: TipTapEditorProps) {
  const isInitialMount = useRef(true);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configurar quebras de linha e parágrafos
        paragraph: {
          HTMLAttributes: {
            style: 'margin-bottom: 21px;', // Espaçamento entre parágrafos
          },
        },
        // Habilitar negrito e itálico
        bold: {},
        italic: {},
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content: markdownToHtml(content),
    editable,
    onUpdate: ({ editor }) => {
      // Converter HTML para Markdown simplificado
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelectionChange) {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text && text.trim()) {
          onSelectionChange(from, to, text);
        }
      }
    },
    editorProps: {
      attributes: {
        class: className,
        style: 'font-size: 14px; line-height: 1.5;',
      },
    },
  });

  // Atualizar conteúdo quando prop mudar (apenas após montagem inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (editor && content) {
      const currentMarkdown = htmlToMarkdown(editor.getHTML());
      // Só atualizar se o conteúdo realmente mudou
      if (currentMarkdown !== content) {
        const html = markdownToHtml(content);
        editor.commands.setContent(html, { emitUpdate: false }); // não emitir update
      }
    }
  }, [content, editor]);

  // Atalhos de teclado customizados
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B = Negrito
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
      // Cmd/Ctrl + I = Itálico
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}

// Funções auxiliares para conversão Markdown <-> HTML
function markdownToHtml(markdown: string): string {
  if (!markdown) return '<p></p>';
  
  let html = markdown;
  
  // Negrito: **texto** ou __texto__ (não greedy, global)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(. +?)__/g, '<strong>$1</strong>');
  
  // Itálico: *texto* ou _texto_ (simples)
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');
  
  // Parágrafos: dividir por \n\n
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      // Substituir quebras simples por <br>
      const withBreaks = p.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    })
    .join('');
  
  return html;
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let markdown = html;
  
  // Remover tags de parágrafo
  markdown = markdown.replace(/<p>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n\n');
  
  // Negrito
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  
  // Itálico
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Quebras de linha
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  
  // Limpar espaços extras e quebras múltiplas
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();
  
  return markdown;
}
