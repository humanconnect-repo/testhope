-- Script per correggere le RLS policies per il sistema Web3
-- Eseguire questo script in Supabase SQL Editor

-- 1. Disabilita temporaneamente RLS per aggiornare le policies
ALTER TABLE predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 2. Rimuovi le policies esistenti
DROP POLICY IF EXISTS "Anyone can view predictions" ON predictions;
DROP POLICY IF EXISTS "Only admins can insert predictions" ON predictions;
DROP POLICY IF EXISTS "Only admins can update predictions" ON predictions;
DROP POLICY IF EXISTS "Only admins can delete predictions" ON predictions;

DROP POLICY IF EXISTS "Users can view all bets" ON bets;
DROP POLICY IF EXISTS "Users can insert their own bets" ON bets;
DROP POLICY IF EXISTS "Users can update their own bets" ON bets;
DROP POLICY IF EXISTS "Users can delete their own bets" ON bets;

DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- 3. Riabilita RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. Crea nuove policies per il sistema Web3
-- Per ora permettiamo tutto (per test), poi implementeremo la logica Web3

-- Policies per predictions - PERMETTERE TUTTO PER TEST
CREATE POLICY "Allow all operations on predictions" ON predictions
  FOR ALL USING (true) WITH CHECK (true);

-- Policies per bets - PERMETTERE TUTTO PER TEST  
CREATE POLICY "Allow all operations on bets" ON bets
  FOR ALL USING (true) WITH CHECK (true);

-- Policies per comments - PERMETTERE TUTTO PER TEST
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Crea una funzione per verificare se un wallet è admin
CREATE OR REPLACE FUNCTION is_wallet_admin(wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.wallet_address = is_wallet_admin.wallet_address 
    AND profiles.is_admin = true
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Crea una funzione per ottenere l'ID profilo da wallet address
CREATE OR REPLACE FUNCTION get_profile_id_by_wallet(wallet_address TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.wallet_address = get_profile_id_by_wallet.wallet_address
  );
END;
$$ LANGUAGE plpgsql;