-- Aggiorna la funzione update_prediction_admin per includere il campo notes
CREATE OR REPLACE FUNCTION update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  closing_bid TIMESTAMPTZ,
  status TEXT,
  rules TEXT,
  image_url TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Aggiorna la prediction
  UPDATE predictions 
  SET 
    title = update_prediction_admin.title,
    description = update_prediction_admin.description,
    category = update_prediction_admin.category,
    closing_date = update_prediction_admin.closing_date,
    closing_bid = update_prediction_admin.closing_bid,
    status = update_prediction_admin.status::prediction_status,
    rules = update_prediction_admin.rules,
    image_url = update_prediction_admin.image_url,
    notes = update_prediction_admin.notes,
    updated_at = NOW()
  WHERE id = prediction_id;
  
  -- Verifica se l'aggiornamento è andato a buon fine
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Prediction non trovata');
  END IF;
  
  -- Restituisci successo
  RETURN json_build_object('success', true, 'message', 'Prediction aggiornata con successo');
END;
$$;
