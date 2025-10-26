-- Funzione per aggiornare solo le note di una prediction (utile per operazioni admin)
CREATE OR REPLACE FUNCTION update_prediction_notes(
  pool_address TEXT,
  notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Aggiorna solo le note della prediction che ha pool_address corrispondente
  UPDATE predictions 
  SET 
    notes = update_prediction_notes.notes,
    updated_at = NOW()
  WHERE pool_address = update_prediction_notes.pool_address;
  
  -- Verifica se l'aggiornamento è andato a buon fine
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Prediction non trovata per questo pool_address');
  END IF;
  
  -- Restituisci successo
  RETURN json_build_object('success', true, 'message', 'Note aggiornate con successo');
END;
$$;

