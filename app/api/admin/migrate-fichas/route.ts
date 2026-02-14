import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only allow authenticated users (in production, add more security checks)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Execute migration SQL
    const migrationSQL = `
      -- Adicionar nova coluna episode_id (UUID) se não existir
      ALTER TABLE fichas
      ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL;

      -- Remover coluna episodio (string) se existir
      ALTER TABLE fichas
      DROP COLUMN IF EXISTS episodio CASCADE;

      -- Criar índice para melhor performance
      CREATE INDEX IF NOT EXISTS idx_fichas_episode_id ON fichas(episode_id);

      -- Remover campo descricao se existir (redundante com conteudo)
      ALTER TABLE fichas
      DROP COLUMN IF EXISTS descricao CASCADE;
    `;

    // Execute the SQL using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error("Erro ao executar migração:", error);
      return NextResponse.json(
        { error: "Erro ao executar migração", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso",
      data
    });

  } catch (error: any) {
    console.error("Erro na API de migração:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
