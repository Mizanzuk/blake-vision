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
    const query = searchParams.get("q");

    if (!query || query.length === 0) {
      return NextResponse.json([]);
    }

    // Buscar fichas (personagens, locais, eventos, objetos)
    const { data: fichas, error } = await supabase
      .from("fichas")
      .select("id, titulo, tipo, slug")
      .eq("user_id", user.id)
      .ilike("titulo", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Erro ao buscar entidades:", error);
      return NextResponse.json(
        { error: "Erro ao buscar entidades" },
        { status: 500 }
      );
    }

    // Mapear para o formato esperado pelo quill-mention
    const entities = (fichas || []).map((ficha) => ({
      id: ficha.id,
      value: ficha.titulo,
      type: ficha.tipo || 'character',
      link: `/fichas/${ficha.slug}`,
    }));

    return NextResponse.json(entities);
  } catch (error: any) {
    console.error("Erro na API de entities:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
