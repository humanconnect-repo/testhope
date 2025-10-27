-- Aggiungi campo claim_winning_tx_hash alla tabella bets per tracciare le transazioni di claim vincite
-- Eseguire questo script in Supabase SQL Editor

-- 1. Aggiungi colonna claim_winning_tx_hash alla tabella bets
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS claim_winning_tx_hash TEXT;

-- 2. Aggiungi commento per documentare il campo
COMMENT ON COLUMN bets.claim_winning_tx_hash IS 'Hash della transazione quando l''utente fa claim delle vincite per pool risolte';

-- 3. Crea indice per performance (opzionale)
CREATE INDEX IF NOT EXISTS idx_bets_claim_winning_tx_hash ON bets(claim_winning_tx_hash) WHERE claim_winning_tx_hash IS NOT NULL;

-- 4. Aggiungi constraint per validare il formato dell'hash (opzionale)
-- Gli hash delle transazioni BSC sono sempre 66 caratteri (0x + 64 hex)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_claim_winning_tx_hash_format'
  ) THEN
    ALTER TABLE bets 
    ADD CONSTRAINT check_claim_winning_tx_hash_format 
    CHECK (claim_winning_tx_hash IS NULL OR (LENGTH(claim_winning_tx_hash) = 66 AND claim_winning_tx_hash ~ '^0x[0-9a-fA-F]{64}$'));
  END IF;
END $$;

