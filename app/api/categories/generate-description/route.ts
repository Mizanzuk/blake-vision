import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { nome, prefixo } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    // Generate description with OpenAI
    const prompt = `Você é um assistente especializado em organização de universos ficcionais.

Sua tarefa é gerar uma descrição detalhada e útil para uma categoria de fichas chamada "${nome}" (prefixo: ${prefixo || "N/A"}).

A descrição deve:
1. Explicar o que essa categoria representa
2. Dar exemplos de fichas que se encaixam nela
3. Orientar o usuário sobre quando usar essa categoria
4. Ser clara, concisa e prática (2-3 parágrafos)

Formato: Texto corrido, sem títulos ou marcadores.

Categoria: ${nome}
Prefixo: ${prefixo || "N/A"}

Descrição:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em organização de universos ficcionais. Gere descrições claras e úteis para categorias de fichas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const description = completion.choices[0].message.content?.trim() || "";

    return NextResponse.json({
      description,
    });
  } catch (error: any) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar descrição" },
      { status: 500 }
    );
  }
}
