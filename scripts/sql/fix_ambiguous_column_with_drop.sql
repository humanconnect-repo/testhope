-- Correzione colonna ambigua nella funzione admin check
-- Esegui questo script nel Supabase SQL Editor

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS check_wallet_admin_status(text);

-- 2. Crea una funzione corretta senza ambiguità
CREATE OR REPLACE FUNCTION check_wallet_admin_status(input_wallet_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_result BOOLEAN := FALSE;
BEGIN
  -- Se non c'è wallet, restituisci false
  IF input_wallet_address IS NULL OR input_wallet_address = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Controlla se il wallet è admin (usando alias per evitare ambiguità)
  SELECT COALESCE(p.is_admin, FALSE) INTO is_admin_result
  FROM profiles p
  WHERE p.wallet_address = input_wallet_address;
  
  RETURN COALESCE(is_admin_result, FALSE);
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION check_wallet_admin_status(TEXT) TO authenticated, anon;

-- 4. Test della funzione
SELECT 'Funzione admin check corretta creata con successo!' as status;
