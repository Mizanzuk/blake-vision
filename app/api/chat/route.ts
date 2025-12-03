import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { searchLore } from "@/app/lib/rag";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1',
});

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
    if (!openai) {
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
    if (universeId && isValidUUID(universeId)) {
      const results = await searchLore(lastMessage.content, universeId, 0.5, 8);
      
      if (results.length > 0) {
        contextText = `
### CONTEXTO RELEVANTE DO UNIVERSO
As seguintes fichas foram encontradas e são relevantes para a conversa:

${results.map((r, i) => `
${i + 1}. **${r.titulo}** (${r.tipo})
   ${r.resumo || ""}
   ${r.conteudo ? `\n   Conteúdo: ${r.conteudo.slice(0, 300)}...` : ""}
`).join("\n")}
`;
      }
    }

    // Build system prompt
    const systemPrompt = `Você é ${persona.nome}, ${persona.descricao}

MODO: ${persona.modo}

${globalRules}

${textContextSection}

${contextText}

${mode === "consulta" ? `
INSTRUÇÕES PARA MODO CONSULTA:
- Responda APENAS com base nos fatos estabelecidos no contexto fornecido
- Se não houver informação suficiente, diga claramente "Não há informação estabelecida sobre isso"
- Cite as fichas relevantes quando possível
- Seja preciso e factual
- Identifique inconsistências se houver
` : `
INSTRUÇÕES PARA MODO CRIATIVO:
- Você pode criar e expandir narrativas
- SEMPRE respeite as Leis Imutáveis do Universo
- Mantenha coerência com o contexto estabelecido
- Seja criativo mas consistente
- Sugira novas possibilidades que enriqueçam o universo
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

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      temperature: mode === "consulta" ? 0.3 : 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // Create a ReadableStream to send chunks to the client
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
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
