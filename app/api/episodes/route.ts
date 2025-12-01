import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const world_id = searchParams.get("world_id");

    let query = supabase
      .from("episodes")
      .select("*")
      .eq("user_id", user.id);

    if (world_id) {
      query = query.eq("world_id", world_id);
    }

    const { data: episodes, error } = await query.order("ordem", { ascending: true });

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { world_id, nome, descricao, ordem } = body;

    if (!world_id || !nome) {
      return NextResponse.json(
        { error: "world_id e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: episode, error } = await supabase
      .from("episodes")
      .insert({
        user_id: user.id,
        world_id,
        nome,
        descricao: descricao || null,
        ordem: ordem || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar episódio:", error);
      return NextResponse.json({ error: "Erro ao criar episódio" }, { status: 500 });
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

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, nome, descricao, ordem } = body;

    if (!id || !nome) {
      return NextResponse.json(
        { error: "id e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: episode, error } = await supabase
      .from("episodes")
      .update({
        nome,
        descricao: descricao || null,
        ordem: ordem || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar episódio:", error);
      return NextResponse.json({ error: "Erro ao atualizar episódio" }, { status: 500 });
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
      .from("episodes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar episódio:", error);
      return NextResponse.json({ error: "Erro ao deletar episódio" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de episodes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
