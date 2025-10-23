-- Aggiunge la colonna closing_bid alla tabella predictions
-- Esegui questo script nel Supabase SQL Editor

-- 1. Aggiungi la colonna closing_bid
ALTER TABLE predictions 
ADD COLUMN closing_bid TIMESTAMP WITH TIME ZONE;

-- 2. Aggiungi un commento per spiegare la differenza
COMMENT ON COLUMN predictions.closing_bid IS 'Data e ora entro cui si può scommettere (diversa da closing_date che è la chiusura della prediction)';
COMMENT ON COLUMN predictions.closing_date IS 'Data e ora di chiusura della prediction (diversa da closing_bid che è la scadenza scommesse)';

-- 3. Aggiorna le predictions esistenti impostando closing_bid = closing_date per ora
-- (puoi modificare questo comportamento se necessario)
UPDATE predictions 
SET closing_bid = closing_date 
WHERE closing_bid IS NULL;

-- 4. Verifica che la colonna sia stata aggiunta correttamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'predictions' 
  AND column_name IN ('closing_date', 'closing_bid')
ORDER BY column_name;

-- 5. Mostra le predictions con i nuovi campi
SELECT 
  id,
  title,
  closing_date,
  closing_bid,
  status,
  created_at
FROM predictions 
ORDER BY created_at DESC 
LIMIT 5;
