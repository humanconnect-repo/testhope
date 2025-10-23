-- Funzioni mancanti per il sistema di prediction
-- Esegui questo script nel Supabase SQL Editor

-- 1. Funzione per ottenere le prediction con percentuali calcolate
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
    COALESCE(percentages.yes_percentage, 0) as yes_percentage,
    COALESCE(percentages.no_percentage, 0) as no_percentage,
    COALESCE(percentages.total_bets, 0) as total_bets,
    COALESCE(percentages.total_amount_bnb, 0) as total_amount_bnb
  FROM predictions p
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE b.prediction = 'yes')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
          2
        )
      END as yes_percentage,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE b.prediction = 'no')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
          2
        )
      END as no_percentage,
      COUNT(*) as total_bets,
      COALESCE(SUM(b.amount_bnb), 0) as total_amount_bnb
    FROM bets b 
    WHERE b.prediction_id = p.id
  ) percentages ON true
  WHERE p.status = 'attiva'
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Funzione per ottenere le percentuali di una singola prediction
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
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE b.prediction = 'yes')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
        2
      )
    END as yes_percentage,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE b.prediction = 'no')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
        2
      )
    END as no_percentage,
    COUNT(*) as total_bets,
    COALESCE(SUM(b.amount_bnb), 0) as total_amount_bnb
  FROM bets b 
  WHERE b.prediction_id = prediction_uuid;
END;
$$;

-- 3. Funzione per ottenere i top scommettitori di una prediction
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
    SUM(b.amount_bnb) as total_amount_bnb,
    COUNT(*) as prediction_count
  FROM bets b
  LEFT JOIN profiles prof ON prof.wallet_address = b.user_id
  WHERE b.prediction_id = prediction_uuid
  GROUP BY b.user_id, prof.username
  ORDER BY total_amount_bnb DESC
  LIMIT limit_count;
END;
$$;

-- 4. Funzione per ottenere i commenti di una prediction
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

-- 5. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_predictions_with_percentages() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- 6. Test della funzione principale
SELECT 'Funzioni create con successo!' as status;
