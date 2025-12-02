import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universeId = searchParams.get("universeId");

    if (!universeId) {
      return NextResponse.json({ error: "universeId é obrigatório" }, { status: 400 });
    }

    // Buscar categorias com TODOS os campos
    const { data: categories, error } = await supabase
      .from("lore_categories")
      .select("*")
      .eq("universe_id", universeId)
      .order("label", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: categories?.length || 0,
      categories: categories || [],
      // Mostrar estrutura da primeira categoria
      sample: categories && categories.length > 0 ? {
        keys: Object.keys(categories[0]),
        values: categories[0]
      } : null
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
