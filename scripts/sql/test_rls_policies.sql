-- Test delle RLS Policies per verificare la sicurezza
-- Esegui questo script nel Supabase SQL Editor

-- 1. Verifica le policy esistenti
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('predictions', 'profiles')
ORDER BY tablename, policyname;

-- 2. Test: Verifica se un utente non-admin può leggere predictions
-- (Questo dovrebbe funzionare)
SELECT 'Test lettura predictions' as test_name;
SELECT id, title, status FROM predictions LIMIT 1;

-- 3. Test: Verifica se un utente non-admin può modificare predictions
-- (Questo dovrebbe fallire)
SELECT 'Test modifica predictions (dovrebbe fallire)' as test_name;
-- NOTA: Questo test fallirà se le RLS policies sono configurate correttamente
-- UPDATE predictions SET title = 'HACKED' WHERE id = (SELECT id FROM predictions LIMIT 1);

-- 4. Test: Verifica se un utente non-admin può creare predictions
-- (Questo dovrebbe fallire)
SELECT 'Test creazione predictions (dovrebbe fallire)' as test_name;
-- NOTA: Questo test fallirà se le RLS policies sono configurate correttamente
-- INSERT INTO predictions (title, description, category, closing_date, status) 
-- VALUES ('HACKED PREDICTION', 'Test', 'Crypto', NOW(), 'attiva');

-- 5. Verifica le funzioni RPC esistenti
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%prediction%' 
  AND routine_schema = 'public'
ORDER BY routine_name;

-- 6. Test: Verifica la funzione update_prediction_admin
SELECT 'Test funzione update_prediction_admin' as test_name;
-- Questa query mostrerà se la funzione esiste e i suoi parametri
SELECT 
  p.proname as function_name,
  p.proargnames as parameter_names,
  pg_get_function_arguments(p.oid) as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_prediction_admin'
  AND n.nspname = 'public';

-- 7. Verifica i permessi sulla funzione
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'update_prediction_admin';

-- 8. Test: Simula un tentativo di accesso non autorizzato
-- (Questo dovrebbe fallire se le RLS policies sono attive)
SELECT 'Test accesso non autorizzato' as test_name;
-- NOTA: Questo test mostrerà se le RLS policies bloccano l'accesso
-- SELECT * FROM predictions WHERE id = 'fake-id';

-- 9. Verifica le policy di sicurezza per le tabelle
SELECT 
  t.table_name,
  t.table_type,
  CASE 
    WHEN t.table_name IN (
      SELECT DISTINCT tablename 
      FROM pg_policies 
      WHERE tablename = t.table_name
    ) THEN 'HAS_RLS_POLICIES'
    ELSE 'NO_RLS_POLICIES'
  END as rls_status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN ('predictions', 'profiles', 'bets', 'comments')
ORDER BY t.table_name;

-- 10. Test finale: Verifica che solo gli admin possano modificare
SELECT 'Test finale: Verifica sicurezza admin' as test_name;
-- Questo dovrebbe mostrare solo gli utenti admin
SELECT 
  wallet_address,
  is_admin,
  nickname
FROM profiles 
WHERE is_admin = true
ORDER BY created_at DESC;
