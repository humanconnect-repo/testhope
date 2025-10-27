-- Aggiungi 'risolta' ai valori possibili di status per predictions

-- Prima rimuovi il vecchio constraint se esiste
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- Se esiste un tipo ENUM, aggiungi 'risolta' ad esso
DO $$ 
BEGIN
  -- Controlla se esiste il tipo enum prediction_status
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    -- Aggiungi 'risolta' all'enum se non esiste già
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'risolta' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prediction_status')) THEN
      ALTER TYPE prediction_status ADD VALUE IF NOT EXISTS 'risolta';
    END IF;
  END IF;
END $$;

-- Aggiungi il nuovo constraint con tutti i valori possibili (usato se non c'è l'ENUM)
ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
  CHECK (status IN ('attiva', 'in_attesa', 'in_pausa', 'risolta', 'cancellata'));
