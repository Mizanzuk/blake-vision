-- Migration: Fix episodes table structure
-- Created: 2025-02-14
-- Description: Update episodes table to use numero and titulo instead of nome and descricao

-- Drop the old table if it exists and recreate with correct structure
DROP TABLE IF EXISTS public.episodes CASCADE;

-- Create episodes table with correct structure
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

-- Add foreign key constraints
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON public.episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_world_id ON public.episodes(world_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user_world ON public.episodes(user_id, world_id);
CREATE INDEX IF NOT EXISTS idx_episodes_ordem ON public.episodes(ordem);
CREATE INDEX IF NOT EXISTS idx_episodes_numero ON public.episodes(numero);

-- Enable Row Level Security
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own episodes
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

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_episodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS episodes_updated_at ON public.episodes;
CREATE TRIGGER episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_episodes_updated_at();

-- Grant permissions
GRANT ALL ON public.episodes TO authenticated;
GRANT ALL ON public.episodes TO service_role;
