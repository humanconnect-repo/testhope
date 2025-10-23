-- Correzione tipo di ritorno delle funzioni
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina le funzioni esistenti
DROP FUNCTION IF EXISTS get_prediction_percentages(uuid);
DROP FUNCTION IF EXISTS get_predictions_with_percentages();
DROP FUNCTION IF EXISTS get_top_bettors(uuid, integer);
DROP FUNCTION IF EXISTS get_prediction_comments(uuid, integer);

-- 2. Funzione per ottenere le prediction con percentuali calcolate (ARRAY)
CREATE OR REPLACE FUNCTION get_predictions_with_percentages()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'title', p.title,
      'slug', p.slug,
      'description', p.description,
      'category', p.category,
      'closing_date', p.closing_date,
      'status', p.status,
      'rules', p.rules,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'created_by', p.created_by,
      'yes_percentage', COALESCE(percentages.yes_percentage, 0),
      'no_percentage', COALESCE(percentages.no_percentage, 0),
      'total_bets', COALESCE(percentages.total_bets, 0),
      'total_amount_bnb', COALESCE(percentages.total_amount_bnb, 0)
    )
  ) INTO result
  FROM predictions p
  LEFT JOIN LATERAL (
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
      COUNT(*) as total_bets,
      COALESCE(SUM(b.amount_bnb), 0) as total_amount_bnb
    FROM bets b 
    WHERE b.prediction_id = p.id
  ) percentages ON true
  WHERE p.status = 'attiva'
  ORDER BY p.created_at DESC;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. Funzione per ottenere le percentuali di una singola prediction (ARRAY)
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

-- 4. Funzione per ottenere i top scommettitori di una prediction (ARRAY)
CREATE OR REPLACE FUNCTION get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'user_id', b.user_id,
      'username', COALESCE(prof.username, 'Anonimo'),
      'total_amount_bnb', SUM(b.amount_bnb),
      'prediction_count', COUNT(*)
    )
  ) INTO result
  FROM (
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
    LIMIT limit_count
  ) b;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. Funzione per ottenere i commenti di una prediction (ARRAY)
CREATE OR REPLACE FUNCTION get_prediction_comments(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'text', c.text,
      'created_at', c.created_at,
      'user_id', c.user_id,
      'username', COALESCE(prof.username, 'Anonimo')
    )
  ) INTO result
  FROM comments c
  LEFT JOIN profiles prof ON prof.wallet_address = c.user_id
  WHERE c.prediction_id = prediction_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 6. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION get_predictions_with_percentages() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- 7. Test della funzione principale
SELECT 'Funzioni JSON create con successo!' as status;
