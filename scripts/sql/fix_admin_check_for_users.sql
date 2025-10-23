-- Correzione admin check per utenti normali
-- Esegui questo script nel Supabase SQL Editor

-- 1. Crea una funzione che gli utenti possono chiamare per controllare se sono admin
CREATE OR REPLACE FUNCTION check_my_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wallet TEXT;
  is_admin_result BOOLEAN := FALSE;
BEGIN
  -- Ottieni il wallet address dall'utente autenticato
  user_wallet := auth.jwt() ->> 'sub';
  
  -- Se non c'è wallet, restituisci false
  IF user_wallet IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Controlla se l'utente è admin
  SELECT COALESCE(is_admin, FALSE) INTO is_admin_result
  FROM profiles
  WHERE wallet_address = user_wallet;
  
  RETURN COALESCE(is_admin_result, FALSE);
END;
$$;

-- 2. Crea una funzione per ottenere le prediction che gli utenti possono chiamare
CREATE OR REPLACE FUNCTION get_predictions_for_users()
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  status TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  yes_percentage NUMERIC,
  no_percentage NUMERIC,
  total_bets INTEGER,
  total_amount_bnb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.category,
    p.closing_date,
    p.status,
    p.rules,
    p.created_at,
    p.updated_at,
    p.created_by,
    0::NUMERIC as yes_percentage,
    0::NUMERIC as no_percentage,
    0::INTEGER as total_bets,
    0::NUMERIC as total_amount_bnb
  FROM predictions p
  WHERE p.status = 'attiva'
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION check_my_admin_status() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_predictions_for_users() TO authenticated, anon;

-- 4. Test delle funzioni
SELECT 'Funzioni per utenti create con successo!' as status;
