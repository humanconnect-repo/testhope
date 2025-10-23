-- Aggiungi colonna signature alla tabella profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature TEXT;

-- Commento per documentare l'uso
COMMENT ON COLUMN profiles.signature IS 'Firma EIP-4361 del messaggio di autenticazione Web3';
