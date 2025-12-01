import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

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

    // Handle JSON request (saving extracted fichas)
    if (contentType.includes("application/json")) {
      const { fichas, worldId, universeId } = await request.json();

      if (!fichas || !Array.isArray(fichas) || fichas.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma ficha fornecida" },
          { status: 400 }
        );
      }

      if (!worldId || !universeId) {
        return NextResponse.json(
          { error: "Mundo e universo são obrigatórios" },
          { status: 400 }
        );
      }

      // Save fichas to database
      // Helper function to slugify
      function slugify(text: string): string {
        return text
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      const fichasToInsert = fichas.map((ficha: any) => ({
        user_id: user.id,
        world_id: worldId,
        tipo: ficha.type || ficha.tipo || "conceito",
        titulo: ficha.name || ficha.title || ficha.titulo,
        slug: slugify(ficha.name || ficha.title || ficha.titulo),
        resumo: ficha.summary || ficha.resumo || null,
        conteudo: ficha.description || ficha.content || ficha.conteudo || null,
        tags: Array.isArray(ficha.tags) ? ficha.tags.join(", ") : (ficha.tags || null),
        episodio: null,
        aparece_em: null,
        codigo: null,
        ano_diegese: null,
        descricao_data: null,
        data_inicio: null,
        data_fim: null,
        granularidade_data: "vago",
        camada_temporal: "linha_principal",
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from("fichas")
        .insert(fichasToInsert)
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { error: "Erro ao salvar fichas no banco de dados" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        count: insertedData?.length || 0,
        entities: insertedData,
      });
    }

    // Handle FormData request (file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const universeId = formData.get("universe_id") as string;
      const worldId = formData.get("world_id") as string;

      if (!file) {
        return NextResponse.json(
          { error: "Arquivo não fornecido" },
          { status: 400 }
        );
      }

      if (!universeId || !worldId) {
        return NextResponse.json(
          { error: "Universo e mundo são obrigatórios" },
          { status: 400 }
        );
      }

      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, fileBytes, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: "Erro ao fazer upload do arquivo" },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      return NextResponse.json({
        success: true,
        file_path: fileName,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
    }

    // Unsupported content type
    return NextResponse.json(
      { error: "Content-Type não suportado. Use application/json ou multipart/form-data." },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
