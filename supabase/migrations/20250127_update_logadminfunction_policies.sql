-- Aggiorna le policy RLS per logadminfunction 
-- Nota: per ora permette a tutti di inserire/leggere perché usiamo wallet auth custom
-- Il controllo admin viene fatto nel frontend prima di chiamare le funzioni

-- Elimina le vecchie policy se esistono
DROP POLICY IF EXISTS "Admin can view admin function logs" ON logadminfunction;
DROP POLICY IF EXISTS "Admin can insert admin function logs" ON logadminfunction;

-- Disabilita RLS per questa tabella (il controllo admin è nel frontend)
ALTER TABLE logadminfunction DISABLE ROW LEVEL SECURITY;

