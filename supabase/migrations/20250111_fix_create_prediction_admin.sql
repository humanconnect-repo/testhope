-- Fix per la funzione create_prediction_admin per includere image_url
-- Eseguire questo script in Supabase SQL Editor

-- 1. Crea o aggiorna la funzione create_prediction_admin
CREATE OR REPLACE FUNCTION create_prediction_admin(
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_bid TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT,
  admin_wallet_address TEXT,
  image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  prediction_id UUID;
  prediction_slug TEXT;
BEGIN
  -- Genera slug dal titolo
  prediction_slug := lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Inserisci la prediction
  INSERT INTO predictions (
    title,
    description,
    slug,
    category,
    closing_date,
    closing_bid,
    status,
    rules,
    image_url,
    created_by
  ) VALUES (
    title,
    description,
    prediction_slug,
    category,
    closing_date,
    closing_bid,
    status,
    rules,
    image_url,
    (SELECT id FROM profiles WHERE wallet_address = admin_wallet_address LIMIT 1)
  ) RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Crea o aggiorna la funzione update_prediction_admin per includere image_url
CREATE OR REPLACE FUNCTION update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_bid TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT,
  image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE predictions SET
    title = title,
    description = description,
    category = category,
    closing_date = closing_date,
    closing_bid = closing_bid,
    status = status,
    rules = rules,
    image_url = image_url,
    updated_at = NOW()
  WHERE id = prediction_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
