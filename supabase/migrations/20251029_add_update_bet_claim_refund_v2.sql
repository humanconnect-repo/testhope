-- Versione V2: più robusta sui tipi, search_path esplicito e permessi estesi

CREATE OR REPLACE FUNCTION public.update_bet_claim_refund_v2(
  p_user_id TEXT,
  p_prediction_id TEXT,
  p_claim_tx_hash TEXT
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  prediction_id UUID,
  claim_tx_hash TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE
  v_user_id UUID;
  v_prediction_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_prediction_id IS NULL OR p_claim_tx_hash IS NULL THEN
    RAISE EXCEPTION 'Parametri mancanti';
  END IF;

  -- Cast sicuro
  BEGIN
    v_user_id := p_user_id::uuid;
    v_prediction_id := p_prediction_id::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Parametri UUID non validi';
  END;

  -- Valida hash 0x + 64 hex
  IF LENGTH(p_claim_tx_hash) != 66 OR p_claim_tx_hash !~ '^0x[0-9a-fA-F]{64}$' THEN
    RAISE EXCEPTION 'Formato claim_tx_hash non valido: deve essere 0x seguito da 64 caratteri esadecimali';
  END IF;

  RETURN QUERY
  UPDATE public.bets
  SET claim_tx_hash = p_claim_tx_hash
  WHERE user_id = v_user_id
    AND prediction_id = v_prediction_id
  RETURNING bets.id, bets.user_id, bets.prediction_id, bets.claim_tx_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.update_bet_claim_refund_v2(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_bet_claim_refund_v2(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_bet_claim_refund_v2(TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_bet_claim_refund_v2 IS 'Aggiorna claim_tx_hash (refund) usando TEXT con cast a UUID; search_path public; EXECUTE per anon+authenticated.';


