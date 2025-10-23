-- SOLUZIONE SICURA RLS PREDICTION - IMPLEMENTAZIONE ESPERTA
-- ========================================================

-- 1. Rimuovi TUTTE le policy esistenti
DROP POLICY IF EXISTS "Predictions read only" ON predictions;
DROP POLICY IF EXISTS "Allow RPC functions" ON predictions;
DROP POLICY IF EXISTS "Predictions RPC functions only" ON predictions;
DROP POLICY IF EXISTS "Predictions no direct updates" ON predictions;
DROP POLICY IF EXISTS "Predictions RPC only" ON predictions;

-- 2. Crea policy restrittive (blocca TUTTO il DML diretto)
-- Tutti possono LEGGERE
CREATE POLICY "predictions_select_public"
  ON predictions FOR SELECT
  USING (true);

-- NESSUNO può fare INSERT/UPDATE/DELETE direttamente
CREATE POLICY "predictions_insert_block"
  ON predictions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "predictions_update_block"
  ON predictions FOR UPDATE
  USING (false) WITH CHECK (false);

CREATE POLICY "predictions_delete_block"
  ON predictions FOR DELETE
  USING (false);

-- 3. GRANT/REVOKE (secondo cancello)
-- Togli permessi DML ai ruoli esposti dal tuo API layer
REVOKE INSERT, UPDATE, DELETE ON TABLE predictions FROM anon, authenticated;
-- Lascia solo la lettura
GRANT SELECT ON TABLE predictions TO anon, authenticated;

-- 4. Verifica RLS attivo
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

SELECT 'RLS Prediction sicuro implementato - DML diretto bloccato' as status;
