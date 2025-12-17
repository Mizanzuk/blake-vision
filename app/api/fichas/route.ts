import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { generateEmbedding } from "@/app/lib/rag";

export const dynamic = "force-dynamic";

// Função para gerar próximo código único
async function getNextCode(supabase: any, userId: string, tipo: string, prefix: string): Promise<string> {
  // Buscar último código com esse prefixo para este usuário e tipo
  const { data, error } = await supabase
    .from("fichas")
    .select("codigo")
    .eq("user_id", userId)
    .eq("tipo", tipo)
    .like("codigo", `${prefix}-%`)
    .order("codigo", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro ao buscar último código:", error);
    return `${prefix}-001`;
  }

  // Se não há códigos anteriores, começar com 001
  if (!data || data.length === 0) {
    return `${prefix}-001`;
  }

  // Extrair número do último código e incrementar
  const lastCode = data[0].codigo;
  const match = lastCode?.match(/-([0-9]+)$/);
  
  if (!match) {
    return `${prefix}-001`;
  }

  const lastNumber = parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;
  
  // Formatar com padding de zeros (3 dígitos)
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const tipo = searchParams.get("tipo");

    // Se tem tipo, busca por tipo; senão, busca por search
    let query = supabase
      .from("fichas")
      .select("id, titulo, tipo, slug, world_id, numero")
      .eq("user_id", user.id);

    if (tipo) {
      query = query.eq("tipo", tipo);
    } else if (search) {
      query = query.ilike("titulo", `%${search}%`).limit(10);
    } else {
      return NextResponse.json(
        { error: "Parâmetro search ou tipo é obrigatório" },
        { status: 400 }
      );
    }

    const { data: fichas, error } = await query;

    if (error) {
      console.error("Erro ao buscar fichas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar fichas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ fichas: fichas || [] });
  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
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
    const {
      world_id,
      tipo,
      titulo,
      slug,
      codigo,
      resumo,
      descricao,
      conteudo,
      ano_diegese,
      tags,
      episodio,
      album_imagens,
      descricao_data,
      data_inicio,
      data_fim,
      granularidade_data,
      camada_temporal,
    } = body;

    // world_id pode ser null para Conceitos e Regras (aplicados ao universo inteiro)
    const allowNullWorld = tipo === 'conceito' || tipo === 'regra';
    
    // Validações especiais para Sinopse
    if (tipo === 'sinopse') {
      if (!world_id) {
        return NextResponse.json(
          { error: "Sinopse deve ter um mundo obrigatório" },
          { status: 400 }
        );
      }
      if (!episodio) {
        return NextResponse.json(
          { error: "Sinopse deve ter um episódio obrigatório" },
          { status: 400 }
        );
      }
      
      // Verificar se já existe sinopse para este episódio
      const { data: existingSinopse } = await supabase
        .from("fichas")
        .select("id")
        .eq("user_id", user.id)
        .eq("world_id", world_id)
        .eq("tipo", "sinopse")
        .eq("episodio", episodio)
        .single();
      
      if (existingSinopse) {
        return NextResponse.json(
          { error: "Já existe uma sinopse para este episódio" },
          { status: 400 }
        );
      }
    }
    
    if (!tipo || !titulo) {
      return NextResponse.json(
        { error: "tipo e titulo são obrigatórios" },
        { status: 400 }
      );
    }
    
    if (!world_id && !allowNullWorld) {
      return NextResponse.json(
        { error: "world_id é obrigatório para este tipo de ficha" },
        { status: 400 }
      );
    }

    // Generate codigo automatically if not provided
    let finalCodigo = codigo;
    if (!finalCodigo) {
      console.log("[DEBUG] Gerando código automático para tipo:", tipo);
      
      // Buscar categoria para obter o prefix
      const { data: category, error: categoryError } = await supabase
        .from("lore_categories")
        .select("prefix")
        .eq("slug", tipo)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .single();
      
      console.log("[DEBUG] Categoria encontrada:", category);
      console.log("[DEBUG] Erro ao buscar categoria:", categoryError);
      
      if (category?.prefix) {
        console.log("[DEBUG] Prefix da categoria:", category.prefix);
        finalCodigo = await getNextCode(supabase, user.id, tipo, category.prefix);
        console.log("[DEBUG] Código gerado:", finalCodigo);
      } else {
        console.log("[DEBUG] Categoria não tem prefix ou não foi encontrada");
      }
    } else {
      console.log("[DEBUG] Código já fornecido:", codigo);
    }

    // Generate embedding
    const textForEmbedding = `${titulo} ${resumo || ""} ${descricao || ""} ${conteudo || ""}`.trim();
    let embedding: number[] | null = null;
    
    if (textForEmbedding) {
      try {
        embedding = await generateEmbedding(textForEmbedding);
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    }

    const { data: ficha, error } = await supabase
      .from("fichas")
      .insert({
        user_id: user.id,
        world_id,
        tipo,
        titulo,
        slug: slug || null,
        codigo: finalCodigo || null,
        resumo: resumo || null,
        conteudo: conteudo || null,
        ano_diegese: ano_diegese || null,
        tags: tags || null,
        episodio: episodio || null,
        album_imagens: album_imagens || null,
        descricao_data: descricao_data || null,
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        granularidade_data: granularidade_data || null,
        camada_temporal: camada_temporal || null,
        embedding: embedding || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar ficha:", error);
      return NextResponse.json({ error: "Erro ao criar ficha" }, { status: 500 });
    }

    return NextResponse.json({ ficha });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }
    
    // Validações especiais para Sinopse (ao atualizar)
    if (updateData.tipo === 'sinopse') {
      if (updateData.world_id === null || updateData.world_id === '') {
        return NextResponse.json(
          { error: "Sinopse deve ter um mundo obrigatório" },
          { status: 400 }
        );
      }
      if (updateData.episodio === null || updateData.episodio === '') {
        return NextResponse.json(
          { error: "Sinopse deve ter um episódio obrigatório" },
          { status: 400 }
        );
      }
      
      // Se está mudando o episódio, verificar se já existe sinopse para o novo episódio
      if (updateData.episodio && updateData.world_id) {
        const { data: existingSinopse } = await supabase
          .from("fichas")
          .select("id")
          .eq("user_id", user.id)
          .eq("world_id", updateData.world_id)
          .eq("tipo", "sinopse")
          .eq("episodio", updateData.episodio)
          .neq("id", id)
          .maybeSingle();
        
        if (existingSinopse) {
          return NextResponse.json(
            { error: "Já existe uma sinopse para este episódio" },
            { status: 400 }
          );
        }
      }
    }

    // Generate new embedding if content changed
    const textForEmbedding = `${updateData.titulo || ""} ${updateData.resumo || ""} ${updateData.descricao || ""} ${updateData.conteudo || ""}`.trim();
    
    if (textForEmbedding) {
      try {
        updateData.embedding = await generateEmbedding(textForEmbedding);
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: ficha, error } = await supabase
      .from("fichas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar ficha:", error);
      return NextResponse.json({ error: "Erro ao atualizar ficha" }, { status: 500 });
    }

    return NextResponse.json({ ficha });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
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
      .from("fichas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar ficha:", error);
      return NextResponse.json({ error: "Erro ao deletar ficha" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API de fichas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
