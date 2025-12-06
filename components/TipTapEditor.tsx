'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEffect } from 'react';

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
    content,
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
        if (text) {
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

  // Atualizar conteúdo quando prop mudar
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const markdown = markdownToHtml(content);
      editor.commands.setContent(markdown);
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

  return <EditorContent editor={editor} />;
}

// Funções auxiliares para conversão Markdown <-> HTML
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Negrito: **texto** ou __texto__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Itálico: *texto* ou _texto_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Parágrafos
  html = html.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  
  return html;
}

function htmlToMarkdown(html: string): string {
  let markdown = html;
  
  // Remover tags de parágrafo
  markdown = markdown.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');
  
  // Negrito
  markdown = markdown.replace(/<strong>(.+?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.+?)<\/b>/g, '**$1**');
  
  // Itálico
  markdown = markdown.replace(/<em>(.+?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.+?)<\/i>/g, '*$1*');
  
  // Quebras de linha
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');
  
  // Limpar espaços extras
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  
  return markdown;
}
