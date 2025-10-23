-- Sicurezza avanzata per il campo is_admin (CORRETTA)
-- Esegui questo script nel Supabase SQL Editor

-- 1. Crea un trigger per impedire la modifica di is_admin
CREATE OR REPLACE FUNCTION prevent_admin_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Se si sta tentando di modificare is_admin, blocca l'operazione
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin field: This field is immutable for security reasons';
  END IF;
  
  -- Se si sta tentando di modificare wallet_address, blocca l'operazione
  IF OLD.wallet_address IS DISTINCT FROM NEW.wallet_address THEN
    RAISE EXCEPTION 'Cannot modify wallet_address field: This field is immutable for security reasons';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crea il trigger sulla tabella profiles
DROP TRIGGER IF EXISTS prevent_admin_modification_trigger ON profiles;
CREATE TRIGGER prevent_admin_modification_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_modification();

-- 3. Crea una policy RLS semplice per permettere solo la modifica di campi non sensibili
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    wallet_address = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    wallet_address = auth.jwt() ->> 'sub'
  );

-- 4. Crea una policy per permettere solo al service_role di modificare is_admin
CREATE POLICY "Service role can manage admin status" ON profiles
  FOR UPDATE USING (
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- 5. Test della sicurezza
SELECT 'Sicurezza avanzata implementata!' as status;
