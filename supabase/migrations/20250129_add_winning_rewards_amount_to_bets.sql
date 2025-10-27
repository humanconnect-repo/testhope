-- Aggiungi campo winning_rewards_amount alla tabella bets per tracciare l'importo della ricompensa della vincita
-- Eseguire questo script in Supabase SQL Editor

-- 1. Aggiungi colonna winning_rewards_amount alla tabella bets
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS winning_rewards_amount NUMERIC(18, 8);

-- 2. Aggiungi commento per documentare il campo
COMMENT ON COLUMN bets.winning_rewards_amount IS 'Importo in BNB della ricompensa della vincita (solo reward, esclude la scommessa originale)';

