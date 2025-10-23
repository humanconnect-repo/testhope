-- Script per implementare sicurezza robusta
-- Eseguire questo script in Supabase SQL Editor

-- 1. RIMUOVI TUTTE LE POLICIES ESISTENTI
DROP POLICY IF EXISTS "Allow all operations on predictions" ON predictions;
DROP POLICY IF EXISTS "Allow all operations on bets" ON bets;
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;

-- 2. RIMUOVI PERMESSI DI MODIFICA SULLE COLONNE SENSIBILI
-- Solo il service role può modificare wallet_address e is_admin
REVOKE UPDATE ON profiles FROM authenticated;
REVOKE UPDATE ON profiles FROM anon;

-- Permetti solo la modifica di nickname, bio, avatar_url
GRANT UPDATE (nickname, bio, avatar_url, signature, updated_at) ON profiles TO authenticated;

-- Il service role mantiene tutti i permessi
GRANT ALL ON profiles TO service_role;

-- 3. POLICIES SICURE PER PROFILES
-- Chiunque può leggere i profili (per mostrare nickname, avatar, etc.)
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Solo l'utente autenticato può modificare il proprio profilo (solo campi permessi)
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    wallet_address = auth.jwt() ->> 'sub'
  ) WITH CHECK (
    wallet_address = auth.jwt() ->> 'sub'
  );

-- Solo il service role può inserire/eliminare profili
CREATE POLICY "Only service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete profiles" ON profiles
  FOR DELETE USING (auth.role() = 'service_role');

-- 4. POLICIES SICURE PER PREDICTIONS
-- Chiunque può leggere le prediction
CREATE POLICY "Anyone can view predictions" ON predictions
  FOR SELECT USING (true);

-- Solo il service role può gestire le prediction
CREATE POLICY "Only service role can manage predictions" ON predictions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. POLICIES SICURE PER BETS
-- Chiunque può leggere le scommesse
CREATE POLICY "Anyone can view bets" ON bets
  FOR SELECT USING (true);

-- Solo il service role può gestire le scommesse
CREATE POLICY "Only service role can manage bets" ON bets
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6. POLICIES SICURE PER COMMENTS
-- Chiunque può leggere i commenti
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

-- Solo il service role può gestire i commenti
CREATE POLICY "Only service role can manage comments" ON comments
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. FUNZIONI SICURE PER L'APP
-- Funzione per verificare se un wallet è admin (solo service role)
CREATE OR REPLACE FUNCTION is_wallet_admin_secure(wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can check admin status';
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.wallet_address = is_wallet_admin_secure.wallet_address 
    AND profiles.is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per creare prediction (solo service role)
CREATE OR REPLACE FUNCTION create_prediction_secure(
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  rules TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  prediction_id UUID;
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can create predictions';
  END IF;
  
  -- Crea la prediction
  INSERT INTO predictions (title, description, category, closing_date, rules)
  VALUES (title, description, category, closing_date, rules)
  RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per aggiornare prediction (solo service role)
CREATE OR REPLACE FUNCTION update_prediction_secure(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can update predictions';
  END IF;
  
  -- Aggiorna la prediction
  UPDATE predictions 
  SET 
    title = update_prediction_secure.title,
    description = update_prediction_secure.description,
    category = update_prediction_secure.category,
    closing_date = update_prediction_secure.closing_date,
    status = update_prediction_secure.status,
    rules = update_prediction_secure.rules,
    updated_at = NOW()
  WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per eliminare prediction (solo service role)
CREATE OR REPLACE FUNCTION delete_prediction_secure(prediction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can delete predictions';
  END IF;
  
  -- Elimina la prediction (cascade eliminerà bets e comments)
  DELETE FROM predictions WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PER PREVENIRE MODIFICHE NON AUTORIZZATE
-- Trigger per prevenire modifiche a wallet_address
CREATE OR REPLACE FUNCTION prevent_wallet_address_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se il wallet_address è cambiato, blocca l'operazione
  IF OLD.wallet_address != NEW.wallet_address THEN
    RAISE EXCEPTION 'Cannot change wallet_address: This field is immutable';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_wallet_address_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_wallet_address_change();

-- Trigger per prevenire modifiche a is_admin (solo service role può modificarla)
CREATE OR REPLACE FUNCTION prevent_is_admin_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se is_admin è cambiato e non è il service role, blocca
  IF OLD.is_admin != NEW.is_admin AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cannot change is_admin: Only service role can modify admin status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_is_admin_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_change();

-- 9. AGGIORNA LA FUNZIONE PER OTTENERE L'ID PROFILO
CREATE OR REPLACE FUNCTION get_profile_id_by_wallet_secure(wallet_address TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can get profile ID';
  END IF;
  
  RETURN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.wallet_address = get_profile_id_by_wallet_secure.wallet_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. VERIFICA CHE TUTTO SIA SICURO
-- Test: prova a modificare is_admin (dovrebbe fallire)
-- UPDATE profiles SET is_admin = false WHERE wallet_address = '0x7504349365e571f3978BDd5304042B3493C03cc4';
-- Dovrebbe dare errore: "Cannot change is_admin: Only service role can modify admin status"

-- Test: prova a modificare wallet_address (dovrebbe fallire)  
-- UPDATE profiles SET wallet_address = '0x123' WHERE wallet_address = '0x7504349365e571f3978BDd5304042B3493C03cc4';
-- Dovrebbe dare errore: "Cannot change wallet_address: This field is immutable"
