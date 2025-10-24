-- Fix per le policies di Storage - permettere upload agli admin
-- Eseguire questo script in Supabase SQL Editor

-- 1. Elimina le policies esistenti (se ci sono errori)
DROP POLICY IF EXISTS "Admin upload access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to upload prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update prediction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete prediction images" ON storage.objects;

-- 2. Crea policy per upload (solo admin)
CREATE POLICY "Allow admin users to upload prediction images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 3. Crea policy per aggiornamento (solo admin)
CREATE POLICY "Allow admin users to update prediction images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 4. Crea policy per eliminazione (solo admin)
CREATE POLICY "Allow admin users to delete prediction images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 5. Verifica che il bucket sia pubblico per lettura
UPDATE storage.buckets 
SET public = true
WHERE id = 'prediction-images';
