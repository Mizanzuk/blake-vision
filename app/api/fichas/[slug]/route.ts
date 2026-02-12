import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "Slug é obrigatório" }, { status: 400 });
    }

    // Buscar ficha por slug
    let query = supabase
      .from("fichas")
      .select("*")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .single();

    const { data: ficha, error } = await query;

    // Se não encontrou por slug, tentar buscar por titulo (case-insensitive)
    if (error || !ficha) {
      const { data: fichaByTitulo, error: errorTitulo } = await supabase
        .from("fichas")
        .select("*")
        .eq("user_id", user.id)
        .ilike("titulo", slug.replace(/-/g, " "))
        .limit(1)
        .single();

      if (errorTitulo || !fichaByTitulo) {
        return NextResponse.json(
          { error: "Ficha não encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json({ ficha: fichaByTitulo });
    }

    return NextResponse.json({ ficha });
  } catch (error: any) {
    console.error("Erro na API de ficha por slug:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Deletar ficha por ID
    const { error } = await supabase
      .from("fichas")
      .delete()
      .eq("id", slug)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar ficha:", error);
      return NextResponse.json(
        { error: error.message || "Erro ao deletar ficha" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de delete de ficha:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const body = await req.json();
    const {
      titulo,
      resumo,
      conteudo,
      ano_diegese,
      tags,
      episodio,
      album_imagens,
      descricao_data,
      data_inicio,
      data_fim,
      granularidade_data,
      camada_temporal,
    } = body;

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (titulo !== undefined) updateData.titulo = titulo;
    if (resumo !== undefined) updateData.resumo = resumo || null;
    if (conteudo !== undefined) updateData.conteudo = conteudo || null;
    if (ano_diegese !== undefined) updateData.ano_diegese = ano_diegese || null;
    if (tags !== undefined) updateData.tags = tags || null;
    if (episodio !== undefined) updateData.episodio = episodio || null;
    if (episodio !== undefined) updateData.episodio = episodio || null;
    if (album_imagens !== undefined) updateData.album_imagens = album_imagens || null;
    if (descricao_data !== undefined) updateData.descricao_data = descricao_data || null;
    if (data_inicio !== undefined) updateData.data_inicio = data_inicio || null;
    if (data_fim !== undefined) updateData.data_fim = data_fim || null;
    if (granularidade_data !== undefined) updateData.granularidade_data = granularidade_data || null;
    if (camada_temporal !== undefined) updateData.camada_temporal = camada_temporal || null;

    // Atualizar ficha
    const { data: ficha, error } = await supabase
      .from("fichas")
      .update(updateData)
      .eq("id", slug)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar ficha:", error);
      return NextResponse.json(
        { error: error.message || "Erro ao atualizar ficha" },
        { status: 500 }
      );
    }

    if (!ficha) {
      return NextResponse.json(
        { error: "Ficha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ficha, success: true });
  } catch (error: any) {
    console.error("Erro na API de atualização de ficha:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
