-- Correzione username -> nickname nelle funzioni
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina le funzioni esistenti
DROP FUNCTION IF EXISTS get_top_bettors(uuid, integer);
DROP FUNCTION IF EXISTS get_prediction_comments(uuid, integer);

-- 2. Funzione corretta per ottenere i top scommettitori
CREATE OR REPLACE FUNCTION get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  total_amount_bnb NUMERIC,
  prediction_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    COALESCE(prof.nickname, 'Anonimo') as username,
    b.amount_bnb as total_amount_bnb,
    1::INTEGER as prediction_count
  FROM bets b
  LEFT JOIN profiles prof ON prof.wallet_address = b.user_id
  WHERE b.prediction_id = prediction_uuid
  ORDER BY b.amount_bnb DESC
  LIMIT limit_count;
END;
$$;

-- 3. Funzione corretta per ottenere i commenti
CREATE OR REPLACE FUNCTION get_prediction_comments(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  text TEXT,
  created_at TIMESTAMPTZ,
  user_id TEXT,
  username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.text,
    c.created_at,
    c.user_id,
    COALESCE(prof.nickname, 'Anonimo') as username
  FROM comments c
  LEFT JOIN profiles prof ON prof.wallet_address = c.user_id
  WHERE c.prediction_id = prediction_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 4. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- 5. Test delle funzioni corrette
SELECT 'Funzioni corrette create con successo!' as status;
