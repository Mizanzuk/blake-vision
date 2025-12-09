import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { searchLore, LoreSearchResult } from "@/app/lib/rag";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

type Message = { role: "user" | "assistant" | "system"; content: string };

const PERSONAS = {
  consulta: {
    nome: "Urizen",
    titulo: "A Lei (Consulta)",
    descricao: "Guardião da Lei e da Lógica, responsável por consultar fatos estabelecidos.",
    modo: "CONSULTA ESTRITA",
  },
  criativo: {
    nome: "Urthona",
    titulo: "O Fluxo (Criativo)",
    descricao: "Forjador da Visão e da Imaginação, livre para expandir o universo.",
    modo: "CRIATIVO COM PROTOCOLO DE COERÊNCIA",
  }
};

function isValidUUID(uuid: any): boolean {
  if (typeof uuid !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

async function fetchGlobalRules(supabase: any, universeId?: string): Promise<string> {
  if (!universeId || !isValidUUID(universeId)) {
    return "";
  }

  try {
    const { data: rootWorld, error: worldError } = await supabase
      .from("worlds")
      .select("id")
      .eq("universe_id", universeId)
      .eq("is_root", true)
      .maybeSingle();

    if (worldError || !rootWorld) return "";

    const { data: rules } = await supabase
      .from("fichas")
      .select("titulo, conteudo, tipo")
      .eq("world_id", rootWorld.id)
      .in("tipo", ["regra_de_mundo", "epistemologia", "conceito"]);

    if (!rules || rules.length === 0) return "";

    const rulesText = rules
      .map((f: any) => `- [${f.tipo.toUpperCase()}] ${f.titulo}: ${f.conteudo}`)
      .join("\n");

    return `
### LEIS IMUTÁVEIS DO UNIVERSO ATUAL
Estas regras se aplicam a TODOS os mundos e histórias deste universo, sem exceção:
${rulesText}
`;
  } catch (err) {
    console.error("Erro ao buscar regras globais:", err);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Initialize OpenAI client inside the function to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: 'https://api.openai.com/v1',
    });
    
    if (!openai.apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Acesso negado (401)." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const messages = (body?.messages ?? []) as Message[];
    const universeId = body?.universeId as string | undefined;
    const textContent = body?.textContent as string | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Nenhuma mensagem fornecida." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Última mensagem deve ser do usuário." }, { status: 400 });
    }

    const mode = (body?.mode ?? "consulta") as "consulta" | "criativo";
    const persona = PERSONAS[mode];

    // Fetch global rules
    const globalRules = await fetchGlobalRules(supabase, universeId);

    // Add current text content as context if provided
    let textContextSection = "";
    if (textContent && textContent.trim()) {
      textContextSection = `
### TEXTO ATUAL EM EDIÇÃO
O usuário está trabalhando no seguinte texto:

${textContent}

---
`;
    }

    // RAG: Search for relevant lore
    let contextText = "";
    let exampleFichaId = "ID_DA_FICHA_AQUI";
    let fichasMap = new Map<string, string>(); // Map título -> ID
    
    // Build conversation context from all user messages for better RAG results
    const conversationContext = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');
    
    const ragQuery = conversationContext || lastMessage.content;
    console.log('[RAG] Starting search...', { universeId, query: ragQuery, lastMessageOnly: lastMessage.content });
    if (universeId && isValidUUID(universeId)) {
      console.log('[RAG] Valid UUID, calling searchLore...');
      // CAMADA 1: Busca vetorial com threshold baixo e muitos resultados
      const results = await searchLore(ragQuery, universeId, 0.2, 30);
      console.log('[RAG] Layer 1 - Vector search:', { count: results.length });
      
      // Buscar worlds do universo
      const { data: worlds } = await supabase
        .from('worlds')
        .select('id')
        .eq('universe_id', universeId);
      
      const allResults: LoreSearchResult[] = [...results];
      const processedIds = new Set(results.map(r => r.id));
      
      if (worlds && worlds.length > 0) {
        const worldIds = worlds.map(w => w.id);
        
        // CAMADA 2: Busca por título (contexto completo)
        const words = conversationContext.toLowerCase().split(/\s+/);
        console.log('[RAG] Layer 2 - Title search for:', words.slice(0, 15));
        
        for (const word of words) {
          if (word.length >= 3) {
            const { data: titleMatches } = await supabase
              .from('fichas')
              .select('id, titulo, tipo, resumo, conteudo')
              .in('world_id', worldIds)
              .ilike('titulo', `%${word}%`)
              .limit(10);
            
            if (titleMatches) {
              titleMatches.forEach(match => {
                if (!processedIds.has(match.id)) {
                  allResults.push({ ...match, similarity: 0.9 });
                  processedIds.add(match.id);
                }
              });
            }
          }
        }
        
        // CAMADA 3: Busca por relacionamentos (entidades mencionadas)
        console.log('[RAG] Layer 3 - Relationship search');
        const mentionedEntities = new Set<string>();
        
        // Extrair entidades mencionadas nas fichas já encontradas
        allResults.forEach(ficha => {
          const content = `${ficha.titulo} ${ficha.resumo || ''} ${ficha.conteudo || ''}`;
          const contentWords = content.toLowerCase().split(/\s+/);
          
          // Adicionar palavras significativas (3+ caracteres)
          contentWords.forEach(w => {
            if (w.length >= 3 && !['para', 'com', 'uma', 'dos', 'das', 'que', 'foi', 'ser'].includes(w)) {
              mentionedEntities.add(w);
            }
          });
        });
        
        console.log('[RAG] Found entities:', Array.from(mentionedEntities).slice(0, 20));
        
        // Buscar fichas relacionadas às entidades mencionadas
        for (const entity of Array.from(mentionedEntities).slice(0, 30)) {
          const { data: relatedMatches } = await supabase
            .from('fichas')
            .select('id, titulo, tipo, resumo, conteudo')
            .in('world_id', worldIds)
            .or(`titulo.ilike.%${entity}%,conteudo.ilike.%${entity}%`)
            .limit(3);
          
          if (relatedMatches) {
            relatedMatches.forEach(match => {
              if (!processedIds.has(match.id)) {
                allResults.push({ ...match, similarity: 0.7 });
                processedIds.add(match.id);
              }
            });
          }
        }
      }
      
      // Ordenar por similaridade (maior primeiro)
      const combinedResults = allResults.sort((a, b) => b.similarity - a.similarity);
      console.log('[RAG] Final results:', { 
        vector: results.length, 
        total: combinedResults.length,
        unique: processedIds.size 
      });
      
      if (combinedResults.length > 0) {
        console.log('[RAG] Adding context to prompt');
        exampleFichaId = combinedResults[0].id;
        
        // Criar mapa de títulos para IDs (manter capitalização original)
        combinedResults.forEach(r => {
          fichasMap.set(r.titulo, r.id);
        });
        
        contextText = `
### CONTEXTO RELEVANTE DO UNIVERSO
As seguintes fichas foram encontradas e são relevantes para a conversa.
Você deve analisar TODAS as fichas e conectar informações relacionadas entre elas.

${combinedResults.map((r, i) => `
${i + 1}. **${r.titulo}** (${r.tipo}) [ID: ${r.id}] [Similaridade: ${r.similarity.toFixed(2)}]
   Resumo: ${r.resumo || "N/A"}
   Conteúdo Completo: ${r.conteudo || "N/A"}
`).join("\n")}
`;
      } else {
        console.log('[RAG] No results found');
      }
    } else {
      console.log('[RAG] Invalid or missing universeId:', { universeId, isValid: isValidUUID(universeId || '') });
    }

    // Build system prompt
    const systemPrompt = `Você é ${persona.nome}, ${persona.descricao}

MODO: ${persona.modo}

${globalRules}

${textContextSection}

${contextText}

${mode === "consulta" ? `
INSTRUÇÕES PARA MODO CONSULTA:

**PRINCÍPIOS DE ANÁLISE:**
- Você recebeu um contexto MASSIVO com dezenas de fichas relacionadas
- Sua missão é CONECTAR informações entre diferentes fichas
- INFIRA relações mesmo quando não explícitas: se duas fichas mencionam o mesmo evento/pessoa/data, elas estão relacionadas
- PRIORIZE COMPLETUDE sobre brevidade: mencione TODAS as fichas relevantes

**REGRAS DE RESPOSTA:**
- Responda com base nos fatos estabelecidos no contexto fornecido
- Se múltiplas fichas mencionam o mesmo evento/pessoa, COMBINE as informações de todas elas
- Exemplo: se ficha de "Ana" menciona "suspensão em 2012" e existe ficha "Suspensão Coletiva em 23/08/2012", conecte-as automaticamente
- Se não houver informação suficiente APÓS analisar TODAS as fichas, diga "Não há informação estabelecida sobre isso"
- Seja preciso, factual e COMPLETO
- Identifique inconsistências se houver

**FORMATO DE LINKS:**
- OBRIGATÓRIO: Ao mencionar fichas, SEMPRE use [Nome da Ficha](/ficha/SLUG_DA_FICHA)
- O slug deve ser o titulo da ficha em minúsculas, com espaços substituídos por hífens
- Exemplo: Se a ficha se chama "Joaquim", use [Joaquim](/ficha/joaquim)
- Exemplo: Se a ficha se chama "Incidente do Sapo", use [Incidente do Sapo](/ficha/incidente-do-sapo)
- NUNCA use links vazios como [Texto]() ou links normais como [Texto](https://...)
- Mencione TODAS as fichas relevantes encontradas, não apenas a primeira
` : `
INSTRUÇÕES PARA MODO CRIATIVO:
- Você pode criar e expandir narrativas
- SEMPRE respeite as Leis Imutáveis do Universo
- Mantenha coerência com o contexto estabelecido
- Seja criativo mas consistente
- Sugira novas possibilidades que enriqueçam o universo
- OBRIGATÓRIO: Ao mencionar fichas existentes, SEMPRE use o formato [Nome da Ficha](/ficha/slug-da-ficha)
- O slug deve ser o titulo da ficha em minúsculas, com espaços substituídos por hífens
- Exemplo correto: [Joaquim](/ficha/joaquim)
- Exemplo correto: [Incidente do Sapo](/ficha/incidente-do-sapo)
- NUNCA use links vazios como [Texto]() ou links normais como [Texto](https://...)

**CAPACIDADE ESPECIAL DE EDIÇÃO DIRETA:**
Quando o usuário pedir para modificar o texto em edição (ex: "apague o primeiro parágrafo", "troque João por Miguel", "adicione uma descrição do cenário"), você deve:
1. Aplicar a modificação solicitada no texto
2. Retornar o texto COMPLETO modificado dentro de um bloco especial:

\`\`\`EDIT_CONTENT
[TEXTO COMPLETO MODIFICADO AQUI]
\`\`\`

Exemplo de resposta:
"Claro! Vou trocar João por Miguel no texto.

\`\`\`EDIT_CONTENT
[Texto completo com a modificação aplicada]
\`\`\`

Modifiquei todas as ocorrências de João para Miguel."

IMPORTANTE:
- Use EDIT_CONTENT apenas quando o usuário pedir explicitamente para modificar o texto
- Sempre inclua o texto COMPLETO, não apenas a parte modificada
- Explique brevemente o que foi modificado antes ou depois do bloco
`}

Responda de forma clara, organizada e em português brasileiro.`;

    // Prepare messages for OpenAI
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }))
    ];

    // Call OpenAI (sem streaming para permitir pós-processamento)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      temperature: mode === "consulta" ? 0.3 : 0.7,
      max_tokens: 2000,
      stream: false,
    });

    let responseContent = completion.choices[0]?.message?.content || "";
    
    // Pós-processamento: converter links de fichas
    console.log('[RAG] Post-processing check:', { 
      fichasMapSize: fichasMap.size, 
      hasResponseContent: !!responseContent,
      responseLength: responseContent?.length 
    });
    
    if (fichasMap.size > 0 && responseContent) {
      console.log('[RAG] Starting post-processing...');
      console.log('[RAG] Fichas map:', Array.from(fichasMap.entries()));
      console.log('[RAG] Response preview:', responseContent.substring(0, 200));
      
      fichasMap.forEach((id, titulo) => {
        // Escapar caracteres especiais no título para regex
        const escapedTitulo = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Padrão: [Título]() ou [Título](qualquer-link) -> [Título](ficha:ID)
        // Usando replace global que captura todos os casos
        const pattern = new RegExp(`\\[${escapedTitulo}\\]\\([^)]*\\)`, 'gi');
        const newContent = responseContent.replace(pattern, `[${titulo}](ficha:${id})`);
        
        if (newContent !== responseContent) {
          console.log(`[RAG] ✅ Fixed link for: ${titulo}`);
          responseContent = newContent;
        } else {
          console.log(`[RAG] ❌ No match found for: ${titulo}`);
        }
      });
      
      console.log('[RAG] Post-processing complete');
      console.log('[RAG] Final response preview:', responseContent.substring(0, 200));
    } else {
      console.log('[RAG] Skipping post-processing');
    }
    
    // Create a ReadableStream to send the processed response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responseContent));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Erro na API de chat:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
