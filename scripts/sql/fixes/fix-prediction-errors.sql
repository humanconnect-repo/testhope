-- =============================================
-- SCRIPT COMPLETO PER RISOLVERE ERRORI PREDICTION
-- =============================================
-- Esegui questo script nel SQL Editor di Supabase

-- 1. Crea tabella bets se non esiste
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_bnb NUMERIC(18,8) NOT NULL CHECK (amount_bnb > 0),
  "position" TEXT NOT NULL CHECK ("position" IN ('yes', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Crea tabella comments se non esiste
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
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
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

-- Rimuovi policy esistenti se esistono
DROP POLICY IF EXISTS "bets_select_public" ON bets;
DROP POLICY IF EXISTS "bets_insert_authenticated" ON bets;
DROP POLICY IF EXISTS "bets_update_owner" ON bets;
DROP POLICY IF EXISTS "bets_delete_owner" ON bets;

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

-- Rimuovi policy esistenti se esistono
DROP POLICY IF EXISTS "comments_select_public" ON comments;
DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
DROP POLICY IF EXISTS "comments_update_owner" ON comments;
DROP POLICY IF EXISTS "comments_delete_owner" ON comments;

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

-- 8. Crea funzioni RPC mancanti

-- Funzione per ottenere le scommesse recenti (globali)
CREATE OR REPLACE FUNCTION public.get_recent_bets(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  bet_id UUID,
  amount_bnb NUMERIC,
  "position" TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  prediction_title TEXT,
  prediction_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bet_id,
    b.amount_bnb,
    b."position",
    b.created_at,
    COALESCE(p.username, 'Anonimo') as username,
    pr.title as prediction_title,
    COALESCE(pr.slug, '') as prediction_slug
  FROM bets b
  LEFT JOIN profiles p ON b.user_id = p.id
  LEFT JOIN predictions pr ON b.prediction_id = pr.id
  ORDER BY b.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Funzione per ottenere i top scommettitori di una prediction specifica
CREATE OR REPLACE FUNCTION public.get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  total_amount NUMERIC,
  bet_count BIGINT,
  last_bet_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    COALESCE(p.username, 'Anonimo') as username,
    SUM(b.amount_bnb) as total_amount,
    COUNT(*) as bet_count,
    MAX(b.created_at) as last_bet_at
  FROM bets b
  LEFT JOIN profiles p ON b.user_id = p.id
  WHERE b.prediction_id = prediction_uuid
  GROUP BY b.user_id, p.username
  ORDER BY total_amount DESC
  LIMIT limit_count;
END;
$$;

-- Funzione per ottenere i commenti di una prediction specifica
CREATE OR REPLACE FUNCTION public.get_prediction_comments(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  comment_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as comment_id,
    c.content,
    c.created_at,
    COALESCE(p.username, 'Anonimo') as username,
    c.user_id
  FROM comments c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.prediction_id = prediction_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Funzione per creare un nuovo commento
CREATE OR REPLACE FUNCTION public.create_comment(
  prediction_uuid UUID,
  comment_content TEXT,
  caller_wallet TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comment_id UUID;
  user_profile_id UUID;
BEGIN
  -- Trova l'ID del profilo basato sul wallet
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE wallet_address = caller_wallet;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for wallet: %', caller_wallet;
  END IF;
  
  -- Inserisci il commento
  INSERT INTO comments (prediction_id, user_id, content)
  VALUES (prediction_uuid, user_profile_id, comment_content)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$;

-- Funzione per creare una scommessa
CREATE OR REPLACE FUNCTION public.create_bet(
  prediction_uuid UUID,
  bet_amount NUMERIC,
  bet_position TEXT,
  caller_wallet TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_bet_id UUID;
  user_profile_id UUID;
BEGIN
  -- Trova l'ID del profilo basato sul wallet
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE wallet_address = caller_wallet;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for wallet: %', caller_wallet;
  END IF;
  
  -- Valida la posizione
  IF bet_position NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Invalid bet position: %. Must be "yes" or "no"', bet_position;
  END IF;
  
  -- Inserisci la scommessa
  INSERT INTO bets (prediction_id, user_id, amount_bnb, "position")
  VALUES (prediction_uuid, user_profile_id, bet_amount, bet_position)
  RETURNING id INTO new_bet_id;
  
  RETURN new_bet_id;
END;
$$;

-- 9. Concedi i permessi di esecuzione per le funzioni RPC
GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_bet(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- Concedi anche ad anon per le funzioni di lettura
GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO anon;

-- 10. Verifica che tutto sia stato creato correttamente
SELECT 'Script completato con successo!' as status;
