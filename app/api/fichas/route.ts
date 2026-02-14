import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { generateEmbedding } from "@/app/lib/rag";

export const dynamic = "force-dynamic";

// Função para gerar próximo código único
// Formato: [MUNDO][EPISÓDIO]-[CATEGORIA][NÚMERO]
// Exemplo: AV7-PS4 = Arquivos Vermelhos, Episódio 7, Personagem 4
async function getNextCode(
  supabase: any,
  userId: string,
  worldId: string,
  episodeNumber: number | null,
  tipo: string,
  categoryPrefix: string
): Promise<string> {
  // 1. Buscar prefix do mundo
  const { data: world } = await supabase
    .from('worlds')
    .select('prefix')
    .eq('id', worldId)
    .single();
  
  const worldPrefix = world?.prefix || 'XX';
  
  // 2. Montar prefix completo: [MUNDO][EPISÓDIO]-[CATEGORIA]
  const episodePart = episodeNumber ? String(episodeNumber) : '';
  const fullPrefix = `${worldPrefix}${episodePart}-${categoryPrefix}`;
  
  console.log('[DEBUG] Prefix completo:', fullPrefix);
  
  // 3. Buscar último código com esse prefix completo
  const { data, error } = await supabase
    .from('fichas')
    .select('codigo')
    .eq('user_id', userId)
    .eq('world_id', worldId)
    .eq('tipo', tipo)
    .like('codigo', `${fullPrefix}%`)
    .order('codigo', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro ao buscar último código:', error);
    return `${fullPrefix}1`;
  }

  // 4. Se não há códigos anteriores, começar com 1
  if (!data || data.length === 0) {
    return `${fullPrefix}1`;
  }

  // 5. Extrair número do último código e incrementar
  const lastCode = data[0].codigo;
  const match = lastCode?.match(/-([A-Z]+)([0-9]+)$/);
  
  if (!match) {
    return `${fullPrefix}1`;
  }

  const lastNumber = parseInt(match[2], 10);
  const nextNumber = lastNumber + 1;
  
  // 6. Retornar código no formato: [MUNDO][EPISÓDIO]-[CATEGORIA][NÚMERO]
  return `${fullPrefix}${nextNumber}`;
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
      episode_id, // Changed from episodio (string) to episode_id (UUID)
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
      if (!episode_id) {
        return NextResponse.json(
          { error: "Sinopse deve ter um episódio obrigatório" },
          { status: 400 }
        );
      }
      
      // Nota: Sinopses podem ser criadas múltiplas vezes para o mesmo episódio
      // (a última versão será exibida no catálogo)
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
      
      if (category?.prefix && world_id) {
        console.log("[DEBUG] Prefix da categoria:", category.prefix);
        console.log("[DEBUG] World ID:", world_id);
        console.log("[DEBUG] Episódio:", episodio);
        
        // Extract episode number from episode_id if available
        let episodeNumber: number | null = null;
        if (episode_id) {
          const { data: episode } = await supabase
            .from('episodes')
            .select('numero')
            .eq('id', episode_id)
            .single();
          episodeNumber = episode?.numero || null;
        }
        
        finalCodigo = await getNextCode(
          supabase,
          user.id,
          world_id,
          episodeNumber,
          tipo,
          category.prefix
        );
        
        console.log("[DEBUG] Código gerado:", finalCodigo);
      } else {
        console.log("[DEBUG] Categoria não tem prefix ou world_id não fornecido");
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
        episode_id: episode_id || null, // Changed from episodio
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
    
    console.log("[DEBUG PUT] ID:", id);
    console.log("[DEBUG PUT] updateData:", JSON.stringify(updateData, null, 2));

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
      if (updateData.episode_id === null || updateData.episode_id === '') {
        return NextResponse.json(
          { error: "Sinopse deve ter um episódio obrigatório" },
          { status: 400 }
        );
      }
      
      // Se está mudando o episódio, verificar se já existe sinopse para o novo episódio
      if (updateData.episode_id && updateData.world_id) {
        const { data: existingSinopse } = await supabase
          .from("fichas")
          .select("id")
          .eq("user_id", user.id)
          .eq("world_id", updateData.world_id)
          .eq("tipo", "sinopse")
          .eq("episode_id", updateData.episode_id)
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

    // Regenerar código se episódio ou world_id mudaram OU se código está no formato antigo
    if (updateData.episode_id !== undefined || updateData.world_id !== undefined || updateData.codigo) {
      // Buscar ficha atual para comparar
      const { data: currentFicha } = await supabase
        .from("fichas")
        .select("episode_id, world_id, tipo, codigo")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      
      if (currentFicha) {
        const episodioChanged = updateData.episode_id !== undefined && updateData.episode_id !== currentFicha.episode_id;
        const worldChanged = updateData.world_id !== undefined && updateData.world_id !== currentFicha.world_id;
        
        // Verificar se código está no formato antigo (sem número de episódio)
        // Formato antigo: AV-PS1 (sem número entre mundo e categoria)
        // Formato novo: AV8-PS001 (com número de episódio)
        const currentCodigo = updateData.codigo || currentFicha.codigo;
        
        // Extract episode number from episode_id if available
        let finalEpisodeNumber: number | null = null;
        const finalEpisodeId = updateData.episode_id !== undefined ? updateData.episode_id : currentFicha.episode_id;
        if (finalEpisodeId) {
          const { data: episode } = await supabase
            .from('episodes')
            .select('numero')
            .eq('id', finalEpisodeId)
            .single();
          finalEpisodeNumber = episode?.numero || null;
        }
        const finalEpisodio = finalEpisodeNumber;
        const needsRegeneration = episodioChanged || worldChanged || 
          (currentCodigo && finalEpisodio && !currentCodigo.match(/^[A-Z]+\d+-[A-Z]+\d+$/));
        
        if (needsRegeneration) {
          // Buscar categoria para obter prefix
          const tipo = updateData.tipo || currentFicha.tipo;
          const { data: category } = await supabase
            .from("lore_categories")
            .select("prefix")
            .eq("slug", tipo)
            .or(`user_id.is.null,user_id.eq.${user.id}`)
            .single();
          
          if (category?.prefix) {
            const finalWorldId = updateData.world_id !== undefined ? updateData.world_id : currentFicha.world_id;
            
            console.log("[DEBUG PUT] Regenerando código - episodioChanged:", episodioChanged, "worldChanged:", worldChanged, "currentCodigo:", currentCodigo);
            
            updateData.codigo = await getNextCode(
              supabase,
              user.id,
              finalWorldId,
              finalEpisodio || null,
              tipo,
              category.prefix
            );
            
            console.log("[DEBUG PUT] Novo código gerado:", updateData.codigo);
          }
        }
      }
    }

    updateData.updated_at = new Date().toISOString();
    
    console.log("[DEBUG PUT] Final updateData:", JSON.stringify(updateData, null, 2));

    const { data: ficha, error } = await supabase
      .from("fichas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[DEBUG PUT] Erro ao atualizar ficha:", error);
      return NextResponse.json({ error: "Erro ao atualizar ficha" }, { status: 500 });
    }
    
    console.log("[DEBUG PUT] Ficha atualizada com sucesso:", JSON.stringify(ficha, null, 2));

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
