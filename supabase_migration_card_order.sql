-- Create card_custom_order table for storing custom card order
CREATE TABLE IF NOT EXISTS card_custom_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
  ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  custom_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one order per ficha per user per universe
  UNIQUE(user_id, universe_id, ficha_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_card_custom_order_user_universe 
  ON card_custom_order(user_id, universe_id);

-- Enable Row Level Security
ALTER TABLE card_custom_order ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own custom orders
CREATE POLICY "Users can view their own card orders"
  ON card_custom_order
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own custom orders
CREATE POLICY "Users can insert their own card orders"
  ON card_custom_order
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own custom orders
CREATE POLICY "Users can update their own card orders"
  ON card_custom_order
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own custom orders
CREATE POLICY "Users can delete their own card orders"
  ON card_custom_order
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_card_custom_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_card_custom_order_timestamp
  BEFORE UPDATE ON card_custom_order
  FOR EACH ROW
  EXECUTE FUNCTION update_card_custom_order_updated_at();
