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
