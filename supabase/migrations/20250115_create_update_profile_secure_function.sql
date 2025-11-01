-- Funzione per aggiornare un profilo utente esistente in modo sicuro
-- Usa SECURITY DEFINER per bypassare le RLS policies
-- Verifica che il chiamante sia il proprietario del profilo
-- Necessaria perché l'app usa wallet-based auth (non Supabase auth)
-- SET search_path per sicurezza: previene attacchi di search_path hijacking

-- Elimina la funzione esistente se presente
DROP FUNCTION IF EXISTS update_profile_secure(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_profile_secure(
  p_wallet_address TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_caller_wallet TEXT DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profile_id_val UUID;
  normalized_wallet TEXT;
  normalized_caller TEXT;
BEGIN
  -- Normalizza gli indirizzi wallet (lowercase, trim)
  normalized_wallet := LOWER(TRIM(p_wallet_address));
  normalized_caller := LOWER(TRIM(p_caller_wallet));
  
  -- Verifica che wallet_address sia fornito
  IF normalized_wallet IS NULL OR normalized_wallet = '' THEN
    RAISE EXCEPTION 'Wallet address non può essere vuoto';
  END IF;

  -- SICUREZZA: Verifica che il chiamante sia il proprietario del profilo
  IF normalized_caller IS NULL OR normalized_caller = '' THEN
    RAISE EXCEPTION 'caller_wallet deve essere fornito per sicurezza';
  END IF;

  IF normalized_wallet != normalized_caller THEN
    RAISE EXCEPTION 'Solo il proprietario può modificare il proprio profilo';
  END IF;

  -- Cerca il profilo esistente
  SELECT id INTO profile_id_val
  FROM profiles 
  WHERE LOWER(TRIM(wallet_address)) = normalized_wallet
  LIMIT 1;
  
  IF profile_id_val IS NULL THEN
    RAISE EXCEPTION 'Profilo non trovato per wallet address: %', normalized_wallet;
  END IF;

  -- Aggiorna solo i campi forniti (non NULL)
  UPDATE profiles
  SET 
    username = COALESCE(p_nickname, username),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    updated_at = NOW()
  WHERE id = profile_id_val;
  
  RETURN profile_id_val;
END;
$$;

-- Concedi i permessi di esecuzione ai ruoli anon e authenticated
GRANT EXECUTE ON FUNCTION update_profile_secure(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

