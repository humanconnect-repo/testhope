-- Aggiunge lo status "in_attesa" per prediction create ma senza contract
-- Questo script aggiunge il nuovo status e aggiorna le prediction esistenti

-- 1. Aggiungi colonna contract_address se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' 
        AND column_name = 'contract_address'
    ) THEN
        ALTER TABLE predictions ADD COLUMN contract_address TEXT;
    END IF;
END $$;

-- 2. Aggiungi colonna status se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'predictions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE predictions ADD COLUMN status TEXT DEFAULT 'in_attesa';
    END IF;
END $$;

-- 3. Aggiorna prediction esistenti senza contract_address a "in_attesa"
UPDATE predictions 
SET status = 'in_attesa' 
WHERE contract_address IS NULL OR contract_address = '';

-- 4. Aggiorna prediction con contract_address a "attiva"
UPDATE predictions 
SET status = 'attiva' 
WHERE contract_address IS NOT NULL AND contract_address != '';

-- 5. Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_contract_address ON predictions(contract_address);

-- 6. Aggiungi constraint per status validi
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'predictions_status_check'
    ) THEN
        ALTER TABLE predictions 
        ADD CONSTRAINT predictions_status_check 
        CHECK (status IN ('in_attesa', 'attiva', 'in_pausa', 'risolta', 'cancellata'));
    END IF;
END $$;

-- 7. Crea funzione per attivare prediction con contract
CREATE OR REPLACE FUNCTION activate_prediction_contract(
    p_prediction_id UUID,
    p_contract_address TEXT,
    p_caller_wallet TEXT
) RETURNS JSON AS $$
DECLARE
    v_prediction_id UUID;
    v_is_admin BOOLEAN;
    v_result JSON;
BEGIN
    -- Verifica che l'utente sia admin
    SELECT check_wallet_admin_status(p_caller_wallet) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied: Only admins can activate predictions'
        );
    END IF;
    
    -- Verifica che la prediction esista e sia in_attesa
    SELECT id INTO v_prediction_id
    FROM predictions 
    WHERE id = p_prediction_id 
    AND status = 'in_attesa';
    
    IF v_prediction_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Prediction not found or not in waiting status'
        );
    END IF;
    
    -- Aggiorna prediction con contract address e status
    UPDATE predictions 
    SET 
        contract_address = p_contract_address,
        status = 'attiva',
        updated_at = NOW()
    WHERE id = p_prediction_id;
    
    -- Ritorna successo
    RETURN json_build_object(
        'success', true,
        'message', 'Prediction activated successfully',
        'prediction_id', p_prediction_id,
        'contract_address', p_contract_address
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Database error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Concedi permessi
GRANT EXECUTE ON FUNCTION activate_prediction_contract TO authenticated;
GRANT EXECUTE ON FUNCTION activate_prediction_contract TO anon;

-- 9. Verifica risultati
SELECT 
    status,
    COUNT(*) as count,
    COUNT(contract_address) as with_contract
FROM predictions 
GROUP BY status
ORDER BY status;
