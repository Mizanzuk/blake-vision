-- Adicionar campo categoria na tabela textos
ALTER TABLE textos ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_textos_categoria ON textos(categoria);

-- Comentário explicativo
COMMENT ON COLUMN textos.categoria IS 'Categoria do texto (ex: Personagem, Local, Evento, ou null para roteiro/texto livre)';
