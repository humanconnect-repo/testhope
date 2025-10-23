-- Script per creare le tabelle per il sistema admin di prediction
-- Eseguire questo script in Supabase SQL Editor

-- 1. Aggiungi colonna is_admin alla tabella profiles esistente
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Crea tabella predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  closing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attiva', 'scaduta', 'bloccata')),
  rules TEXT, -- Regolamento della prediction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crea tabella bets per le scommesse
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  amount_bnb DECIMAL(18,8) NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crea tabella comments per i commenti
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indici per performance
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON predictions(category);
CREATE INDEX IF NOT EXISTS idx_predictions_closing_date ON predictions(closing_date);
CREATE INDEX IF NOT EXISTS idx_predictions_slug ON predictions(slug);

CREATE INDEX IF NOT EXISTS idx_bets_prediction_id ON bets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_position ON bets(position);

CREATE INDEX IF NOT EXISTS idx_comments_prediction_id ON comments(prediction_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 6. RLS (Row Level Security) policies
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies per predictions (tutti possono leggere, solo admin possono modificare)
CREATE POLICY "Anyone can view predictions" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert predictions" ON predictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update predictions" ON predictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete predictions" ON predictions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies per bets (utenti autenticati possono inserire le proprie scommesse)
CREATE POLICY "Users can view all bets" ON bets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own bets" ON bets
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM predictions 
      WHERE id = prediction_id AND status = 'attiva'
    )
  );

CREATE POLICY "Users can update their own bets" ON bets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bets" ON bets
  FOR DELETE USING (user_id = auth.uid());

-- Policies per comments (utenti autenticati possono gestire i propri commenti)
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (user_id = auth.uid());

-- 7. Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at su predictions
CREATE TRIGGER update_predictions_updated_at 
  BEFORE UPDATE ON predictions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Funzione per generare slug automaticamente
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger per generare slug automaticamente
CREATE OR REPLACE FUNCTION set_prediction_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_prediction_slug_trigger
  BEFORE INSERT ON predictions
  FOR EACH ROW EXECUTE FUNCTION set_prediction_slug();

-- 10. Funzione per calcolare le percentuali YES/NO
CREATE OR REPLACE FUNCTION get_prediction_percentages(prediction_uuid UUID)
RETURNS TABLE(yes_percentage NUMERIC, no_percentage NUMERIC, total_bets BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH bet_stats AS (
    SELECT 
      COUNT(CASE WHEN position = 'yes' THEN 1 END) as yes_count,
      COUNT(CASE WHEN position = 'no' THEN 1 END) as no_count,
      COUNT(*) as total_count
    FROM bets 
    WHERE prediction_id = prediction_uuid
  )
  SELECT 
    CASE 
      WHEN total_count = 0 THEN 0
      ELSE ROUND((yes_count::NUMERIC / total_count) * 100, 2)
    END as yes_percentage,
    CASE 
      WHEN total_count = 0 THEN 0
      ELSE ROUND((no_count::NUMERIC / total_count) * 100, 2)
    END as no_percentage,
    total_count as total_bets
  FROM bet_stats;
END;
$$ LANGUAGE plpgsql;

-- 11. Inserisci un admin di default (sostituisci con il tuo wallet address)
-- IMPORTANTE: Sostituisci '0x...' con il tuo indirizzo wallet
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE wallet_address = '0x...'; -- Il tuo wallet admin

-- 12. Inserisci alcune prediction di esempio
INSERT INTO predictions (title, description, category, closing_date, status, rules) VALUES
('Il Napoli vincerà lo scudetto di questa stagione?', 
 'La stagione calcistica 2024-25 è iniziata e tutti si chiedono se il Napoli riuscirà a conquistare nuovamente lo scudetto. Con una squadra rinnovata e nuovi acquisti, i partenopei puntano al titolo. Scommetti su chi pensi che vincerà il campionato!',
 'Sport',
 '2025-05-31 23:59:59+00',
 'attiva',
 'La prediction si chiude alla fine della stagione regolare. Il Napoli deve vincere il campionato di Serie A 2024-25.'),
 
('Arresteranno Fabrizio Corona entro 6 mesi?',
 'Il caso Corona continua a tenere banco. Con tutte le indagini in corso e le accuse che si moltiplicano, riuscirà la giustizia a mettere le mani su di lui entro i prossimi 6 mesi?',
 'Degen',
 '2024-12-20 23:59:59+00',
 'attiva',
 'La prediction si chiude se Corona viene arrestato o se scadono i 6 mesi. Arresto deve essere formale e confermato dalle autorità.'),

('Lacerenza aprirà una nuova Gintoneria entro la fine dell''anno?',
 'Il re delle Gintonerie ha già conquistato Napoli, ma riuscirà ad aprire un nuovo locale entro il 31 dicembre? Tra permessi, burocrazia e tempistiche, la sfida è aperta!',
 'Degen',
 '2024-12-31 23:59:59+00',
 'attiva',
 'La prediction si chiude se viene aperto un nuovo locale o se scade l''anno. Il locale deve essere effettivamente operativo e aperto al pubblico.');

-- 13. Inserisci alcune scommesse di esempio
-- (Queste verranno inserite quando gli utenti faranno le prime scommesse)
