-- Tabela para armazenar textos do editor/biblioteca
CREATE TABLE IF NOT EXISTS textos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  universe_id UUID,
  world_id TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  episodio TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  extraido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_textos_user_id ON textos(user_id);
CREATE INDEX IF NOT EXISTS idx_textos_status ON textos(status);
CREATE INDEX IF NOT EXISTS idx_textos_universe_id ON textos(universe_id);
CREATE INDEX IF NOT EXISTS idx_textos_world_id ON textos(world_id);
CREATE INDEX IF NOT EXISTS idx_textos_extraido ON textos(extraido);

-- RLS (Row Level Security)
ALTER TABLE textos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver seus próprios textos" ON textos;
CREATE POLICY "Usuários podem ver seus próprios textos"
  ON textos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios textos" ON textos;
CREATE POLICY "Usuários podem criar seus próprios textos"
  ON textos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios textos" ON textos;
CREATE POLICY "Usuários podem atualizar seus próprios textos"
  ON textos FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios textos" ON textos;
CREATE POLICY "Usuários podem deletar seus próprios textos"
  ON textos FOR DELETE
  USING (auth.uid() = user_id);
