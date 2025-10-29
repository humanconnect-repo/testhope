-- Funzione per aggiornare claim_winning_tx_hash e winning_rewards_amount di una bet esistente
-- Usa SECURITY DEFINER per bypassare le RLS policies
-- SET search_path per sicurezza: previene attacchi di search_path hijacking

-- Elimina tutte le versioni esistenti della funzione se presente
DROP FUNCTION IF EXISTS update_bet_claim_winnings(UUID, TEXT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS update_bet_claim_winnings(UUID, TEXT, NUMERIC, UUID);
DROP FUNCTION IF EXISTS update_bet_claim_winnings(UUID, TEXT, NUMERIC, TEXT, UUID);
-- Elimina anche la versione senza parametri opzionali se esiste
DROP FUNCTION IF EXISTS update_bet_claim_winnings CASCADE;

CREATE OR REPLACE FUNCTION update_bet_claim_winnings(
  bet_uuid UUID,
  claim_tx_hash_param TEXT,
  winning_rewards_amount_value NUMERIC,
  caller_wallet TEXT DEFAULT NULL,
  caller_user_id UUID DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_bet_id UUID;
  profile_id_val UUID;
BEGIN
  -- Se caller_user_id è fornito, usalo direttamente, altrimenti cerca per wallet
  IF caller_user_id IS NOT NULL THEN
    profile_id_val := caller_user_id;
    
    -- Verifica che il user_id esista nei profili
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = profile_id_val) THEN
      RAISE EXCEPTION 'User ID non trovato nei profili: %', caller_user_id;
    END IF;
  ELSIF caller_wallet IS NOT NULL THEN
    -- Verifica che il wallet address corrisponda a un profilo
    SELECT id INTO profile_id_val
    FROM profiles 
    WHERE LOWER(TRIM(wallet_address)) = LOWER(TRIM(caller_wallet))
    LIMIT 1;
    
    IF profile_id_val IS NULL THEN
      RAISE EXCEPTION 'Wallet address non trovato nei profili: %', caller_wallet;
    END IF;
  ELSE
    RAISE EXCEPTION 'Deve essere fornito caller_wallet o caller_user_id';
  END IF;
  
  -- Verifica che la bet esista e appartenga all'utente
  IF NOT EXISTS (
    SELECT 1 FROM bets b
    WHERE b.id = bet_uuid 
    AND b.user_id = profile_id_val
  ) THEN
    RAISE EXCEPTION 'Bet non trovata o non appartiene all''utente (bet_id: %, user_id: %)', bet_uuid, profile_id_val;
  END IF;
  
  -- Valida il formato del claim_tx_hash (66 caratteri: 0x + 64 hex)
  IF claim_tx_hash_param IS NOT NULL AND (LENGTH(claim_tx_hash_param) != 66 OR claim_tx_hash_param !~ '^0x[0-9a-fA-F]{64}$') THEN
    RAISE EXCEPTION 'Formato claim_tx_hash non valido: deve essere 0x seguito da 64 caratteri esadecimali';
  END IF;
  
  -- Valida che winning_rewards_amount sia positivo se non NULL
  IF winning_rewards_amount_value IS NOT NULL AND winning_rewards_amount_value < 0 THEN
    RAISE EXCEPTION 'winning_rewards_amount non può essere negativo';
  END IF;
  
  -- Aggiorna il claim_winning_tx_hash e winning_rewards_amount
  UPDATE bets b
  SET 
    claim_winning_tx_hash = claim_tx_hash_param,
    winning_rewards_amount = winning_rewards_amount_value
  WHERE b.id = bet_uuid
  AND b.user_id = profile_id_val
  RETURNING b.id INTO updated_bet_id;
  
  IF updated_bet_id IS NULL THEN
    RAISE EXCEPTION 'Impossibile aggiornare la bet. Verifica che esista e appartenga all''utente.';
  END IF;
  
  RETURN updated_bet_id;
END;
$$;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION update_bet_claim_winnings TO authenticated, anon;

-- Commento descrittivo
COMMENT ON FUNCTION update_bet_claim_winnings IS 'Aggiorna il claim_winning_tx_hash e winning_rewards_amount di una bet esistente. Verifica che la bet appartenga all''utente specificato.';

