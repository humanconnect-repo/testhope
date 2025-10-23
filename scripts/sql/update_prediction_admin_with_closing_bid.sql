-- Aggiorna la funzione update_prediction_admin per includere closing_bid
-- Esegui questo script nel Supabase SQL Editor

-- 1. Aggiorna la funzione per includere closing_bid
CREATE OR REPLACE FUNCTION update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_bid TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT DEFAULT NULL,
  admin_wallet_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin usando il wallet address passato
  SELECT is_admin INTO is_user_admin
  FROM profiles 
  WHERE wallet_address = admin_wallet_address;
  
  -- Se non è admin, nega l'accesso
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can update predictions';
  END IF;
  
  -- Aggiorna la prediction
  UPDATE predictions 
  SET 
    title = update_prediction_admin.title,
    description = update_prediction_admin.description,
    category = update_prediction_admin.category,
    closing_date = update_prediction_admin.closing_date,
    closing_bid = update_prediction_admin.closing_bid,
    status = update_prediction_admin.status,
    rules = update_prediction_admin.rules,
    updated_at = NOW()
  WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 3. Testa la funzione aggiornata
-- SELECT update_prediction_admin(
--   'your-prediction-id'::UUID,
--   'Test Title',
--   'Test Description',
--   'Crypto',
--   NOW() + INTERVAL '7 days',  -- closing_date
--   NOW() + INTERVAL '5 days',  -- closing_bid
--   'attiva',
--   'Test Rules',
--   'your-admin-wallet-address'
-- );
