-- Configurazione Supabase Storage per immagini prediction
-- Eseguire questo script in Supabase SQL Editor

-- 1. Crea il bucket per le immagini prediction (se non esiste)
INSERT INTO storage.buckets (id, name, public)
VALUES ('prediction-images', 'prediction-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy per permettere lettura pubblica delle immagini
CREATE POLICY "Public read access for prediction images"
ON storage.objects FOR SELECT
USING (bucket_id = 'prediction-images');

-- 3. Policy per permettere upload solo agli admin
CREATE POLICY "Admin upload access for prediction images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 4. Policy per permettere aggiornamento solo agli admin
CREATE POLICY "Admin update access for prediction images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 5. Policy per permettere eliminazione solo agli admin
CREATE POLICY "Admin delete access for prediction images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prediction-images' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE is_admin = true
  )
);

-- 6. Imposta dimensioni massime file (5MB)
UPDATE storage.buckets 
SET file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'prediction-images';
