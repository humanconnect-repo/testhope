-- Aggiungi campo image_url alla tabella predictions
-- Eseguire questo script in Supabase SQL Editor

-- 1. Aggiungi colonna image_url alla tabella predictions
ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Aggiungi commento per documentare il campo
COMMENT ON COLUMN predictions.image_url IS 'URL dell''immagine della prediction salvata in Supabase Storage';

-- 3. Crea indice per performance (opzionale)
CREATE INDEX IF NOT EXISTS idx_predictions_image_url ON predictions(image_url) WHERE image_url IS NOT NULL;
