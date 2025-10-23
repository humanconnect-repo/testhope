-- Correzione della funzione get_prediction_percentages per includere total_amount_bnb
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_prediction_percentages(uuid);

-- 2. Crea la funzione corretta con total_amount_bnb
CREATE OR REPLACE FUNCTION get_prediction_percentages(prediction_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'yes_percentage', CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE b.position = 'yes')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
          2
        )
      END,
      'no_percentage', CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE b.position = 'no')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
          2
        )
      END,
      'total_bets', COUNT(*),
      'total_amount_bnb', COALESCE(SUM(b.amount_bnb), 0)
    )
  ) INTO result
  FROM bets b 
  WHERE b.prediction_id = prediction_uuid;
  
  RETURN COALESCE(result, '[{"yes_percentage": 0, "no_percentage": 0, "total_bets": 0, "total_amount_bnb": 0}]'::json);
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
