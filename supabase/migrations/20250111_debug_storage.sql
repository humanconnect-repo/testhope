-- Debug Storage - controlla stato policies e bucket
-- Eseguire questo script in Supabase SQL Editor

-- 1. Controlla se il bucket esiste
SELECT * FROM storage.buckets WHERE id = 'prediction-images';

-- 2. Controlla tutte le policies per storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Controlla se l'utente è autenticato (sostituisci con il tuo user ID)
SELECT auth.uid() as current_user_id;

-- 4. Controlla se l'utente è admin
SELECT id, is_admin FROM profiles WHERE id = auth.uid();

-- 5. Se il bucket non esiste, crealo
INSERT INTO storage.buckets (id, name, public)
VALUES ('prediction-images', 'prediction-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Elimina TUTTE le policies e ricreale da zero
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

-- 7. Ricrea policies molto semplici
CREATE POLICY "Allow all authenticated users to read"
ON storage.objects FOR SELECT
USING (bucket_id = 'prediction-images');

CREATE POLICY "Allow all authenticated users to insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prediction-images');

CREATE POLICY "Allow all authenticated users to update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prediction-images');

CREATE POLICY "Allow all authenticated users to delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'prediction-images');
