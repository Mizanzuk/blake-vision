import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { v4 as uuidv4 } from 'uuid';

export const dynamic = "force-dynamic";

// Função para gerar prefix único para mundo
async function generateWorldPrefix(supabase: any, nome: string, user: any): Promise<string> {
  // 1. Extrair iniciais do nome (primeiras letras de cada palavra)
  const words = nome.trim().split(/\s+/);
  let prefix = '';
  
  if (words.length === 1) {
    // Nome de uma palavra: pegar primeiras 2-3 letras
    prefix = words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
  } else {
    // Nome de múltiplas palavras: pegar primeira letra de cada palavra
    prefix = words.map(w => w[0]).join('').toUpperCase();
    // Limitar a 4 caracteres
    if (prefix.length > 4) {
      prefix = prefix.substring(0, 4);
    }
  }
  
  // 2. Verificar se prefix já existe
  const { data: existingWorlds } = await supabase
    .from('worlds')
    .select('prefix')
    .eq('user_id', user.id)
    .not('prefix', 'is', null);
  
  const existingPrefixes = new Set((existingWorlds || []).map((w: any) => w.prefix));
  
  // 3. Se prefix já existe, adicionar número
  let finalPrefix = prefix;
  let counter = 2;
  
  while (existingPrefixes.has(finalPrefix)) {
    finalPrefix = `${prefix}${counter}`;
    counter++;
  }
  
  return finalPrefix;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universe_id = searchParams.get("universeId") || searchParams.get("universe_id");

    let query = supabase
      .from("worlds")
      .select("*")
      .eq("user_id", user.id);

    if (universe_id) {
      query = query.eq("universe_id", universe_id);
    }

    const { data: worlds, error } = await query.order("ordem", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mundos:", error);
      return NextResponse.json({ error: "Erro ao buscar mundos" }, { status: 500 });
    }

    return NextResponse.json({ worlds: worlds || [] });

  } catch (error: any) {
    console.error("Erro na API de worlds:", error);
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
    console.log('[API /api/worlds POST] Body recebido:', JSON.stringify(body));
    
    // Remover id explicitamente se vier no body
    const { id, universe_id, nome, descricao, is_root, has_episodes, ordem } = body;
    
    // Gerar prefix automático
    const prefix = await generateWorldPrefix(supabase, nome, user);
    console.log('[API /api/worlds POST] Prefix gerado:', prefix);
    
    // Criar objeto limpo apenas com os campos necessários, removendo campos null
    const dataToInsert: any = {
      id: uuidv4(), // Gerar UUID manualmente para evitar erro de null
      user_id: user.id,
      universe_id,
      nome,
      prefix,
      is_root: is_root || false,
      has_episodes: has_episodes || false,
    };
    
    // Adicionar campos opcionais apenas se tiverem valor
    if (descricao) dataToInsert.descricao = descricao;
    if (ordem !== undefined && ordem !== null) dataToInsert.ordem = ordem;
    
    console.log('[API /api/worlds POST] Dados para insert:', JSON.stringify(dataToInsert));

    if (!universe_id || !nome) {
      return NextResponse.json(
        { error: "universe_id e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: world, error } = await supabase
      .from("worlds")
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('[API /api/worlds POST] Erro ao criar mundo:', JSON.stringify(error));
      console.error('[API /api/worlds POST] Detalhes do erro:', error.message, error.code, error.details);
      return NextResponse.json({ error: error.message || "Erro ao criar mundo", details: error }, { status: 500 });
    }

    // Criar categoria base "episódios" automaticamente
    try {
      await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          universe_id,
          world_id: world.id,
          slug: "episodio",
          label: "Episódio",
          descricao: "Episódios planejados para este mundo",
          ordem: 0,
        });
    } catch (catError) {
      console.error("Erro ao criar categoria episódios:", catError);
      // Não falhar a criação do mundo se a categoria falhar
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

    // Verificar se é mundo raiz
    const { data: world } = await supabase
      .from("worlds")
      .select("is_root")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (world?.is_root) {
      return NextResponse.json(
        { error: "Não é possível deletar o Mundo Raiz. Delete o universo inteiro se necessário." },
        { status: 400 }
      );
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
