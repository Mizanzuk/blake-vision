import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { categoryName, categorySlug, existingDescription } = await request.json();

    if (!categoryName) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Criar o prompt para a IA
    const prompt = existingDescription
      ? `Você é um assistente criativo para um sistema de gerenciamento de narrativas. 
        
A categoria "${categoryName}" (slug: ${categorySlug}) já possui a seguinte descrição:

"${existingDescription}"

Por favor, complemente e expanda esta descrição com mais detalhes, contexto e informações relevantes. Mantenha o tom profissional e narrativo. Não remova ou modifique o texto existente, apenas adicione novo conteúdo após ele.`
      : `Você é um assistente criativo para um sistema de gerenciamento de narrativas.

Crie uma descrição detalhada e profissional para a categoria "${categoryName}" (slug: ${categorySlug}). 

A descrição deve:
- Explicar o propósito da categoria
- Descrever que tipo de conteúdo deve ser incluído
- Ser clara e concisa
- Ter entre 2-4 parágrafos`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const description = completion.choices[0]?.message?.content || '';

    if (!description) {
      return NextResponse.json(
        { error: 'Erro ao gerar descrição' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description: description.trim(),
    });
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar descrição com IA' },
      { status: 500 }
    );
  }
}
