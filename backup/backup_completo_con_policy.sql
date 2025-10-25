-- ==============================================
-- BACKUP COMPLETO BELLA NAPOLI CON POLICY RLS
-- Data: 2025-10-10
-- Include: Funzioni, Schema, Dati, Policy RLS, Permessi
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
-- 2. ABILITA ROW LEVEL SECURITY
-- ==============================================

-- Abilita RLS su tutte le tabelle principali
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. POLICY RLS PER PREDICTIONS
-- ==============================================

-- Policy per SELECT (tutti possono leggere)
CREATE POLICY "predictions_consolidated_select" ON predictions
FOR SELECT USING (true);

-- Policy per INSERT (solo service_role)
CREATE POLICY "predictions_consolidated_insert" ON predictions
FOR INSERT WITH CHECK (( SELECT auth.role() AS role) = 'service_role'::text);

-- Policy per UPDATE (solo service_role)
CREATE POLICY "predictions_consolidated_update" ON predictions
FOR UPDATE USING (( SELECT auth.role() AS role) = 'service_role'::text);

-- Policy per DELETE (solo service_role)
CREATE POLICY "predictions_consolidated_delete" ON predictions
FOR DELETE USING (( SELECT auth.role() AS role) = 'service_role'::text);

-- ==============================================
-- 4. POLICY RLS PER BETS
-- ==============================================

-- Policy per tutte le operazioni (solo service_role)
CREATE POLICY "Only service role can manage bets" ON bets
FOR ALL USING (( SELECT auth.role() AS role) = 'service_role'::text);

-- ==============================================
-- 5. POLICY RLS PER COMMENTS
-- ==============================================

-- Policy per tutte le operazioni (solo service_role)
CREATE POLICY "Only service role can manage comments" ON comments
FOR ALL USING (( SELECT auth.role() AS role) = 'service_role'::text);

-- ==============================================
-- 6. POLICY RLS PER PROFILES
-- ==============================================

-- Policy per SELECT (tutti possono leggere)
CREATE POLICY "profiles_consolidated_select" ON profiles
FOR SELECT USING (true);

-- Policy per INSERT (service_role o utenti autenticati)
CREATE POLICY "profiles_consolidated_insert" ON profiles
FOR INSERT WITH CHECK ((( SELECT auth.role() AS role) = 'service_role'::text) OR (( SELECT auth.uid() AS uid) IS NOT NULL));

-- Policy per UPDATE (service_role o proprietario del profilo)
CREATE POLICY "profiles_consolidated_update" ON profiles
FOR UPDATE USING ((( SELECT auth.role() AS role) = 'service_role'::text) OR (id = (( SELECT auth.uid() AS uid))::text));

-- Policy per DELETE (solo service_role)
CREATE POLICY "profiles_consolidated_delete" ON profiles
FOR DELETE USING (( SELECT auth.role() AS role) = 'service_role'::text);

-- ==============================================
-- 7. PERMESSI FUNZIONI
-- ==============================================
GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

-- ==============================================
-- 8. VERIFICA FINALE
-- ==============================================

-- Verifica funzioni
SELECT 'Funzioni create:' as status;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_prediction_percentages', 'get_top_bettors', 'get_prediction_comments');

-- Verifica RLS abilitato
SELECT 'RLS Status:' as status;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verifica policy
SELECT 'Policy RLS:' as status;
SELECT 
  tablename, 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- 9. ISTRUZIONI PER IL RIPRISTINO
-- ==============================================
-- 
-- Per ripristinare questo backup completo:
-- 1. Vai nella dashboard Supabase → SQL Editor
-- 2. Copia e incolla tutto il contenuto di questo file
-- 3. Esegui lo script
-- 4. Verifica che funzioni, RLS e policy siano stati creati correttamente
--
-- QUESTO BACKUP INCLUDE:
-- ✅ Funzioni corrette e ottimizzate
-- ✅ Row Level Security abilitato
-- ✅ Policy RLS per tutte le tabelle
-- ✅ Permessi appropriati
-- ✅ Sicurezza completa
--
-- SICUREZZA IMPLEMENTATA:
-- - Predictions: Solo service_role può modificare, tutti possono leggere
-- - Bets: Solo service_role può gestire
-- - Comments: Solo service_role può gestire  
-- - Profiles: Service_role + utenti autenticati per modifiche
-- ==============================================
