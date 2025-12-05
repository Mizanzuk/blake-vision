import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Listar textos do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'rascunho' ou 'publicado'
    const id = searchParams.get("id");

    // Se tem ID, buscar texto específico
    if (id) {
      const { data: texto, error } = await supabase
        .from("textos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar texto:", error);
        return NextResponse.json({ error: "Texto não encontrado" }, { status: 404 });
      }

      return NextResponse.json({ texto });
    }

    // Buscar todos os textos do usuário
    let query = supabase
      .from("textos")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq("status", status);
    }

    const { data: textos, error } = await query;

    if (error) {
      console.error("Erro ao buscar textos:", error);
      return NextResponse.json({ error: "Erro ao buscar textos" }, { status: 500 });
    }

    return NextResponse.json({ textos });

  } catch (error: any) {
    console.error("Erro na API de textos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Criar novo texto
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, conteudo, universe_id, world_id, episodio, categoria, status = 'rascunho' } = body;

    // Apenas título é obrigatório (conteúdo pode ser vazio no primeiro save)
    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const { data: texto, error } = await supabase
      .from("textos")
      .insert({
        user_id: user.id,
        titulo,
        conteudo,
        universe_id: universe_id || null,
        world_id: world_id || null,
        episodio: episodio || null,
        categoria: categoria || null,
        status,
        extraido: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar texto:", error);
      return NextResponse.json({ error: "Erro ao criar texto" }, { status: 500 });
    }

    return NextResponse.json({ texto }, { status: 201 });

  } catch (error: any) {
    console.error("Erro na API de textos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar texto existente
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, titulo, conteudo, universe_id, world_id, episodio, categoria, status, extraido } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (conteudo !== undefined) updateData.conteudo = conteudo;
    if (universe_id !== undefined) updateData.universe_id = universe_id;
    if (world_id !== undefined) updateData.world_id = world_id;
    if (episodio !== undefined) updateData.episodio = episodio;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (status !== undefined) updateData.status = status;
    if (extraido !== undefined) updateData.extraido = extraido;

    const { data: texto, error } = await supabase
      .from("textos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar texto:", error);
      return NextResponse.json({ error: "Erro ao atualizar texto" }, { status: 500 });
    }

    return NextResponse.json({ texto });

  } catch (error: any) {
    console.error("Erro na API de textos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar texto
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
      .from("textos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar texto:", error);
      return NextResponse.json({ error: "Erro ao deletar texto" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de textos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
