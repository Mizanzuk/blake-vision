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
    const { universe_id, slug, label, description, prefix } = body;

    if (!universe_id || !slug || !label) {
      return NextResponse.json(
        { error: "universe_id, slug e label são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from("lore_categories")
      .insert({
        universe_id,
        slug,
        label,
        description: description || null,
        prefix: prefix || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar categoria:", error);
      return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
    }

    return NextResponse.json({ category });

  } catch (error: any) {
    console.error("Erro na API de categories:", error);
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
    const { universe_id, slug, label, description, prefix } = body;

    if (!universe_id || !slug || !label) {
      return NextResponse.json(
        { error: "universe_id, slug e label são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from("lore_categories")
      .update({
        label,
        description: description || null,
        prefix: prefix || null,
      })
      .eq("universe_id", universe_id)
      .eq("slug", slug)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar categoria:", error);
      return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
    }

    return NextResponse.json({ category });

  } catch (error: any) {
    console.error("Erro na API de categories:", error);
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
    const universe_id = searchParams.get("universe_id");
    const slug = searchParams.get("slug");

    if (!universe_id || !slug) {
      return NextResponse.json(
        { error: "universe_id e slug são obrigatórios" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("lore_categories")
      .delete()
      .eq("universe_id", universe_id)
      .eq("slug", slug)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar categoria:", error);
      return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de categories:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
