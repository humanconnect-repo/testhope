-- RPC FUNCTION PER ELIMINAZIONE PREDICTION - SECURITY DEFINER
-- ==========================================================

CREATE OR REPLACE FUNCTION public.delete_prediction_admin(
  prediction_id UUID,
  admin_wallet_address TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_id UUID;
  caller_wallet TEXT;
  caller_is_admin BOOLEAN;
BEGIN
  -- 1) estrai identità da JWT, GUC, o parametro (ordine di preferenza)
  caller_wallet := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'wallet_address',
    current_setting('app.wallet_address', true),
    admin_wallet_address  -- fallback al parametro
  );

  IF caller_wallet IS NULL OR length(caller_wallet) = 0 THEN
    RAISE EXCEPTION 'Unauthorized: missing wallet';
  END IF;

  -- 2) verifica admin
  SELECT is_admin
    INTO caller_is_admin
  FROM profiles
  WHERE wallet_address = caller_wallet;

  IF NOT coalesce(caller_is_admin, false) THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  -- 3) esegui delete
  DELETE FROM predictions
  WHERE id = delete_prediction_admin.prediction_id
  RETURNING id INTO deleted_id;

  IF deleted_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found';
  END IF;

  RETURN deleted_id;
END;
$$;

-- Assicurati che l'owner della funzione sia il proprietario della tabella
ALTER FUNCTION public.delete_prediction_admin(UUID, TEXT) OWNER TO postgres;

-- Dai uso della funzione agli utenti autenticati
GRANT EXECUTE ON FUNCTION delete_prediction_admin(UUID, TEXT) TO authenticated;

SELECT 'RPC Function delete_prediction_admin creata' as status;
