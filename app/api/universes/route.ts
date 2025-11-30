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

    const { data: universes, error } = await supabase
      .from("universes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar universos:", error);
      return NextResponse.json({ error: "Erro ao buscar universos" }, { status: 500 });
    }

    return NextResponse.json({ universes: universes || [] });

  } catch (error: any) {
    console.error("Erro na API de universes:", error);
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
    const { nome, descricao } = body;

    if (!nome || nome.trim() === "") {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const { data: universe, error } = await supabase
      .from("universes")
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar universo:", error);
      return NextResponse.json({ error: "Erro ao criar universo" }, { status: 500 });
    }

    // Create default root world
    const { error: worldError } = await supabase
      .from("worlds")
      .insert({
        universe_id: universe.id,
        user_id: user.id,
        nome: "Global",
        descricao: "Mundo raiz para regras e conceitos globais",
        is_root: true,
        ordem: 0,
      });

    if (worldError) {
      console.error("Erro ao criar mundo raiz:", worldError);
    }

    // Create default categories
    const defaultCategories = [
      { slug: "conceito", label: "Conceito", prefix: "CON" },
      { slug: "regra", label: "Regra", prefix: "REG" },
      { slug: "evento", label: "Evento", prefix: "EVT" },
      { slug: "personagem", label: "Personagem", prefix: "PER" },
      { slug: "local", label: "Local", prefix: "LOC" },
      { slug: "roteiro", label: "Roteiro", prefix: "ROT" },
    ];

    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      universe_id: universe.id,
      user_id: user.id,
    }));

    const { error: categoriesError } = await supabase
      .from("categories")
      .insert(categoriesToInsert);

    if (categoriesError) {
      console.error("Erro ao criar categorias padrão:", categoriesError);
    }

    return NextResponse.json({ universe });

  } catch (error: any) {
    console.error("Erro na API de universes:", error);
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
    const { id, nome, descricao } = body;

    if (!id || !nome || nome.trim() === "") {
      return NextResponse.json({ error: "ID e nome são obrigatórios" }, { status: 400 });
    }

    const { data: universe, error } = await supabase
      .from("universes")
      .update({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar universo:", error);
      return NextResponse.json({ error: "Erro ao atualizar universo" }, { status: 500 });
    }

    return NextResponse.json({ universe });

  } catch (error: any) {
    console.error("Erro na API de universes:", error);
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
      .from("universes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar universo:", error);
      return NextResponse.json({ error: "Erro ao deletar universo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de universes:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
