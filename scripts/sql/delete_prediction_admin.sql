-- Funzione per eliminare predictions (solo admin)
CREATE OR REPLACE FUNCTION delete_prediction_admin(
  prediction_id UUID,
  admin_wallet_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin
  SELECT is_admin INTO is_user_admin 
  FROM profiles 
  WHERE wallet_address = admin_wallet_address;
  
  IF NOT is_user_admin THEN 
    RAISE EXCEPTION 'Access denied: Only admins can delete predictions'; 
  END IF;
  
  -- Elimina la prediction
  DELETE FROM predictions WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi permessi di esecuzione
GRANT EXECUTE ON FUNCTION delete_prediction_admin(UUID, TEXT) TO authenticated, anon;
