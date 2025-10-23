-- Fix per il constraint predictions_status_check
-- Aggiunge "in_attesa" ai valori validi per lo status

-- 1. Rimuovi il constraint esistente
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;

-- 2. Aggiungi il nuovo constraint con tutti gli status validi
ALTER TABLE predictions 
ADD CONSTRAINT predictions_status_check 
CHECK (status IN ('in_attesa', 'attiva', 'in_pausa', 'risolta', 'cancellata'));

-- 3. Verifica che il constraint sia stato applicato correttamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'predictions'::regclass 
AND conname = 'predictions_status_check';

-- 4. Testa il constraint con un update
UPDATE predictions 
SET status = 'in_attesa' 
WHERE id = 'f11b099f-a8c6-4e83-b951-663fd2890754';

-- 5. Verifica che l'update sia andato a buon fine
SELECT id, status, title 
FROM predictions 
WHERE id = 'f11b099f-a8c6-4e83-b951-663fd2890754';
