-- =============================================
-- FIX TABELLA COMMENTS
-- =============================================

-- 1. Verifica se la tabella comments esiste e ha la struttura corretta
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments' AND table_schema = 'public';

-- 2. Se la tabella esiste ma manca la colonna content, aggiungila
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'content' AND table_schema = 'public'
  ) THEN
    ALTER TABLE comments ADD COLUMN content TEXT;
  END IF;
END $$;

-- 3. Se la tabella non esiste, creala
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Abilita RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 5. Crea policy per lettura pubblica
DROP POLICY IF EXISTS "comments_select_public" ON comments;
CREATE POLICY "comments_select_public" ON comments FOR SELECT USING (true);

-- 6. Crea policy per inserimento
DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
CREATE POLICY "comments_insert_authenticated" ON comments FOR INSERT 
  WITH CHECK (true);

-- 7. Concedi permessi
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;
GRANT SELECT ON TABLE comments TO anon;

-- 8. Ricrea la funzione get_prediction_comments
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

-- 9. Concedi permessi alla funzione
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO anon;

SELECT 'Tabella comments corretta!' as status;
