-- Fix policy DELETE per profiles
DROP POLICY IF EXISTS "profiles_web3_delete" ON profiles;

-- Policy DELETE che blocca TUTTI (solo service role può eliminare)
CREATE POLICY "profiles_web3_delete" ON profiles
FOR DELETE USING (false);

-- Verifica la policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_web3_delete';
