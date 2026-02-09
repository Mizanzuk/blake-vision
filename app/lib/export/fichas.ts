import type { Ficha } from "@/app/types";

/**
 * Formata uma ficha para exibição em texto
 */
function formatFichaToText(ficha: Ficha): string {
  const lines: string[] = [];

  lines.push(`${"=".repeat(60)}`);
  lines.push(`TIPO: ${ficha.tipo.toUpperCase()}`);
  lines.push(`TÍTULO: ${ficha.titulo}`);
  
  if (ficha.codigo) {
    lines.push(`CÓDIGO: ${ficha.codigo}`);
  }
  
  if (ficha.episodio) {
    lines.push(`EPISÓDIO: ${ficha.episodio}`);
  }

  lines.push(`${"=".repeat(60)}`);
  lines.push("");

  if (ficha.descricao) {
    lines.push("DESCRIÇÃO:");
    lines.push(ficha.descricao);
    lines.push("");
  }

  if (ficha.conteudo) {
    lines.push("CONTEÚDO:");
    lines.push(ficha.conteudo);
    lines.push("");
  }

  if (ficha.resumo) {
    lines.push("RESUMO:");
    lines.push(ficha.resumo);
    lines.push("");
  }

  if (ficha.tags && ficha.tags.length > 0) {
    lines.push("TAGS:");
    lines.push(ficha.tags.join(", "));
    lines.push("");
  }

  lines.push(`${"=".repeat(60)}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Exporta fichas como TXT
 */
export function exportAsText(fichas: Ficha[]): void {
  const content = fichas.map(formatFichaToText).join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadFile(blob, `fichas-${Date.now()}.txt`);
}

/**
 * Exporta fichas como DOC (usando HTML que pode ser aberto em Word)
 */
export function exportAsDoc(fichas: Ficha[]): void {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
    }
    .ficha {
      page-break-inside: avoid;
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 20px;
    }
    .ficha-header {
      background-color: #f5f5f5;
      padding: 10px;
      margin-bottom: 10px;
      border-left: 4px solid #e74c3c;
    }
    .ficha-title {
      font-size: 18px;
      font-weight: bold;
      margin: 5px 0;
    }
    .ficha-meta {
      font-size: 12px;
      color: #666;
      margin: 3px 0;
    }
    .ficha-section {
      margin: 10px 0;
    }
    .ficha-section-title {
      font-weight: bold;
      color: #333;
      margin-top: 10px;
      margin-bottom: 5px;
    }
    .ficha-content {
      color: #555;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>Fichas Exportadas</h1>
  <p>Data: ${new Date().toLocaleString("pt-BR")}</p>
  <hr>
  ${fichas
    .map(
      (ficha) => `
    <div class="ficha">
      <div class="ficha-header">
        <div class="ficha-title">${escapeHtml(ficha.titulo)}</div>
        <div class="ficha-meta">Tipo: ${escapeHtml(ficha.tipo)}</div>
        ${ficha.codigo ? `<div class="ficha-meta">Código: ${escapeHtml(ficha.codigo)}</div>` : ""}
        ${ficha.episodio ? `<div class="ficha-meta">Episódio: ${escapeHtml(ficha.episodio)}</div>` : ""}
      </div>
      
      ${ficha.descricao ? `
        <div class="ficha-section">
          <div class="ficha-section-title">Descrição</div>
          <div class="ficha-content">${escapeHtml(ficha.descricao)}</div>
        </div>
      ` : ""}
      
      ${ficha.conteudo ? `
        <div class="ficha-section">
          <div class="ficha-section-title">Conteúdo</div>
          <div class="ficha-content">${escapeHtml(ficha.conteudo)}</div>
        </div>
      ` : ""}
      
      ${ficha.resumo ? `
        <div class="ficha-section">
          <div class="ficha-section-title">Resumo</div>
          <div class="ficha-content">${escapeHtml(ficha.resumo)}</div>
        </div>
      ` : ""}
      
      ${ficha.tags && ficha.tags.length > 0 ? `
        <div class="ficha-section">
          <div class="ficha-section-title">Tags</div>
          <div class="ficha-content">${escapeHtml(ficha.tags.join(", "))}</div>
        </div>
      ` : ""}
    </div>
  `
    )
    .join("")}
</body>
</html>
  `;

  const blob = new Blob([htmlContent], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadFile(blob, `fichas-${Date.now()}.docx`);
}

/**
 * Exporta fichas como PDF
 */
export async function exportAsPdf(fichas: Ficha[]): Promise<void> {
  try {
    // Importar dinamicamente para evitar carregar a biblioteca se não for usada
    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

    // Título
    doc.setFontSize(16);
    doc.text("Fichas Exportadas", margin, yPosition);
    yPosition += 10;

    // Data
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleString("pt-BR")}`, margin, yPosition);
    yPosition += 10;

    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Fichas
    doc.setTextColor(0);
    fichas.forEach((ficha, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Header da ficha
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(ficha.titulo, margin, yPosition, { maxWidth });
      yPosition += 7;

      // Meta informações
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text(`Tipo: ${ficha.tipo}`, margin, yPosition);
      yPosition += 5;

      if (ficha.codigo) {
        doc.text(`Código: ${ficha.codigo}`, margin, yPosition);
        yPosition += 5;
      }

      if (ficha.episodio) {
        doc.text(`Episódio: ${ficha.episodio}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 3;
      doc.setDrawColor(220);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Conteúdo
      doc.setTextColor(0);
      doc.setFontSize(10);

      if (ficha.descricao) {
        doc.setFont(undefined, "bold");
        doc.text("Descrição:", margin, yPosition);
        yPosition += 5;
        doc.setFont(undefined, "normal");
        const descLines = doc.splitTextToSize(ficha.descricao, maxWidth);
        doc.text(descLines, margin, yPosition);
        yPosition += descLines.length * 4 + 3;
      }

      if (ficha.conteudo) {
        doc.setFont(undefined, "bold");
        doc.text("Conteúdo:", margin, yPosition);
        yPosition += 5;
        doc.setFont(undefined, "normal");
        const contentLines = doc.splitTextToSize(ficha.conteudo, maxWidth);
        doc.text(contentLines, margin, yPosition);
        yPosition += contentLines.length * 4 + 3;
      }

      if (ficha.resumo) {
        doc.setFont(undefined, "bold");
        doc.text("Resumo:", margin, yPosition);
        yPosition += 5;
        doc.setFont(undefined, "normal");
        const resumoLines = doc.splitTextToSize(ficha.resumo, maxWidth);
        doc.text(resumoLines, margin, yPosition);
        yPosition += resumoLines.length * 4 + 3;
      }

      if (ficha.tags && ficha.tags.length > 0) {
        doc.setFont(undefined, "bold");
        doc.text("Tags:", margin, yPosition);
        yPosition += 5;
        doc.setFont(undefined, "normal");
        doc.text(ficha.tags.join(", "), margin, yPosition, { maxWidth });
        yPosition += 5;
      }

      yPosition += 10;
    });

    doc.save(`fichas-${Date.now()}.pdf`);
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    throw error;
  }
}

/**
 * Função auxiliar para fazer download de arquivo
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Função auxiliar para escapar HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
