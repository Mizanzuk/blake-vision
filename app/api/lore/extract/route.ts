import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client inside the function to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });
    const body = await request.json();
    
    // Aceitar AMBOS os formatos:
    // 1. Extração de arquivo: { file_path, universe_id, world_id }
    // 2. Extração de texto: { text, worldId, universeId, worldName, documentName, unitNumber, categories }
    
    const file_path = body.file_path;
    const text = body.text;
    const universeId = body.universeId || body.universe_id;
    const worldId = body.worldId || body.world_id;
    const worldName = body.worldName;
    const documentName = body.documentName;
    const unitNumber = body.unitNumber;
    const categories = body.categories || [];

    // Validação: precisa ter OU file_path OU text
    if (!file_path && !text) {
      return NextResponse.json(
        { error: "É necessário fornecer 'file_path' (arquivo) ou 'text' (texto direto)" },
        { status: 400 }
      );
    }

    if (!universeId || !worldId) {
      return NextResponse.json(
        { error: "Parâmetros 'universeId' e 'worldId' são obrigatórios" },
        { status: 400 }
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Extrair texto (de arquivo OU usar texto direto)
    let extractedText = "";
    
    if (file_path) {
      // CENÁRIO 1: Extração de arquivo
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(file_path);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: "Erro ao baixar arquivo" },
          { status: 500 }
        );
      }

      const fileExtension = file_path.split(".").pop()?.toLowerCase();

      if (fileExtension === "pdf") {
        const buffer = await fileData.arrayBuffer();
        const pdfData = await pdfParse(Buffer.from(buffer));
        extractedText = pdfData.text;
      } else if (fileExtension === "docx") {
        const buffer = await fileData.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
        extractedText = result.value;
      } else if (fileExtension === "txt") {
        extractedText = await fileData.text();
      } else {
        return NextResponse.json(
          { error: "Formato de arquivo não suportado" },
          { status: 400 }
        );
      }
    } else {
      // CENÁRIO 2: Texto direto
      extractedText = text;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do documento" },
        { status: 400 }
      );
    }

    // Get categories for this universe
    const { data: categoriesData } = await supabase
      .from("lore_categories")
      .select("*")
      .eq("universe_id", universeId);

    const categoriesText = categoriesData
      ?.map(c => `- ${c.label} (${c.slug}): ${c.description || ""}`)
      .join("\n") || "";

    // Call OpenAI to extract entities
    const prompt = `Você é um assistente especializado em extrair informações de textos narrativos.

Analise o texto abaixo e extraia todas as entidades relevantes, organizando-as nas seguintes categorias:

${categoriesText}

Para cada entidade extraída, forneça:
1. **tipo**: o slug da categoria (ex: personagem, local, evento, conceito, regra)
2. **titulo**: nome da entidade
3. **resumo**: breve resumo em 1-2 linhas
4. **conteudo**: descrição detalhada
5. **ano_diegese**: ano no universo ficcional (se mencionado)
6. **tags**: palavras-chave separadas por vírgula

Além das entidades, identifique RELAÇÕES entre elas:
- Tipos de relação: amigo_de, inimigo_de, pai_de, filho_de, irmão_de, casado_com, trabalha_em, mora_em, nasceu_em, pertence_a, lider_de, membro_de, criador_de, aconteceu_em, participou_de, causou, foi_causado_por, relacionado_a

Retorne APENAS um JSON válido no formato:
{
  "entities": [
    {
      "tipo": "personagem",
      "titulo": "Nome do Personagem",
      "resumo": "Breve descrição",
      "conteudo": "Descrição detalhada",
      "ano_diegese": 2024,
      "tags": "tag1, tag2, tag3"
    }
  ],
  "relations": [
    {
      "source": "Nome da Entidade Origem",
      "target": "Nome da Entidade Destino",
      "type": "tipo_de_relacao",
      "description": "Descrição opcional da relação"
    }
  ]
}

TEXTO PARA ANÁLISE:
---
${extractedText.slice(0, 15000)}
---

Retorne APENAS o JSON, sem texto adicional.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente que extrai entidades de textos narrativos e retorna JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse JSON response
    let entities = [];
    let relations = [];
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        entities = parsed.entities || [];
        relations = parsed.relations || [];
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA" },
        { status: 500 }
      );
    }

    if (entities.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma entidade foi extraída do documento" },
        { status: 400 }
      );
    }

    // Gerar Sinopse automaticamente (logline + parágrafo)
    let sinopseResumo = "";
    let sinopseConteudo = "";

    try {
      const sinopsePrompt = `Baseado no seguinte texto narrativo, gere:
1. Uma LOGLINE (uma única linha que resume a essência da história)
2. Uma SINOPSE (um parágrafo que descreve a história em detalhes)

Texto:
${extractedText.slice(0, 5000)}

Retorne APENAS um JSON válido no seguinte formato:
{
  "logline": "Uma única linha resumindo a história",
  "sinopse": "Um parágrafo descrevendo a história"
}`;

      const sinopseCompletion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em criar sinopses de histórias. Retorne APENAS JSON válido.",
          },
          {
            role: "user",
            content: sinopsePrompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const sinopseResponse = sinopseCompletion.choices[0]?.message?.content || "";
      try {
        const sinopseParsed = JSON.parse(sinopseResponse);
        sinopseResumo = sinopseParsed.logline || "";
        sinopseConteudo = sinopseParsed.sinopse || "";
      } catch (e) {
        console.error("Error parsing sinopse JSON:", e);
      }
    } catch (error) {
      console.error("Error generating sinopse:", error);
    }

    // Adicionar Sinopse à lista de entidades (com logline como resumo e parágrafo como conteúdo)
    // SEMPRE adicionar a Sinopse, mesmo que vazia, para não haver conflito com a criação automática em Projetos
    entities.push({
      tipo: "sinopse",
      titulo: documentName || "Sinopse",
      resumo: sinopseResumo || "Sinopse do episódio",
      conteudo: sinopseConteudo || "",
      tags: "sinopse, resumo"
    });

    // Adicionar Roteiro à lista de entidades (com o texto ORIGINAL, não gerado)
    if (extractedText) {
      entities.push({
        tipo: "roteiro",
        titulo: documentName ? `Roteiro - ${documentName}` : "Roteiro",
        resumo: "Roteiro gerado automaticamente",
        conteudo: extractedText,
        tags: "roteiro, estrutura, cenas"
      });
    }

    return NextResponse.json({
      success: true,
      extracted_text: extractedText.slice(0, 1000) + "...",
      entities,
      relations,
      count: entities.length,
    });

  } catch (error) {
    console.error("Error in extract:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
