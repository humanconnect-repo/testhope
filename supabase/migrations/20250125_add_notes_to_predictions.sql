-- Aggiungi campo notes alla tabella predictions
ALTER TABLE predictions 
ADD COLUMN notes TEXT;

-- Aggiungi commento al campo
COMMENT ON COLUMN predictions.notes IS 'Note e aggiornamenti per la prediction';
