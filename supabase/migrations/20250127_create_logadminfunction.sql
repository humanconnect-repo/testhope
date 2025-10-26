-- Crea tabella logadminfunction per tracciare le transazioni delle funzioni amministrative

-- 1. Crea tabella logadminfunction
CREATE TABLE IF NOT EXISTS logadminfunction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  pool_address TEXT,
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  admin_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  additional_data JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_tx_hash_format CHECK (LENGTH(tx_hash) = 66 AND tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  CONSTRAINT valid_action_type CHECK (action_type IN ('stop_betting', 'resume_betting', 'cancel_pool', 'close_pool', 'reopen_pool', 'set_winner', 'emergency_resolve', 'create_pool', 'update_notes'))
);

-- 2. Aggiungi commenti alle colonne
COMMENT ON TABLE logadminfunction IS 'Log delle transazioni delle funzioni amministrative';
COMMENT ON COLUMN logadminfunction.action_type IS 'Tipo di azione amministrativa eseguita';
COMMENT ON COLUMN logadminfunction.tx_hash IS 'Hash della transazione blockchain';
COMMENT ON COLUMN logadminfunction.pool_address IS 'Indirizzo del contract della pool (opzionale)';
COMMENT ON COLUMN logadminfunction.prediction_id IS 'ID della prediction correlata';
COMMENT ON COLUMN logadminfunction.admin_address IS 'Indirizzo del wallet amministratore che ha eseguito l''azione';
COMMENT ON COLUMN logadminfunction.additional_data IS 'Dati aggiuntivi in formato JSON';

-- 3. Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS idx_logadminfunction_action_type ON logadminfunction(action_type);
CREATE INDEX IF NOT EXISTS idx_logadminfunction_tx_hash ON logadminfunction(tx_hash);
CREATE INDEX IF NOT EXISTS idx_logadminfunction_pool_address ON logadminfunction(pool_address) WHERE pool_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logadminfunction_prediction_id ON logadminfunction(prediction_id);
CREATE INDEX IF NOT EXISTS idx_logadminfunction_admin_address ON logadminfunction(admin_address);
CREATE INDEX IF NOT EXISTS idx_logadminfunction_created_at ON logadminfunction(created_at DESC);

-- 4. NON abilitare RLS perché usiamo autenticazione custom con wallet
-- Il controllo admin viene fatto nel frontend prima di chiamare le funzioni admin
ALTER TABLE logadminfunction DISABLE ROW LEVEL SECURITY;

