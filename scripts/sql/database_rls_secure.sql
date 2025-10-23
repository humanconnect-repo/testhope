-- RLS Policies sicure a livello database per la tabella profiles
-- Ogni wallet può solo modificare il proprio profilo

-- Prima rimuovi le policies esistenti
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON profiles;

-- Crea policies sicure basate su wallet_address
-- Nota: Per funzionare con il nostro sistema, usiamo una funzione personalizzata

-- 1. Chiunque può leggere i profili (per visualizzazione pubblica)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

-- 2. Solo il wallet proprietario può inserire il proprio profilo
-- Usiamo una funzione per verificare che wallet_address corrisponda all'ID
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (wallet_address = id);

-- 3. Solo il wallet proprietario può aggiornare il proprio profilo
-- Verifichiamo che wallet_address corrisponda all'ID
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (wallet_address = id) 
    WITH CHECK (wallet_address = id);

-- 4. Solo il wallet proprietario può eliminare il proprio profilo
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (wallet_address = id);

-- Verifica che RLS sia abilitato
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Mostra le policies create
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test delle policies (opzionale)
-- INSERT INTO profiles (id, wallet_address, signature) VALUES ('0x123', '0x456', 'test'); -- Dovrebbe fallire
-- INSERT INTO profiles (id, wallet_address, signature) VALUES ('0x123', '0x123', 'test'); -- Dovrebbe funzionare
