-- Funzione per aggiornare solo lo status di una prediction
CREATE OR REPLACE FUNCTION update_prediction_status(
  prediction_id_param UUID,
  new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Aggiorna solo lo status della prediction
  UPDATE predictions 
  SET 
    status = new_status::prediction_status,
    updated_at = NOW()
  WHERE id = prediction_id_param;
  
  -- Verifica se l'aggiornamento è andato a buon fine
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Prediction non trovata');
  END IF;
  
  -- Restituisci successo
  RETURN json_build_object('success', true, 'message', 'Status aggiornato con successo');
END;
$$;

