-- RLS Policies per Supabase Storage - Bucket avatar
-- Ogni utente può caricare/modificare solo i propri file

-- Prima rimuovi le policies esistenti per il bucket avatar
DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files can be uploaded by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files can be updated by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files can be deleted by anyone" ON storage.objects;

-- Crea policies per il bucket avatar
-- 1. Chiunque può leggere i file (per visualizzazione pubblica)
CREATE POLICY "Avatar files are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatar');

-- 2. Solo il proprietario può caricare file nel proprio folder
-- Il path deve essere: avatar/{wallet_address}/filename
CREATE POLICY "Avatar files can be uploaded by owner" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatar' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Solo il proprietario può aggiornare i propri file
CREATE POLICY "Avatar files can be updated by owner" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatar' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Solo il proprietario può eliminare i propri file
CREATE POLICY "Avatar files can be deleted by owner" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatar' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Verifica che RLS sia abilitato per storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Mostra le policies create per storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
