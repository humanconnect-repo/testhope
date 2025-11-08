-- Aggiungi campo total_wins alla tabella profiles e trigger per aggiornamento automatico
-- Eseguire questo script in Supabase SQL Editor

-- STEP 1: Aggiungi colonna total_wins alla tabella profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;

-- Aggiungi commento per documentazione
COMMENT ON COLUMN profiles.total_wins IS 'Numero totale di prediction vinte dall''utente (aggiornato automaticamente da trigger quando winning_rewards_amount viene impostato)';

-- STEP 2: Crea funzione trigger per incrementare total_wins
CREATE OR REPLACE FUNCTION increment_user_wins()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlla se winning_rewards_amount è passato da NULL/0 a > 0 (nuova vincita)
  -- Questo significa che l'utente ha appena fatto claim di una vincita
  IF (OLD.winning_rewards_amount IS NULL OR OLD.winning_rewards_amount <= 0) 
     AND NEW.winning_rewards_amount IS NOT NULL 
     AND NEW.winning_rewards_amount > 0 THEN
    
    -- Incrementa il contatore total_wins
    UPDATE profiles 
    SET total_wins = total_wins + 1 
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Commento per documentazione
COMMENT ON FUNCTION increment_user_wins() IS 'Incrementa automaticamente total_wins in profiles quando winning_rewards_amount viene aggiornato da NULL/0 a un valore > 0';

-- STEP 3: Crea trigger AFTER UPDATE su bets
CREATE TRIGGER bet_won
  AFTER UPDATE OF winning_rewards_amount ON bets
  FOR EACH ROW
  WHEN (NEW.winning_rewards_amount IS NOT NULL AND NEW.winning_rewards_amount > 0)
  EXECUTE FUNCTION increment_user_wins();

-- Commento per documentazione
COMMENT ON TRIGGER bet_won ON bets IS 'Trigger automatico che aggiorna total_wins in profiles quando winning_rewards_amount viene aggiornato a un valore > 0';

-- STEP 4: Migrazione iniziale (popola total_wins con i dati esistenti)
-- Conta tutte le bets con winning_rewards_amount > 0 per ogni utente
UPDATE profiles
SET total_wins = (
  SELECT COUNT(*) 
  FROM bets 
  WHERE bets.user_id = profiles.id
    AND bets.winning_rewards_amount IS NOT NULL
    AND bets.winning_rewards_amount > 0
);

-- Verifica migrazione (query di controllo - opzionale, puoi eseguirla separatamente)
-- SELECT 
--   p.id,
--   p.username,
--   p.total_wins AS "Totale in profiles",
--   COUNT(b.id) AS "Conteggio reale da bets"
-- FROM profiles p
-- LEFT JOIN bets b ON b.user_id = p.id
--   AND b.winning_rewards_amount IS NOT NULL
--   AND b.winning_rewards_amount > 0
-- GROUP BY p.id, p.username, p.total_wins
-- HAVING COUNT(b.id) > 0 OR p.total_wins > 0
-- ORDER BY p.total_wins DESC;

