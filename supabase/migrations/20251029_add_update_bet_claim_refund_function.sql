-- Funzione per aggiornare claim_tx_hash (refund) di una bet esistente
-- Sicura (SECURITY DEFINER), valida input, e ritorna la riga aggiornata

CREATE OR REPLACE FUNCTION update_bet_claim_refund(
  p_user_id UUID,
  p_prediction_id UUID,
  p_claim_tx_hash TEXT
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  prediction_id UUID,
  claim_tx_hash TEXT
) AS $$
BEGIN
  IF p_user_id IS NULL OR p_prediction_id IS NULL OR p_claim_tx_hash IS NULL THEN
    RAISE EXCEPTION 'Parametri mancanti';
  END IF;

  -- Valida il formato del claim_tx_hash (66 caratteri: 0x + 64 hex)
  IF LENGTH(p_claim_tx_hash) != 66 OR p_claim_tx_hash !~ '^0x[0-9a-fA-F]{64}$' THEN
    RAISE EXCEPTION 'Formato claim_tx_hash non valido: deve essere 0x seguito da 64 caratteri esadecimali';
  END IF;

  RETURN QUERY
  UPDATE bets
  SET claim_tx_hash = p_claim_tx_hash
  WHERE user_id = p_user_id
    AND prediction_id = p_prediction_id
  RETURNING bets.id, bets.user_id, bets.prediction_id, bets.claim_tx_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION update_bet_claim_refund(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_bet_claim_refund(UUID, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION update_bet_claim_refund IS 'Aggiorna claim_tx_hash (refund) per una bet cercando per user_id e prediction_id; valida input e ritorna la riga aggiornata.';


