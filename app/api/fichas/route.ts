import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { generateEmbedding } from "@/app/lib/rag";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    if (!search) {
      return NextResponse.json(
        { error: "Parâmetro search é obrigatório" },
        { status: 400 }
      );
    }

    const { data: fichas, error } = await supabase
      .from("fichas")
      .select("id, titulo, tipo, slug")
      .ilike("titulo", `%${search}%`)
      .eq("user_id", user.id)
      .limit(10);

    if (error) {
      console.error("Erro ao buscar fichas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar fichas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ fichas: fichas || [] });
  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      world_id,
      tipo,
      titulo,
      slug,
      codigo,
      resumo,
      conteudo,
      ano_diegese,
      tags,
      episodio,
      imagem_capa,
      album_imagens,
      descricao_data,
      data_inicio,
      data_fim,
      granularidade_data,
      camada_temporal,
    } = body;

    if (!world_id || !tipo || !titulo) {
      return NextResponse.json(
        { error: "world_id, tipo e titulo são obrigatórios" },
        { status: 400 }
      );
    }

    // Generate embedding
    const textForEmbedding = `${titulo} ${resumo || ""} ${conteudo || ""}`.trim();
    let embedding: number[] | null = null;
    
    if (textForEmbedding) {
      try {
        embedding = await generateEmbedding(textForEmbedding);
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    }

    const { data: ficha, error } = await supabase
      .from("fichas")
      .insert({
        user_id: user.id,
        world_id,
        tipo,
        titulo,
        slug: slug || null,
        codigo: codigo || null,
        resumo: resumo || null,
        conteudo: conteudo || null,
        ano_diegese: ano_diegese || null,
        tags: tags || null,
        episodio: episodio || null,
        imagem_capa: imagem_capa || null,
        album_imagens: album_imagens || null,
        descricao_data: descricao_data || null,
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        granularidade_data: granularidade_data || null,
        camada_temporal: camada_temporal || null,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar ficha:", error);
      return NextResponse.json({ error: "Erro ao criar ficha" }, { status: 500 });
    }

    return NextResponse.json({ ficha });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Generate new embedding if content changed
    const textForEmbedding = `${updateData.titulo || ""} ${updateData.resumo || ""} ${updateData.conteudo || ""}`.trim();
    
    if (textForEmbedding) {
      try {
        updateData.embedding = await generateEmbedding(textForEmbedding);
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: ficha, error } = await supabase
      .from("fichas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar ficha:", error);
      return NextResponse.json({ error: "Erro ao atualizar ficha" }, { status: 500 });
    }

    return NextResponse.json({ ficha });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("fichas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar ficha:", error);
      return NextResponse.json({ error: "Erro ao deletar ficha" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
