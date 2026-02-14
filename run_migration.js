const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = "https://qvqfifbayxuuoilxliwy.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cWZpZmJheXh1dW9pbHhsaXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMzA3NCwiZXhwIjoyMDc4Nzg5MDc0fQ.JO5I5wTEc_ea17m4Rr4No_sBf9GlOwaXnIwVScFwf_I";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log("🔄 Executando migração da tabela episodes...");

    // 1. Dropar a tabela antiga
    console.log("1️⃣ Dropando tabela antiga...");
    const { error: dropError } = await supabase.rpc("exec_sql", {
      sql: "DROP TABLE IF EXISTS public.episodes CASCADE;",
    });

    if (dropError && !dropError.message.includes("does not exist")) {
      console.error("❌ Erro ao dropar tabela:", dropError);
    } else {
      console.log("✅ Tabela antiga removida");
    }

    // 2. Criar a nova tabela
    console.log("2️⃣ Criando nova tabela...");
    const createTableSQL = `
      CREATE TABLE public.episodes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        world_id UUID NOT NULL,
        numero INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        ordem INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: createTableSQL,
    });

    if (createError) {
      console.error("❌ Erro ao criar tabela:", createError);
      return;
    }
    console.log("✅ Nova tabela criada");

    // 3. Adicionar foreign keys
    console.log("3️⃣ Adicionando foreign keys...");
    const fkSQL = `
      ALTER TABLE public.episodes
        ADD CONSTRAINT fk_episodes_user 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;

      ALTER TABLE public.episodes
        ADD CONSTRAINT fk_episodes_world 
        FOREIGN KEY (world_id) 
        REFERENCES public.worlds(id) 
        ON DELETE CASCADE;
    `;

    const { error: fkError } = await supabase.rpc("exec_sql", {
      sql: fkSQL,
    });

    if (fkError) {
      console.error("⚠️ Erro ao adicionar foreign keys:", fkError);
    } else {
      console.log("✅ Foreign keys adicionadas");
    }

    // 4. Criar índices
    console.log("4️⃣ Criando índices...");
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON public.episodes(user_id);
      CREATE INDEX IF NOT EXISTS idx_episodes_world_id ON public.episodes(world_id);
      CREATE INDEX IF NOT EXISTS idx_episodes_user_world ON public.episodes(user_id, world_id);
      CREATE INDEX IF NOT EXISTS idx_episodes_ordem ON public.episodes(ordem);
      CREATE INDEX IF NOT EXISTS idx_episodes_numero ON public.episodes(numero);
    `;

    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: indexSQL,
    });

    if (indexError) {
      console.error("⚠️ Erro ao criar índices:", indexError);
    } else {
      console.log("✅ Índices criados");
    }

    // 5. Habilitar RLS
    console.log("5️⃣ Habilitando Row Level Security...");
    const rlsSQL = `
      ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view their own episodes"
        ON public.episodes FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can create their own episodes"
        ON public.episodes FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own episodes"
        ON public.episodes FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own episodes"
        ON public.episodes FOR DELETE
        USING (auth.uid() = user_id);
    `;

    const { error: rlsError } = await supabase.rpc("exec_sql", {
      sql: rlsSQL,
    });

    if (rlsError) {
      console.error("⚠️ Erro ao habilitar RLS:", rlsError);
    } else {
      console.log("✅ RLS habilitado");
    }

    // 6. Criar trigger
    console.log("6️⃣ Criando trigger para updated_at...");
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_episodes_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS episodes_updated_at ON public.episodes;
      CREATE TRIGGER episodes_updated_at
        BEFORE UPDATE ON public.episodes
        FOR EACH ROW
        EXECUTE FUNCTION update_episodes_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc("exec_sql", {
      sql: triggerSQL,
    });

    if (triggerError) {
      console.error("⚠️ Erro ao criar trigger:", triggerError);
    } else {
      console.log("✅ Trigger criado");
    }

    // 7. Conceder permissões
    console.log("7️⃣ Concedendo permissões...");
    const grantSQL = `
      GRANT ALL ON public.episodes TO authenticated;
      GRANT ALL ON public.episodes TO service_role;
    `;

    const { error: grantError } = await supabase.rpc("exec_sql", {
      sql: grantSQL,
    });

    if (grantError) {
      console.error("⚠️ Erro ao conceder permissões:", grantError);
    } else {
      console.log("✅ Permissões concedidas");
    }

    console.log("\n✅ Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
  }
}

runMigration();
