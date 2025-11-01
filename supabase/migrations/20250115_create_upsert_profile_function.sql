-- Funzione per creare o aggiornare un profilo utente
-- Usa SECURITY DEFINER per bypassare le RLS policies
-- Necessaria perché l'app usa wallet-based auth (non Supabase auth)
-- SET search_path per sicurezza: previene attacchi di search_path hijacking

-- Elimina la funzione esistente se presente
DROP FUNCTION IF EXISTS upsert_profile(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION upsert_profile(
  wallet_addr TEXT,
  user_name TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL,
  signature_param TEXT DEFAULT NULL,
  nonce_param TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_id_val UUID;
  existing_id UUID;
BEGIN
  -- Normalizza l'indirizzo wallet (lowercase, trim)
  wallet_addr := LOWER(TRIM(wallet_addr));
  
  -- Verifica che wallet_addr sia fornito
  IF wallet_addr IS NULL OR wallet_addr = '' THEN
    RAISE EXCEPTION 'Wallet address non può essere vuoto';
  END IF;

  -- Cerca se esiste già un profilo con questo wallet address
  SELECT id INTO existing_id
  FROM profiles 
  WHERE LOWER(TRIM(wallet_address)) = wallet_addr
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    -- Aggiorna il profilo esistente
    profile_id_val := existing_id;
    
    UPDATE profiles
    SET 
      username = COALESCE(user_name, username),
      avatar_url = COALESCE(avatar_url_param, avatar_url),
      signature = COALESCE(signature_param, signature),
      nonce = COALESCE(nonce_param, nonce),
      updated_at = NOW()
    WHERE id = profile_id_val;
  ELSE
    -- Crea un nuovo profilo
    INSERT INTO profiles (
      id,
      wallet_address,
      username,
      avatar_url,
      signature,
      nonce,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      wallet_addr,
      user_name,
      avatar_url_param,
      signature_param,
      nonce_param,
      NOW(),
      NOW()
    ) RETURNING id INTO profile_id_val;
  END IF;
  
  RETURN profile_id_val;
END;
$$;

-- Concedi i permessi di esecuzione ai ruoli anon e authenticated
GRANT EXECUTE ON FUNCTION upsert_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

