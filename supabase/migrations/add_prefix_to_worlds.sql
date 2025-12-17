-- Adicionar campo prefix à tabela worlds
ALTER TABLE worlds ADD COLUMN IF NOT EXISTS prefix VARCHAR(10);

-- Criar índice para melhorar performance de busca por prefix
CREATE INDEX IF NOT EXISTS idx_worlds_prefix ON worlds(prefix);

-- Comentário explicativo
COMMENT ON COLUMN worlds.prefix IS 'Prefixo único do mundo usado na geração de códigos de fichas (ex: AV para Arquivos Vermelhos)';
