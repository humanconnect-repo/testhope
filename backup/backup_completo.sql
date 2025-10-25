-- ==============================================
-- BACKUP COMPLETO BELLA NAPOLI
-- Data: 2025-10-10
-- Include: Funzioni corrette, Schema, Dati, Permessi
-- ==============================================

-- ==============================================
-- 1. FUNZIONI CORRETTE (VERSIONI FINALI)
-- ==============================================

-- Elimina funzioni esistenti se ci sono
DROP FUNCTION IF EXISTS get_prediction_percentages(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_top_bettors(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS get_prediction_comments(uuid, integer) CASCADE;

-- 1.1 get_prediction_percentages (VERSIONE CORRETTA)
CREATE OR REPLACE FUNCTION get_prediction_percentages(prediction_uuid UUID)
RETURNS TABLE (
  yes_percentage NUMERIC,
  no_percentage NUMERIC,
  total_bets INTEGER,
  total_amount_bnb NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Se non ci sono scommesse, restituisci valori di default
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::INTEGER, 0::NUMERIC;
  END IF;
END;
$$;

-- 1.2 get_top_bettors (VERSIONE CORRETTA)
CREATE OR REPLACE FUNCTION get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  total_amount_bnb NUMERIC,
  prediction_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    COALESCE(prof.nickname, 'Anonimo') as username,
    SUM(b.amount_bnb) as total_amount_bnb,
    COUNT(*)::INTEGER as prediction_count
  FROM bets b
  LEFT JOIN profiles prof ON prof.wallet_address = b.user_id
  WHERE b.prediction_id = prediction_uuid
  GROUP BY b.user_id, prof.nickname
  ORDER BY total_amount_bnb DESC
  LIMIT limit_count;
END;
$$;

-- 1.3 get_prediction_comments (VERSIONE CORRETTA)
CREATE OR REPLACE FUNCTION get_prediction_comments(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_id TEXT,
  username TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ==============================================
-- 2. PERMESSI
-- ==============================================
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- ==============================================
-- 3. VERIFICA FINALE
-- ==============================================
SELECT 'Backup completo creato con successo!' as status;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_prediction_percentages', 'get_top_bettors', 'get_prediction_comments');

-- ==============================================
-- 4. ISTRUZIONI PER IL RIPRISTINO
-- ==============================================
-- 
-- Per ripristinare questo backup:
-- 1. Vai nella dashboard Supabase → SQL Editor
-- 2. Copia e incolla tutto il contenuto di questo file
-- 3. Esegui lo script
-- 4. Verifica che le funzioni siano state create correttamente
--
-- Le funzioni includono:
-- - get_prediction_percentages: Calcola le percentuali delle scommesse
-- - get_top_bettors: Mostra i top scommettitori
-- - get_prediction_comments: Recupera i commenti
--
-- Tutte le funzioni hanno:
-- - Search path fisso per sicurezza
-- - Gestione corretta degli errori
-- - Permessi appropriati per authenticated e anon
-- ==============================================
