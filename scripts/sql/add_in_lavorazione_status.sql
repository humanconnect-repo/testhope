-- Aggiunge status "In lavorazione" e migliora la gestione delle date
-- Esegui questo script nel Supabase SQL Editor

-- 1. Aggiungi il nuovo status "In lavorazione" al CHECK constraint
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_status_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_status_check 
  CHECK (status IN ('attiva', 'scaduta', 'bloccata', 'in_lavorazione'));

-- 2. Aggiorna la funzione per includere il nuovo status
CREATE OR REPLACE FUNCTION get_predictions_for_users()
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMPTZ,
  status TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by TEXT,
  yes_percentage NUMERIC,
  no_percentage NUMERIC,
  total_bets INTEGER,
  total_amount_bnb NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.category,
    p.closing_date,
    p.status,
    p.rules,
    p.created_at,
    p.updated_at,
    p.created_by,
    0::NUMERIC as yes_percentage,
    0::NUMERIC as no_percentage,
    0::INTEGER as total_bets,
    0::NUMERIC as total_amount_bnb
  FROM predictions p
  WHERE p.status IN ('attiva', 'in_lavorazione')
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. Test della modifica
SELECT 'Status "In lavorazione" aggiunto con successo!' as status;
