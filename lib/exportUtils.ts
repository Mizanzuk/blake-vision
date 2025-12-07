// Utilitário para exportar textos em diferentes formatos

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export type ExportFormat = 'pdf' | 'docx' | 'txt';

interface ExportOptions {
  title: string;
  content: string;
  format: ExportFormat;
}

/**
 * Remove formatação HTML/Markdown e retorna texto puro
 */
function stripFormatting(html: string): string {
  // Remove tags HTML
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decodifica entidades HTML
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  text = textarea.value;
  
  // Remove múltiplas quebras de linha
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

/**
 * Exporta texto para PDF
 */
async function exportToPDF(title: string, content: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configurações
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 7;

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, margin);

  // Conteúdo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const textLines = doc.splitTextToSize(stripFormatting(content), maxWidth);
  let y = margin + 15;

  for (const line of textLines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  // Download
  doc.save(`${title}.pdf`);
}

/**
 * Exporta texto para DOCX
 */
async function exportToDOCX(title: string, content: string): Promise<void> {
  const plainText = stripFormatting(content);
  const paragraphs = plainText.split('\n\n').filter(p => p.trim());

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Título
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32, // 16pt
              }),
            ],
            spacing: {
              after: 400,
            },
          }),
          // Conteúdo
          ...paragraphs.map(
            (para) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: para,
                    size: 24, // 12pt
                  }),
                ],
                spacing: {
                  after: 200,
                },
              })
          ),
        ],
      },
    ],
  });

  // Gerar blob e download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Exporta texto para TXT
 */
function exportToTXT(title: string, content: string): void {
  const plainText = stripFormatting(content);
  const fullText = `${title}\n${'='.repeat(title.length)}\n\n${plainText}`;

  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Função principal de exportação
 */
export async function exportText({ title, content, format }: ExportOptions): Promise<void> {
  try {
    switch (format) {
      case 'pdf':
        await exportToPDF(title, content);
        break;
      case 'docx':
        await exportToDOCX(title, content);
        break;
      case 'txt':
        exportToTXT(title, content);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
  } catch (error) {
    console.error('Erro ao exportar texto:', error);
    throw error;
  }
}
