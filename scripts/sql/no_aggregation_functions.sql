-- Funzioni senza aggregazioni per evitare GROUP BY
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina le funzioni esistenti
DROP FUNCTION IF EXISTS get_prediction_percentages(uuid);
DROP FUNCTION IF EXISTS get_predictions_with_percentages();
DROP FUNCTION IF EXISTS get_top_bettors(uuid, integer);
DROP FUNCTION IF EXISTS get_prediction_comments(uuid, integer);

-- 2. Funzione senza aggregazioni per ottenere le prediction
CREATE OR REPLACE FUNCTION get_predictions_with_percentages()
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  status TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  yes_percentage NUMERIC,
  no_percentage NUMERIC,
  total_bets INTEGER,
  total_amount_bnb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.category,
    p.closing_date,
    p.status,
    p.rules,
    p.created_at,
    p.updated_at,
    p.created_by,
    0::NUMERIC as yes_percentage,
    0::NUMERIC as no_percentage,
    0::INTEGER as total_bets,
    0::NUMERIC as total_amount_bnb
  FROM predictions p
  WHERE p.status = 'attiva'
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. Funzione senza aggregazioni per ottenere le percentuali
CREATE OR REPLACE FUNCTION get_prediction_percentages(prediction_uuid UUID)
RETURNS TABLE (
  yes_percentage NUMERIC,
  no_percentage NUMERIC,
  total_bets INTEGER,
  total_amount_bnb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    0::NUMERIC as yes_percentage,
    0::NUMERIC as no_percentage,
    0::INTEGER as total_bets,
    0::NUMERIC as total_amount_bnb
  FROM bets b 
  WHERE b.prediction_id = prediction_uuid
  LIMIT 1;
  
  -- Se non ci sono scommesse, restituisci valori di default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      0::NUMERIC as yes_percentage,
      0::NUMERIC as no_percentage,
      0::INTEGER as total_bets,
      0::NUMERIC as total_amount_bnb;
  END IF;
END;
$$;

-- 4. Funzione senza aggregazioni per ottenere i top scommettitori
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
    COALESCE(prof.username, 'Anonimo') as username,
    b.amount_bnb as total_amount_bnb,
    1::INTEGER as prediction_count
  FROM bets b
  LEFT JOIN profiles prof ON prof.wallet_address = b.user_id
  WHERE b.prediction_id = prediction_uuid
  ORDER BY b.amount_bnb DESC
  LIMIT limit_count;
END;
$$;

-- 5. Funzione senza aggregazioni per ottenere i commenti
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
    COALESCE(prof.username, 'Anonimo') as username
  FROM comments c
  LEFT JOIN profiles prof ON prof.wallet_address = c.user_id
  WHERE c.prediction_id = prediction_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 6. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_predictions_with_percentages() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- 7. Test della funzione principale
SELECT 'Funzioni senza aggregazioni create con successo!' as status;
