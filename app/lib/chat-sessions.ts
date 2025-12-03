import { SupabaseClient } from '@supabase/supabase-js';
import type { ChatSession } from '@/app/types';

/**
 * Carrega todas as sessões de chat do usuário logado
 */
export async function loadChatSessions(supabase: SupabaseClient): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exception loading chat sessions:', e);
    return [];
  }
}

/**
 * Salva uma sessão de chat no banco de dados
 */
export async function saveChatSession(
  supabase: SupabaseClient,
  session: ChatSession,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .upsert({
        id: session.id,
        user_id: userId,
        universe_id: session.universeId || null,
        mode: session.mode,
        title: session.title,
        messages: session.messages,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving chat session:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Exception saving chat session:', e);
    return false;
  }
}

/**
 * Deleta uma sessão de chat do banco de dados
 */
export async function deleteChatSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Exception deleting chat session:', e);
    return false;
  }
}

/**
 * Salva múltiplas sessões de uma vez (batch)
 */
export async function saveChatSessionsBatch(
  supabase: SupabaseClient,
  sessions: ChatSession[],
  userId: string
): Promise<boolean> {
  try {
    const records = sessions.map(session => ({
      id: session.id,
      user_id: userId,
      universe_id: session.universeId || null,
      mode: session.mode,
      title: session.title,
      messages: session.messages,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('chat_sessions')
      .upsert(records);

    if (error) {
      console.error('Error saving chat sessions batch:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Exception saving chat sessions batch:', e);
    return false;
  }
}
