-- Funzione semplice e sicura per get_prediction_percentages
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_prediction_percentages(uuid);

-- 2. Crea la funzione semplice
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
        (COUNT(*) FILTER (WHERE b.position = 'yes')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
        2
      )
    END as yes_percentage,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE b.position = 'no')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
        2
      )
    END as no_percentage,
    COUNT(*)::INTEGER as total_bets,
    COALESCE(SUM(b.amount_bnb), 0) as total_amount_bnb
  FROM bets b 
  WHERE b.prediction_id = prediction_uuid;
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
