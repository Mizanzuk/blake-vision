import { createAdminClient } from "./supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1',
});

export interface LoreSearchResult {
  id: string;
  titulo: string;
  tipo: string;
  resumo?: string | null;
  conteudo?: string | null;
  similarity: number;
}

export async function searchLore(
  query: string,
  universeId: string,
  matchThreshold: number = 0.5,
  matchCount: number = 10
): Promise<LoreSearchResult[]> {
  console.log('[searchLore] Called with:', { query, universeId, matchThreshold, matchCount });
  try {
    // Generate embedding for the query
    console.log('[searchLore] Generating embedding...');
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('[searchLore] Embedding generated:', { dimensions: queryEmbedding.length });

    // Search for similar fichas
    console.log('[searchLore] Calling match_fichas...');
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc("match_fichas", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_universe_id: universeId,
    });
    console.log('[searchLore] Database response:', { data, error });

    if (error) {
      console.error("[searchLore] Error searching lore:", error);
      return [];
    }

    console.log('[searchLore] Returning results:', { count: data?.length || 0 });
    return data || [];
  } catch (error) {
    console.error("[searchLore] Exception in searchLore:", error);
    return [];
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
