-- ============================================
-- TABELA: categories
-- ============================================
-- Armazena as categorias personalizadas de cada universo
-- Substitui as categorias fixas por categorias dinâmicas

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identificação
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  
  -- Campos opcionais
  description TEXT,
  prefix TEXT,
  
  -- Relacionamentos
  universe_id UUID NOT NULL REFERENCES public.universes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Constraints
  UNIQUE(universe_id, slug)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_universe_id ON public.categories(universe_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias categorias
CREATE POLICY "Users can view their own categories"
  ON public.categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias categorias
CREATE POLICY "Users can insert their own categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias categorias
CREATE POLICY "Users can update their own categories"
  ON public.categories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias categorias
CREATE POLICY "Users can delete their own categories"
  ON public.categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
