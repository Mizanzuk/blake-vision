import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// Função para gerar prefix único para categoria
async function generateCategoryPrefix(supabase: any, label: string, user: any): Promise<string> {
  // 1. Extrair iniciais do label (primeiras letras de cada palavra)
  const words = label.trim().split(/\s+/);
  let prefix = '';
  
  if (words.length === 1) {
    // Label de uma palavra: pegar primeiras 2-3 letras
    prefix = words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
  } else {
    // Label de múltiplas palavras: pegar primeira letra de cada palavra
    prefix = words.map(w => w[0]).join('').toUpperCase();
    // Limitar a 4 caracteres
    if (prefix.length > 4) {
      prefix = prefix.substring(0, 4);
    }
  }
  
  // 2. Buscar todos os prefixes existentes (base E personalizados)
  const { data: existingCategories } = await supabase
    .from('lore_categories')
    .select('prefix')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .not('prefix', 'is', null);
  
  const existingPrefixes = new Set((existingCategories || []).map((c: any) => c.prefix));
  
  // 3. Se prefix já existe, tentar variações inteligentes
  let finalPrefix = prefix;
  
  if (existingPrefixes.has(finalPrefix)) {
    // Tentar adicionar mais letras da primeira palavra
    if (words.length === 1 && words[0].length > prefix.length) {
      for (let len = prefix.length + 1; len <= Math.min(4, words[0].length); len++) {
        const candidate = words[0].substring(0, len).toUpperCase();
        if (!existingPrefixes.has(candidate)) {
          finalPrefix = candidate;
          break;
        }
      }
    }
    
    // Se ainda conflita, adicionar número
    if (existingPrefixes.has(finalPrefix)) {
      let counter = 2;
      while (existingPrefixes.has(`${prefix}${counter}`)) {
        counter++;
      }
      finalPrefix = `${prefix}${counter}`;
    }
  }
  
  return finalPrefix;
}

// Categorias padrão (mesmas do Catálogo)
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
    // Use admin client para buscar categorias (mesma lógica do Catálogo)
    const supabase = await createAdminClient();
    
    // Verificar autenticação via client regular
    const regularClient = await createClient();
    const { data: { user } } = await regularClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universeId = searchParams.get("universeId");

    if (!universeId) {
      return NextResponse.json(
        { error: "universeId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar categorias - com fallback para categorias padrão (mesma lógica do Catálogo)
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
        categories = categoriesData;
      } else {
        // Se não há categorias para este universo, usar padrão
        categories = DEFAULT_CATEGORIES;
      }
    } catch (e) {
      console.warn("Tabela lore_categories não encontrada ou erro de acesso, usando padrão");
      categories = DEFAULT_CATEGORIES;
    }

    return NextResponse.json({ categories });

  } catch (error: any) {
    console.error("Erro na API de categories:", error);
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
    const { universe_id, slug, label, description, prefix } = body;

    if (!universe_id || !slug || !label) {
      return NextResponse.json(
        { error: "universe_id, slug e label são obrigatórios" },
        { status: 400 }
      );
    }

    // Gerar prefix automaticamente se não fornecido
    const finalPrefix = prefix || await generateCategoryPrefix(supabase, label, user);
    console.log('[API /api/categories POST] Prefix gerado:', finalPrefix);

    const { data: category, error } = await supabase
      .from("lore_categories")
      .insert({
        universe_id,
        slug,
        label,
        description: description || null,
        prefix: finalPrefix,
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
