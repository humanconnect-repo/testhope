-- Funzione per ottenere le ultime scommesse del sito con tutti i dati necessari
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina la funzione se esiste già
DROP FUNCTION IF EXISTS get_recent_bets(integer);

-- 2. Crea la funzione per ottenere le ultime scommesse
CREATE OR REPLACE FUNCTION get_recent_bets(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  bet_id UUID,
  amount_bnb NUMERIC,
  position TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  prediction_title TEXT,
  prediction_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bet_id,
    b.amount_bnb,
    b.position,
    b.created_at,
    COALESCE(p.nickname, 'Anonimo') as username,
    pred.title as prediction_title,
    pred.slug as prediction_slug
  FROM bets b
  LEFT JOIN profiles p ON p.id = b.user_id
  LEFT JOIN predictions pred ON pred.id = b.prediction_id
  ORDER BY b.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO authenticated, anon;

-- 4. Test della funzione
SELECT 'Funzione get_recent_bets creata con successo!' as status;
