-- RPC FUNCTION PER CREAZIONE PREDICTION - SECURITY DEFINER
-- ========================================================

CREATE OR REPLACE FUNCTION public.create_prediction_admin(
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  closing_bid TIMESTAMPTZ,
  status TEXT,
  rules TEXT,
  admin_wallet_address TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
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

  -- 3) esegui insert
  INSERT INTO predictions (
    title,
    description,
    category,
    closing_date,
    closing_bid,
    status,
    rules
  ) VALUES (
    create_prediction_admin.title,
    create_prediction_admin.description,
    create_prediction_admin.category,
    create_prediction_admin.closing_date,
    create_prediction_admin.closing_bid,
    create_prediction_admin.status,
    create_prediction_admin.rules
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Assicurati che l'owner della funzione sia il proprietario della tabella
ALTER FUNCTION public.create_prediction_admin(TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) OWNER TO postgres;

-- Dai uso della funzione agli utenti autenticati
GRANT EXECUTE ON FUNCTION create_prediction_admin(TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO authenticated;

SELECT 'RPC Function create_prediction_admin creata' as status;
