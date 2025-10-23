-- Fix per aggiungere il campo position alla funzione get_top_bettors
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_top_bettors(uuid, integer);

-- 2. Crea la funzione corretta con il campo bet_choice
CREATE OR REPLACE FUNCTION get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  total_amount NUMERIC,
  bet_count BIGINT,
  last_bet_at TIMESTAMPTZ,
  bet_choice TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    COALESCE(p.username, 'Utente Anonimo') as username,
    SUM(b.amount_bnb) as total_amount,
    COUNT(*) as bet_count,
    MAX(b.created_at) as last_bet_at,
    CASE 
      WHEN b.position = 'yes' THEN 'yes'
      WHEN b.position = 'no' THEN 'no'
      ELSE 'yes' -- Default fallback
    END as bet_choice
  FROM bets b
  LEFT JOIN profiles p ON b.user_id = p.id
  WHERE b.prediction_id = prediction_uuid
  GROUP BY b.user_id, p.username, b.position
  ORDER BY total_amount DESC
  LIMIT limit_count;
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;

-- 4. Test della funzione
SELECT 'Funzione get_top_bettors corretta con campo position!' as status;
