-- Fix semplice per Storage - rimuovi tutte le policies e ricreale
-- Eseguire questo script in Supabase SQL Editor

-- 1. Elimina TUTTE le policies esistenti per storage.objects
DROP POLICY IF EXISTS "Public read access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to upload prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete prediction images" ON storage.objects;

-- 2. Crea policy semplice per lettura pubblica
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'prediction-images');

-- 3. Crea policy semplice per upload (tutti gli utenti autenticati)
CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prediction-images' AND
  auth.role() = 'authenticated'
);

-- 4. Crea policy semplice per update (tutti gli utenti autenticati)
CREATE POLICY "Authenticated update access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prediction-images' AND
  auth.role() = 'authenticated'
);

-- 5. Crea policy semplice per delete (tutti gli utenti autenticati)
CREATE POLICY "Authenticated delete access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prediction-images' AND
  auth.role() = 'authenticated'
);

-- 6. Verifica che il bucket esista e sia pubblico
INSERT INTO storage.buckets (id, name, public)
VALUES ('prediction-images', 'prediction-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
