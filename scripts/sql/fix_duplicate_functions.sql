-- Script per risolvere il conflitto delle funzioni duplicate update_prediction_admin
-- Esegui questo script nel Supabase SQL Editor

-- 1. Prima verifichiamo quante funzioni ci sono
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as full_signature,
  p.oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_prediction_admin'
  AND n.nspname = 'public'
ORDER BY p.oid;

-- 2. Rimuoviamo TUTTE le funzioni esistenti
DROP FUNCTION IF EXISTS update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);

-- 3. Ricreiamo SOLO la versione con closing_bid (versione corretta)
CREATE OR REPLACE FUNCTION update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_bid TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT,
  admin_wallet_address TEXT
)
RETURNS BOOLEAN
AS $$
DECLARE
  is_admin BOOLEAN;
  prediction_exists BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin
  SELECT check_wallet_admin_status(admin_wallet_address) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Accesso negato: solo gli admin possono aggiornare le prediction';
  END IF;
  
  -- Verifica che la prediction esista
  SELECT EXISTS(SELECT 1 FROM predictions WHERE id = prediction_id) INTO prediction_exists;
  
  IF NOT prediction_exists THEN
    RAISE EXCEPTION 'Prediction non trovata con ID: %', prediction_id;
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
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO authenticated, anon;

-- 5. Verifica che sia stata creata correttamente
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_prediction_admin'
  AND n.nspname = 'public';

-- 6. Test della funzione (opzionale - sostituisci con un ID reale)
-- SELECT update_prediction_admin(
--   'your-prediction-id'::UUID,
--   'Test Title',
--   'Test Description',
--   'Test Category',
--   NOW() + INTERVAL '1 day',
--   NOW() + INTERVAL '1 hour',
--   'attiva',
--   'Test Rules',
--   'your-admin-wallet-address'
-- );
