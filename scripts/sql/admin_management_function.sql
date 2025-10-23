-- Funzione per gestire gli admin (solo service role)
-- Esegui questo script nel Supabase SQL Editor

-- 1. Funzione per promuovere un utente ad admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can manage admin status';
  END IF;
  
  -- Aggiorna lo status admin
  UPDATE profiles 
  SET is_admin = true 
  WHERE wallet_address = target_wallet_address;
  
  -- Verifica che l'aggiornamento sia avvenuto
  IF FOUND THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'User not found with wallet address: %', target_wallet_address;
  END IF;
END;
$$;

-- 2. Funzione per rimuovere admin status
CREATE OR REPLACE FUNCTION remove_admin_status(target_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo il service role può chiamare questa funzione
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only service role can manage admin status';
  END IF;
  
  -- Aggiorna lo status admin
  UPDATE profiles 
  SET is_admin = false 
  WHERE wallet_address = target_wallet_address;
  
  -- Verifica che l'aggiornamento sia avvenuto
  IF FOUND THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'User not found with wallet address: %', target_wallet_address;
  END IF;
END;
$$;

-- 3. Concedi permessi solo al service role
GRANT EXECUTE ON FUNCTION promote_to_admin(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION remove_admin_status(TEXT) TO service_role;

-- 4. Test delle funzioni
SELECT 'Funzioni di gestione admin create!' as status;
