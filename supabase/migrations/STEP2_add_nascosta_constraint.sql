-- STEP 2: Ricrea il constraint con 'nascosta' inclusa
-- ESEGUILO DOPO aver fatto STEP1 e aver atteso qualche secondo

-- Ricrea il constraint con tutti i valori inclusa 'nascosta'
ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
  CHECK (status::TEXT IN ('attiva', 'in_attesa', 'in_pausa', 'risolta', 'cancellata', 'nascosta'));

-- Aggiungi commento
COMMENT ON COLUMN predictions.status IS 'Status della prediction: attiva, in_attesa, in_pausa, risolta, cancellata, nascosta';

