import { getSupabaseClient } from "./supabase/client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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
  try {
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar fichas
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("match_fichas", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_universe_id: universeId,
    });

    if (error) {
      console.error("Error searching lore:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchLore:", error);
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
