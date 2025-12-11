const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qvqfifbayxuuoilxliwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cWZpZmJheXh1dW9pbHhsaXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMzA3NCwiZXhwIjoyMDc4Nzg5MDc0fQ.JO5I5wTEc_ea17m4Rr4No_sBf9GlOwaXnIwVScFwf_I';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Criar tabela episodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  world_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar foreign keys
ALTER TABLE public.episodes
  ADD CONSTRAINT IF NOT EXISTS fk_episodes_user 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.episodes
  ADD CONSTRAINT IF NOT EXISTS fk_episodes_world 
  FOREIGN KEY (world_id) 
  REFERENCES public.worlds(id) 
  ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON public.episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_world_id ON public.episodes(world_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_world ON public.episodes(user_id, world_id);
CREATE INDEX IF NOT EXISTS idx_episodes_ordem ON public.episodes(ordem);

-- Habilitar RLS
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'episodes' AND policyname = 'Users can view their own episodes'
  ) THEN
    CREATE POLICY "Users can view their own episodes"
      ON public.episodes FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'episodes' AND policyname = 'Users can create their own episodes'
  ) THEN
    CREATE POLICY "Users can create their own episodes"
      ON public.episodes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'episodes' AND policyname = 'Users can update their own episodes'
  ) THEN
    CREATE POLICY "Users can update their own episodes"
      ON public.episodes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'episodes' AND policyname = 'Users can delete their own episodes'
  ) THEN
    CREATE POLICY "Users can delete their own episodes"
      ON public.episodes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger para atualizar updated_at automaticamente
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

async function createTable() {
  try {
    console.log('Executando SQL para criar tabela episodes...');
    
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      
      // Tentar via query direta
      console.log('\nTentando via query direta...');
      const { data: data2, error: error2 } = await supabase
        .from('_sql')
        .select('*')
        .sql(sql);
        
      if (error2) {
        console.error('Erro na query direta:', error2);
        process.exit(1);
      }
      
      console.log('Sucesso via query direta!', data2);
    } else {
      console.log('Sucesso!', data);
    }
    
    // Verificar se a tabela foi criada
    const { data: tables, error: tablesError } = await supabase
      .from('episodes')
      .select('*')
      .limit(1);
      
    if (tablesError) {
      console.error('Erro ao verificar tabela:', tablesError);
    } else {
      console.log('\n✅ Tabela episodes criada com sucesso!');
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
    process.exit(1);
  }
}

createTable();
