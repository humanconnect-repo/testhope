-- =============================================
-- TABELLE MANCANTI PER SISTEMA PREDICTION
-- =============================================

-- 1. Tabella per le scommesse
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_bnb NUMERIC(18,8) NOT NULL CHECK (amount_bnb > 0),
  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabella per i commenti
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Aggiungi slug alle predictions se non esiste
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'predictions' AND column_name = 'slug'
  ) THEN
    ALTER TABLE predictions ADD COLUMN slug TEXT;
    -- Genera slug automatici per le prediction esistenti
    UPDATE predictions 
    SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'))
    WHERE slug IS NULL;
    -- Rendi slug unico e non null
    ALTER TABLE predictions ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS predictions_slug_unique ON predictions(slug);
  END IF;
END $$;

-- 4. Indici per performance
CREATE INDEX IF NOT EXISTS idx_bets_prediction_id ON bets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_prediction_id ON comments(prediction_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 5. RLS per bets
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "bets_select_public" ON bets FOR SELECT USING (true);

-- Policy per inserimento (solo utenti autenticati)
CREATE POLICY "bets_insert_authenticated" ON bets FOR INSERT 
  WITH CHECK (true);

-- Policy per aggiornamento (solo il proprietario)
CREATE POLICY "bets_update_owner" ON bets FOR UPDATE 
  USING (user_id = (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Policy per eliminazione (solo il proprietario)
CREATE POLICY "bets_delete_owner" ON bets FOR DELETE 
  USING (user_id = (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- 6. RLS per comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica
CREATE POLICY "comments_select_public" ON comments FOR SELECT USING (true);

-- Policy per inserimento (solo utenti autenticati)
CREATE POLICY "comments_insert_authenticated" ON comments FOR INSERT 
  WITH CHECK (true);

-- Policy per aggiornamento (solo il proprietario)
CREATE POLICY "comments_update_owner" ON comments FOR UPDATE 
  USING (user_id = (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Policy per eliminazione (solo il proprietario)
CREATE POLICY "comments_delete_owner" ON comments FOR DELETE 
  USING (user_id = (SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- 7. Concedi permessi
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bets TO authenticated;
GRANT SELECT ON TABLE bets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;
GRANT SELECT ON TABLE comments TO anon;
