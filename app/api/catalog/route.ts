import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// Categorias padrão caso não existam no banco
const DEFAULT_CATEGORIES = [
  { slug: "personagem", label: "Personagem" },
  { slug: "local", label: "Local" },
  { slug: "evento", label: "Evento" },
  { slug: "conceito", label: "Conceito" },
  { slug: "regra", label: "Regra" },
  { slug: "roteiro", label: "Roteiro" },
];

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

    // Fetch worlds
    const { data: worlds, error: worldsError } = await supabase
      .from("worlds")
      .select("*")
      .eq("universe_id", universeId)
      .order("ordem", { ascending: true });

    if (worldsError) {
      console.error("Erro ao buscar worlds:", worldsError);
      return NextResponse.json({ error: "Erro ao buscar mundos" }, { status: 500 });
    }

    // Fetch categories - com fallback para categorias padrão
    let categories: { slug: string; label: string; description?: string | null; prefix?: string | null }[] = [];
    
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("slug, label, description, prefix")
        .eq("universe_id", universeId)
        .order("label", { ascending: true });

      if (categoriesError) {
        console.warn("Erro ao buscar categorias (usando padrão):", categoriesError);
        categories = DEFAULT_CATEGORIES;
      } else if (categoriesData && categoriesData.length > 0) {
        categories = categoriesData;
      } else {
        // Se não há categorias para este universo, usar padrão
        console.log("Nenhuma categoria encontrada para o universo, usando padrão");
        categories = DEFAULT_CATEGORIES;
      }
    } catch (e) {
      console.warn("Tabela categories não encontrada ou erro de acesso, usando padrão");
      categories = DEFAULT_CATEGORIES;
    }

    // Fetch fichas
    const worldIds = worlds?.map(w => w.id) || [];
    
    let fichas: any[] = [];
    if (worldIds.length > 0) {
      const { data: fichasData, error: fichasError } = await supabase
        .from("fichas")
        .select("id, world_id, tipo, titulo, slug, codigo, resumo, ano_diegese, tags, episodio, imagem_url")
        .in("world_id", worldIds)
        .order("created_at", { ascending: false });

      if (fichasError) {
        console.error("Erro ao buscar fichas:", fichasError);
      } else {
        fichas = fichasData || [];
      }
    }

    return NextResponse.json({
      worlds: worlds || [],
      types: categories,
      fichas: fichas,
    });

  } catch (error: any) {
    console.error("Erro na API de catalog:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
