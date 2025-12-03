import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";

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
    // Use admin client to bypass RLS and authentication issues
    const supabase = await createAdminClient();
    
    // Still check for user authentication via regular client for security
    const regularClient = await createClient();
    const { data: { user } } = await regularClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universeId = searchParams.get("universeId");
    const worldId = searchParams.get("worldId");
    const tipoParam = searchParams.get("tipo");

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
        .from("lore_categories")
        .select("slug, label, description, prefix")
        .eq("universe_id", universeId)
        .order("label", { ascending: true });

      if (categoriesError) {
        console.warn("Erro ao buscar categorias (usando padrão):", categoriesError);
        categories = DEFAULT_CATEGORIES;
      } else if (categoriesData && categoriesData.length > 0) {
        console.log("[DEBUG] Categorias do banco:", JSON.stringify(categoriesData, null, 2));
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

    // Fetch fichas with filters
    console.log('[DEBUG] Buscando fichas...');
    console.log('[DEBUG] universeId:', universeId);
    console.log('[DEBUG] worldId:', worldId);
    console.log('[DEBUG] tipoParam:', tipoParam);
    console.log('[DEBUG] worlds encontrados:', worlds?.length);
    
    let worldIds: string[] = [];
    
    if (worldId) {
      // Filter by specific world
      worldIds = [worldId];
    } else {
      // All worlds from universe
      worldIds = worlds?.map(w => w.id) || [];
    }
    
    let fichas: any[] = [];
    if (worldIds.length > 0) {
      let query = supabase
        .from("fichas")
        .select("id, world_id, tipo, titulo, slug, codigo, resumo, conteudo, ano_diegese, tags, episodio, imagem_url, aparece_em")
        .in("world_id", worldIds);

      // Filter by tipo if provided
      if (tipoParam) {
        const tipos = tipoParam.split(",").map(t => t.trim());
        query = query.in("tipo", tipos);
      }

      query = query.order("created_at", { ascending: false });

      console.log('[DEBUG] Executando query com worldIds:', worldIds);
      console.log('[DEBUG] Filtro de tipos:', tipoParam);
      
      const { data: fichasData, error: fichasError } = await query;

      if (fichasError) {
        console.error("Erro ao buscar fichas:", fichasError);
      } else {
        fichas = fichasData || [];
        console.log('[DEBUG] Fichas encontradas:', fichas.length);
      }
    }

    // Add "Episódio" as a special category
    const categoriesWithEpisode = [
      { slug: "episodio", label: "Episódio", prefix: "EP" },
      ...categories,
    ];

    return NextResponse.json({
      worlds: worlds || [],
      types: categoriesWithEpisode,
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
