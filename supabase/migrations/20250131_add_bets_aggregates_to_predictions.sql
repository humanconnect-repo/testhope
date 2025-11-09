-- Migration: Aggiungi colonne aggregate per statistiche bets
-- Questo script aggiunge colonne aggregate alla tabella predictions
-- e crea un trigger che le aggiorna automaticamente quando cambiano le bets

-- 1. Aggiungi colonne aggregate alla tabella predictions
ALTER TABLE predictions 
ADD COLUMN IF NOT EXISTS total_bets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yes_bets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_bets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bnb_amount DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yes_bnb_amount DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_bnb_amount DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yes_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_percentage DECIMAL(5, 2) DEFAULT 0;

-- 2. Crea funzione per aggiornare le statistiche aggregate
CREATE OR REPLACE FUNCTION update_prediction_bets_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_prediction_id UUID;
  v_total_count INTEGER;
  v_yes_count INTEGER;
  v_no_count INTEGER;
  v_total_bnb DECIMAL(18, 8);
  v_yes_bnb DECIMAL(18, 8);
  v_no_bnb DECIMAL(18, 8);
  v_yes_pct DECIMAL(5, 2);
  v_no_pct DECIMAL(5, 2);
BEGIN
  -- Determina quale prediction_id aggiornare
  IF TG_OP = 'DELETE' THEN
    v_prediction_id := OLD.prediction_id;
  ELSE
    v_prediction_id := NEW.prediction_id;
  END IF;

  -- Calcola le statistiche aggregate
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE position = 'yes')::INTEGER,
    COUNT(*) FILTER (WHERE position = 'no')::INTEGER,
    COALESCE(SUM(amount_bnb), 0),
    COALESCE(SUM(amount_bnb) FILTER (WHERE position = 'yes'), 0),
    COALESCE(SUM(amount_bnb) FILTER (WHERE position = 'no'), 0)
  INTO 
    v_total_count,
    v_yes_count,
    v_no_count,
    v_total_bnb,
    v_yes_bnb,
    v_no_bnb
  FROM bets
  WHERE prediction_id = v_prediction_id;

  -- Calcola le percentuali (basate sul numero di bets, non sugli importi)
  IF v_total_count > 0 THEN
    v_yes_pct := ROUND((v_yes_count::DECIMAL / v_total_count::DECIMAL) * 100 * 10) / 10;
    v_no_pct := ROUND((v_no_count::DECIMAL / v_total_count::DECIMAL) * 100 * 10) / 10;
  ELSE
    v_yes_pct := 0;
    v_no_pct := 0;
  END IF;

  -- Aggiorna la tabella predictions
  UPDATE predictions
  SET 
    total_bets_count = v_total_count,
    yes_bets_count = v_yes_count,
    no_bets_count = v_no_count,
    total_bnb_amount = v_total_bnb,
    yes_bnb_amount = v_yes_bnb,
    no_bnb_amount = v_no_bnb,
    yes_percentage = v_yes_pct,
    no_percentage = v_no_pct,
    updated_at = NOW()
  WHERE id = v_prediction_id;

  -- Ritorna il record appropriato
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 3. Crea trigger che si attiva su INSERT, UPDATE, DELETE di bets
DROP TRIGGER IF EXISTS trigger_update_prediction_bets_stats ON bets;
CREATE TRIGGER trigger_update_prediction_bets_stats
  AFTER INSERT OR UPDATE OR DELETE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_bets_stats();

-- 4. Popola i valori iniziali per tutte le predictions esistenti
-- Usa una funzione temporanea per aggiornare tutte le predictions
DO $$
DECLARE
  pred_record RECORD;
  v_total_count INTEGER;
  v_yes_count INTEGER;
  v_no_count INTEGER;
  v_total_bnb DECIMAL(18, 8);
  v_yes_bnb DECIMAL(18, 8);
  v_no_bnb DECIMAL(18, 8);
  v_yes_pct DECIMAL(5, 2);
  v_no_pct DECIMAL(5, 2);
BEGIN
  FOR pred_record IN SELECT id FROM predictions LOOP
    -- Calcola le statistiche per questa prediction
    SELECT 
      COUNT(*)::INTEGER,
      COUNT(*) FILTER (WHERE position = 'yes')::INTEGER,
      COUNT(*) FILTER (WHERE position = 'no')::INTEGER,
      COALESCE(SUM(amount_bnb), 0),
      COALESCE(SUM(amount_bnb) FILTER (WHERE position = 'yes'), 0),
      COALESCE(SUM(amount_bnb) FILTER (WHERE position = 'no'), 0)
    INTO 
      v_total_count,
      v_yes_count,
      v_no_count,
      v_total_bnb,
      v_yes_bnb,
      v_no_bnb
    FROM bets
    WHERE prediction_id = pred_record.id;

    -- Calcola le percentuali
    IF v_total_count > 0 THEN
      v_yes_pct := ROUND((v_yes_count::DECIMAL / v_total_count::DECIMAL) * 100 * 10) / 10;
      v_no_pct := ROUND((v_no_count::DECIMAL / v_total_count::DECIMAL) * 100 * 10) / 10;
    ELSE
      v_yes_pct := 0;
      v_no_pct := 0;
    END IF;

    -- Aggiorna la prediction
    UPDATE predictions
    SET 
      total_bets_count = v_total_count,
      yes_bets_count = v_yes_count,
      no_bets_count = v_no_count,
      total_bnb_amount = v_total_bnb,
      yes_bnb_amount = v_yes_bnb,
      no_bnb_amount = v_no_bnb,
      yes_percentage = v_yes_pct,
      no_percentage = v_no_pct
    WHERE id = pred_record.id;
  END LOOP;
END $$;

-- 5. Aggiungi indici per performance (se non esistono già)
CREATE INDEX IF NOT EXISTS idx_predictions_total_bets_count ON predictions(total_bets_count);
CREATE INDEX IF NOT EXISTS idx_predictions_total_bnb_amount ON predictions(total_bnb_amount);

-- 6. Aggiungi commenti per documentare le colonne
COMMENT ON COLUMN predictions.total_bets_count IS 'Numero totale di bets per questa prediction (calcolato automaticamente)';
COMMENT ON COLUMN predictions.yes_bets_count IS 'Numero di bets "yes" per questa prediction (calcolato automaticamente)';
COMMENT ON COLUMN predictions.no_bets_count IS 'Numero di bets "no" per questa prediction (calcolato automaticamente)';
COMMENT ON COLUMN predictions.total_bnb_amount IS 'Somma totale BNB scommessi (calcolato automaticamente)';
COMMENT ON COLUMN predictions.yes_bnb_amount IS 'Somma BNB scommessi su "yes" (calcolato automaticamente)';
COMMENT ON COLUMN predictions.no_bnb_amount IS 'Somma BNB scommessi su "no" (calcolato automaticamente)';
COMMENT ON COLUMN predictions.yes_percentage IS 'Percentuale bets "yes" basata sul numero (calcolato automaticamente)';
COMMENT ON COLUMN predictions.no_percentage IS 'Percentuale bets "no" basata sul numero (calcolato automaticamente)';

