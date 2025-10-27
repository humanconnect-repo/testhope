-- Aggiungi 'nascosta' ai valori possibili di status per predictions
-- Questo script va eseguito in DUE comandi separati per evitare l'errore di commit

-- ========================================
-- PRIMO COMANDO: Aggiungi il valore all'enum (se esiste)
-- ========================================

-- Rimuovi il vecchio constraint
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- Aggiungi 'nascosta' all'enum se esiste
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nascosta' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prediction_status')) THEN
      ALTER TYPE prediction_status ADD VALUE 'nascosta';
    END IF;
  END IF;
END $$;

-- ========================================
-- SECONDO COMANDO: Esegui questo DOPO aver eseguito il primo e aver fatto COMMIT
-- ========================================

-- Ricrea il constraint con tutti i valori (includendo 'nascosta')
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prediction_status') THEN
    -- Usa l'enum se esiste
    ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
      CHECK (status::text IN ('attiva', 'in_attesa', 'in_pausa', 'risolta', 'cancellata', 'nascosta'));
  ELSE
    -- Usa TEXT direttamente
    ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
      CHECK (status IN ('attiva', 'in_attesa', 'in_pausa', 'risolta', 'cancellata', 'nascosta'));
  END IF;
EXCEPTION
  WHEN others THEN
    -- Se il constraint esiste già, ignora
    NULL;
END $$;

-- Aggiungi commento
COMMENT ON COLUMN predictions.status IS 'Status della prediction: attiva, in_attesa, in_pausa, risolta, cancellata, nascosta';

