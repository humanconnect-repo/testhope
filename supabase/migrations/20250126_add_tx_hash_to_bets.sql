-- Aggiungi campo tx_hash alla tabella bets per tracciare le transazioni di bet originali

-- 1. Aggiungi colonna tx_hash alla tabella bets
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- 2. Aggiungi commento descrittivo
COMMENT ON COLUMN bets.tx_hash IS 'Hash della transazione blockchain quando l''utente ha piazzato la scommessa';

-- 3. Aggiungi indice per performance
CREATE INDEX IF NOT EXISTS idx_bets_tx_hash ON bets(tx_hash) WHERE tx_hash IS NOT NULL;

-- 4. Aggiungi constraint per validare il formato (66 caratteri: 0x + 64 hex)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_tx_hash_format'
  ) THEN
    ALTER TABLE bets
    ADD CONSTRAINT check_tx_hash_format 
    CHECK (tx_hash IS NULL OR (LENGTH(tx_hash) = 66 AND tx_hash ~ '^0x[0-9a-fA-F]{64}$'));
  END IF;
END $$;

