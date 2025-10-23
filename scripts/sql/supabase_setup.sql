-- 🗄️ Script SQL per configurare la tabella profiles in Supabase
-- Esegui questo script nel SQL Editor del tuo progetto Supabase

-- 1. Crea la tabella profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Abilita RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crea policy per permettere a tutti di leggere i profili
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 4. Crea policy per permettere a tutti di inserire profili
CREATE POLICY "Profiles are insertable by everyone" ON profiles
  FOR INSERT WITH CHECK (true);

-- 5. Crea policy per permettere a tutti di aggiornare profili
CREATE POLICY "Profiles are updatable by everyone" ON profiles
  FOR UPDATE USING (true);

-- 6. Verifica che la tabella sia stata creata
SELECT * FROM profiles LIMIT 5;
