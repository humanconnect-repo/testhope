-- RPC FUNCTION SICURA - SECURITY DEFINER
-- ======================================

-- 1. Funzione helper per ottenere wallet utente
CREATE OR REPLACE FUNCTION public.current_wallet()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'wallet_address',
    current_setting('app.wallet_address', true)
  )
$$;

-- 2. RPC function sicura (non accetta admin_wallet_address come input)
CREATE OR REPLACE FUNCTION public.update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  closing_bid TIMESTAMPTZ,
  status TEXT,
  rules TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER              -- <== gira come owner, bypass RLS
SET search_path = public      -- <== importante per evitare hijack via path
AS $$
DECLARE
  updated_id UUID;
  caller_wallet TEXT;
  caller_is_admin BOOLEAN;
BEGIN
  -- 1) estrai identità da JWT o GUC (ordine di preferenza)
  caller_wallet := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'wallet_address',
    current_setting('app.wallet_address', true)  -- fallback via GUC
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

  -- 3) esegui update
  UPDATE predictions
  SET
    title        = update_prediction_admin.title,
    description  = update_prediction_admin.description,
    category     = update_prediction_admin.category,
    closing_date = update_prediction_admin.closing_date,
    closing_bid  = update_prediction_admin.closing_bid,
    rules        = update_prediction_admin.rules,
    status       = update_prediction_admin.status,
    updated_at   = NOW()
  WHERE id = update_prediction_admin.prediction_id
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found';
  END IF;

  RETURN updated_id;
END;
$$;

-- 3. Assicurati che l'owner della funzione sia il proprietario della tabella
ALTER FUNCTION public.update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) OWNER TO postgres;

-- 4. Dai uso della funzione agli utenti autenticati
GRANT EXECUTE ON FUNCTION update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

SELECT 'RPC Function sicura creata - SECURITY DEFINER' as status;
