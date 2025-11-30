import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { universe_id, nome, descricao, is_root, has_episodes, ordem } = body;

    if (!universe_id || !nome) {
      return NextResponse.json(
        { error: "universe_id e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: world, error } = await supabase
      .from("worlds")
      .insert({
        user_id: user.id,
        universe_id,
        nome,
        descricao: descricao || null,
        is_root: is_root || false,
        has_episodes: has_episodes || false,
        ordem: ordem || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar mundo:", error);
      return NextResponse.json({ error: "Erro ao criar mundo" }, { status: 500 });
    }

    return NextResponse.json({ world });

  } catch (error: any) {
    console.error("Erro na API de worlds:", error);
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
    const { id, nome, descricao, is_root, has_episodes, ordem } = body;

    if (!id || !nome) {
      return NextResponse.json(
        { error: "id e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: world, error } = await supabase
      .from("worlds")
      .update({
        nome,
        descricao: descricao || null,
        is_root: is_root || false,
        has_episodes: has_episodes || false,
        ordem: ordem || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar mundo:", error);
      return NextResponse.json({ error: "Erro ao atualizar mundo" }, { status: 500 });
    }

    return NextResponse.json({ world });

  } catch (error: any) {
    console.error("Erro na API de worlds:", error);
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
      .from("worlds")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar mundo:", error);
      return NextResponse.json({ error: "Erro ao deletar mundo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de worlds:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
