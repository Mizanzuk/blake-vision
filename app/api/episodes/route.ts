import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/episodes - Listar episódios
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const world_id = searchParams.get("world_id");
    const status = searchParams.get("status");

    let query = supabase
      .from("episodes")
      .select("*")
      .eq("user_id", user.id);

    if (world_id) {
      query = query.eq("world_id", world_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: episodes, error } = await query.order("numero", { ascending: true });

    if (error) {
      console.error("Erro ao buscar episódios:", error);
      return NextResponse.json({ error: "Erro ao buscar episódios" }, { status: 500 });
    }

    return NextResponse.json({ episodes: episodes || [] });

  } catch (error: any) {
    console.error("Erro na API de episodes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST /api/episodes - Criar novo episódio
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { world_id, numero, titulo, logline, sinopse, ordem, duracao_minutos, data_lancamento, status } = body;

    // Validações
    if (!world_id) {
      return NextResponse.json({ error: "world_id é obrigatório" }, { status: 400 });
    }

    if (!numero || numero <= 0) {
      return NextResponse.json({ error: "numero deve ser maior que 0" }, { status: 400 });
    }

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json({ error: "titulo é obrigatório" }, { status: 400 });
    }

    // Verificar se mundo pertence ao usuário
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('id, user_id')
      .eq('id', world_id)
      .eq('user_id', user.id)
      .single();

    if (worldError || !world) {
      return NextResponse.json(
        { error: 'Mundo não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Verificar se já existe episódio com mesmo número neste mundo
    const { data: existingEpisode } = await supabase
      .from('episodes')
      .select('id')
      .eq('world_id', world_id)
      .eq('numero', numero)
      .single();

    if (existingEpisode) {
      return NextResponse.json(
        { error: `Já existe um episódio com número ${numero} neste mundo` },
        { status: 409 }
      );
    }

    // Preparar dados do episódio
    const episodeData: any = {
      user_id: user.id,
      world_id,
      numero,
      titulo: titulo.trim(),
    };

    // Campos opcionais
    if (logline) episodeData.logline = logline.trim();
    if (sinopse) episodeData.sinopse = sinopse.trim();
    if (ordem !== undefined) episodeData.ordem = ordem;
    if (duracao_minutos !== undefined) episodeData.duracao_minutos = duracao_minutos;
    if (data_lancamento) episodeData.data_lancamento = data_lancamento;
    if (status) episodeData.status = status;

    const { data: episode, error } = await supabase
      .from("episodes")
      .insert(episodeData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar episódio:", error);
      return NextResponse.json({ error: "Erro ao criar episódio", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ episode }, { status: 201 });

  } catch (error: any) {
    console.error("Erro na API de episodes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT /api/episodes - Atualizar episódio
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, titulo, logline, sinopse, ordem, duracao_minutos, data_lancamento, status } = body;

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    // Verificar se episódio existe e pertence ao usuário
    const { data: existingEpisode, error: fetchError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEpisode) {
      return NextResponse.json(
        { error: 'Episódio não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (titulo !== undefined) updateData.titulo = titulo.trim();
    if (logline !== undefined) updateData.logline = logline ? logline.trim() : null;
    if (sinopse !== undefined) updateData.sinopse = sinopse ? sinopse.trim() : null;
    if (ordem !== undefined) updateData.ordem = ordem;
    if (duracao_minutos !== undefined) updateData.duracao_minutos = duracao_minutos;
    if (data_lancamento !== undefined) updateData.data_lancamento = data_lancamento;
    if (status !== undefined) updateData.status = status;

    const { data: episode, error } = await supabase
      .from("episodes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar episódio:", error);
      return NextResponse.json({ error: "Erro ao atualizar episódio", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ episode });

  } catch (error: any) {
    console.error("Erro na API de episodes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE /api/episodes - Deletar episódio
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

    // Verificar se episódio existe e pertence ao usuário
    const { data: existingEpisode, error: fetchError } = await supabase
      .from('episodes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEpisode) {
      return NextResponse.json(
        { error: 'Episódio não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar episódio:", error);
      return NextResponse.json({ error: "Erro ao deletar episódio", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Episódio deletado com sucesso' });

  } catch (error: any) {
    console.error("Erro na API de episodes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
