import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // Handle FormData request (file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "Arquivo não fornecido" },
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "Arquivo muito grande (máximo 50MB)" },
          { status: 400 }
        );
      }

      // Get file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      let extractedText = "";

      try {
        const buffer = await file.arrayBuffer();

        if (fileExtension === "pdf") {
          const pdfData = await pdfParse(Buffer.from(buffer));
          extractedText = pdfData.text;
        } else if (fileExtension === "docx") {
          const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
          extractedText = result.value;
        } else if (fileExtension === "txt") {
          extractedText = new TextDecoder().decode(buffer);
        } else {
          return NextResponse.json(
            { error: `Formato de arquivo não suportado: ${fileExtension}. Suportados: PDF, DOCX, TXT` },
            { status: 400 }
          );
        }

        if (!extractedText || extractedText.trim().length === 0) {
          return NextResponse.json(
            { error: "Não foi possível extrair texto do documento" },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          text: extractedText.trim(),
          fileName: file.name,
        });
      } catch (parseError: any) {
        console.error("Parse error:", parseError);
        return NextResponse.json(
          { error: `Erro ao processar arquivo: ${parseError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Content-Type deve ser multipart/form-data" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Parse endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
