-- Migração: Renomear coluna 'episodio' para 'episode_id' e alterar tipo de string para UUID
-- Esta migração é necessária para suportar o novo sistema de episódios baseado em UUID

-- 1. Adicionar nova coluna episode_id (UUID) se não existir
ALTER TABLE fichas
ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL;

-- 2. Remover coluna episodio (string) se existir
ALTER TABLE fichas
DROP COLUMN IF EXISTS episodio CASCADE;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_fichas_episode_id ON fichas(episode_id);

-- 4. Remover campo descricao se existir (redundante com conteudo)
ALTER TABLE fichas
DROP COLUMN IF EXISTS descricao CASCADE;
