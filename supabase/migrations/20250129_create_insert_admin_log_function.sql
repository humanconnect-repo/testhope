-- Funzione RPC per inserire log delle azioni amministrative
CREATE OR REPLACE FUNCTION insert_admin_log(
  action_type_param TEXT,
  tx_hash_param TEXT,
  admin_address_param TEXT,
  pool_address_param TEXT DEFAULT NULL,
  prediction_id_param UUID DEFAULT NULL,
  additional_data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Inserisci il log
  INSERT INTO logadminfunction (
    action_type,
    tx_hash,
    pool_address,
    prediction_id,
    admin_address,
    additional_data
  )
  VALUES (
    action_type_param,
    tx_hash_param,
    pool_address_param,
    prediction_id_param,
    admin_address_param,
    additional_data_param
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Commento sulla funzione
COMMENT ON FUNCTION insert_admin_log IS 'Inserisce un log delle azioni amministrative nel database';

