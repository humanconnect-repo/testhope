-- Correzione admin check con parametro wallet
-- Esegui questo script nel Supabase SQL Editor

-- 1. Crea una funzione che accetta il wallet address come parametro
CREATE OR REPLACE FUNCTION check_wallet_admin_status(wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_result BOOLEAN := FALSE;
BEGIN
  -- Se non c'è wallet, restituisci false
  IF wallet_address IS NULL OR wallet_address = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Controlla se il wallet è admin
  SELECT COALESCE(is_admin, FALSE) INTO is_admin_result
  FROM profiles
  WHERE wallet_address = check_wallet_admin_status.wallet_address;
  
  RETURN COALESCE(is_admin_result, FALSE);
END;
$$;

-- 2. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION check_wallet_admin_status(TEXT) TO authenticated, anon;

-- 3. Test della funzione
SELECT 'Funzione admin check con parametro creata con successo!' as status;
