-- =============================================
-- FUNZIONI RPC MANCANTI PER PAGINA DETTAGLI PREDICTION
-- =============================================

-- 1. Funzione per ottenere le scommesse recenti (globali)
CREATE OR REPLACE FUNCTION public.get_recent_bets(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  bet_id UUID,
  amount_bnb NUMERIC,
  position TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  prediction_title TEXT,
  prediction_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bet_id,
    b.amount_bnb,
    b.position,
    b.created_at,
    COALESCE(p.username, 'Anonimo') as username,
    pr.title as prediction_title,
    pr.slug as prediction_slug
  FROM bets b
  LEFT JOIN profiles p ON b.user_id = p.id
  LEFT JOIN predictions pr ON b.prediction_id = pr.id
  ORDER BY b.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 2. Funzione per ottenere i top scommettitori di una prediction specifica
CREATE OR REPLACE FUNCTION public.get_top_bettors(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  total_amount NUMERIC,
  bet_count BIGINT,
  last_bet_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.user_id,
    COALESCE(p.username, 'Anonimo') as username,
    SUM(b.amount_bnb) as total_amount,
    COUNT(*) as bet_count,
    MAX(b.created_at) as last_bet_at
  FROM bets b
  LEFT JOIN profiles p ON b.user_id = p.id
  WHERE b.prediction_id = prediction_uuid
  GROUP BY b.user_id, p.username
  ORDER BY total_amount DESC
  LIMIT limit_count;
END;
$$;

-- 3. Funzione per ottenere i commenti di una prediction specifica
CREATE OR REPLACE FUNCTION public.get_prediction_comments(prediction_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  comment_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as comment_id,
    c.content,
    c.created_at,
    COALESCE(p.username, 'Anonimo') as username,
    c.user_id
  FROM comments c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.prediction_id = prediction_uuid
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 4. Funzione per creare un nuovo commento
CREATE OR REPLACE FUNCTION public.create_comment(
  prediction_uuid UUID,
  comment_content TEXT,
  caller_wallet TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_comment_id UUID;
  user_profile_id UUID;
BEGIN
  -- Trova l'ID del profilo basato sul wallet
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE wallet_address = caller_wallet;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for wallet: %', caller_wallet;
  END IF;
  
  -- Inserisci il commento
  INSERT INTO comments (prediction_id, user_id, content)
  VALUES (prediction_uuid, user_profile_id, comment_content)
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$;

-- 5. Funzione per creare una scommessa
CREATE OR REPLACE FUNCTION public.create_bet(
  prediction_uuid UUID,
  bet_amount NUMERIC,
  bet_position TEXT,
  caller_wallet TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_bet_id UUID;
  user_profile_id UUID;
BEGIN
  -- Trova l'ID del profilo basato sul wallet
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE wallet_address = caller_wallet;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for wallet: %', caller_wallet;
  END IF;
  
  -- Valida la posizione
  IF bet_position NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Invalid bet position: %. Must be "yes" or "no"', bet_position;
  END IF;
  
  -- Inserisci la scommessa
  INSERT INTO bets (prediction_id, user_id, amount_bnb, position)
  VALUES (prediction_uuid, user_profile_id, bet_amount, bet_position)
  RETURNING id INTO new_bet_id;
  
  RETURN new_bet_id;
END;
$$;

-- Concedi i permessi di esecuzione
GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_bet(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- Concedi anche ad anon per le funzioni di lettura
GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO anon;
