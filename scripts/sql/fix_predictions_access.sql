-- =====================================================
-- FIX PREDICTIONS ACCESS - Ripristina accesso lettura
-- =====================================================

-- Rimuovi policy esistenti per predictions
DROP POLICY IF EXISTS "Only service role can manage predictions" ON predictions;
DROP POLICY IF EXISTS "Anyone can view predictions" ON predictions;

-- Crea policy per permettere a tutti di leggere predictions
CREATE POLICY "Anyone can view predictions" ON predictions
FOR SELECT USING (true);

-- Crea policy per permettere solo service role di modificare
CREATE POLICY "Only service role can manage predictions" ON predictions
FOR ALL USING ((select auth.role()) = 'service_role');

-- Verifica le policy create
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'predictions'
ORDER BY policyname;

-- Test di accesso
SELECT 'Predictions access fixed!' as status;
