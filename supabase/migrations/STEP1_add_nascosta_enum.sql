-- STEP 1: Aggiungi 'nascosta' all'enum prediction_status
-- ESEGUILO PRIMA

-- Rimuovi il constraint esistente
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- Aggiungi 'nascosta' all'enum se non esiste
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'nascosta' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prediction_status')
    ) THEN
      ALTER TYPE prediction_status ADD VALUE 'nascosta';
    END IF;
  END IF;
END $$;

