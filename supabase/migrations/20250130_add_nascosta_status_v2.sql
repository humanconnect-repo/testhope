-- Aggiungi 'nascosta' ai valori possibili di status per predictions
-- Versione che aggiunge solo il valore all'enum senza cambiare tipo

-- STEP 1: Rimuovi constraint esistente
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- STEP 2: Aggiungi 'nascosta' all'enum se esiste
DO $$ 
BEGIN
  -- Controlla se esiste il tipo enum prediction_status
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    -- Aggiungi 'nascosta' all'enum se non esiste già
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'nascosta' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prediction_status')
    ) THEN
      -- Aggiungi il valore all'enum
      ALTER TYPE prediction_status ADD VALUE 'nascosta';
    END IF;
  END IF;
END $$;

-- STEP 3: Aspetta un po' per il commit automatico, poi ricrea il constraint
-- Nota: Questa parte va eseguita DOPO che l'enum è stato committato
DO $$ 
BEGIN
  -- Aggiungi il constraint dopo aver aggiunto il valore enum
  ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
    CHECK (status::TEXT IN ('attiva', 'in_attesa', 'in_pausa', 'risolta', 'cancellata', 'nascosta'));
EXCEPTION
  WHEN duplicate_object THEN
    -- Se il constraint esiste già, ignora
    NULL;
END $$;

-- Aggiungi commento
COMMENT ON COLUMN predictions.status IS 'Status della prediction: attiva, in_attesa, in_pausa, risolta, cancellata, nascosta';

