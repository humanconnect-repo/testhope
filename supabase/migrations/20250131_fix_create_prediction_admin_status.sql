-- Fix per creare la funzione create_prediction_admin correttamente con casting dello status
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
  profile_id_val UUID;
BEGIN
  -- Verifica che l'admin esista
  SELECT id INTO profile_id_val
  FROM profiles 
  WHERE wallet_address = admin_wallet_address 
  LIMIT 1;
  
  IF profile_id_val IS NULL THEN
    RAISE EXCEPTION 'Admin wallet address non trovato nei profili';
  END IF;

  -- Genera slug dal titolo
  prediction_slug := lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Inserisci la prediction con cast dello status
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
    status::prediction_status,  -- CAST a prediction_status
    rules,
    image_url,
    profile_id_val
  ) RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi
GRANT EXECUTE ON FUNCTION create_prediction_admin TO authenticated;

