-- Aggiungi 'resolve_yes' e 'resolve_no' come action_type validi alla tabella logadminfunction

ALTER TABLE logadminfunction DROP CONSTRAINT IF EXISTS valid_action_type;

ALTER TABLE logadminfunction 
ADD CONSTRAINT valid_action_type CHECK (
  action_type IN (
    'stop_betting', 
    'resume_betting', 
    'cancel_pool', 
    'close_pool', 
    'reopen_pool', 
    'set_winner', 
    'emergency_resolve', 
    'create_pool', 
    'update_notes',
    'recover_funds',
    'resolve_yes',
    'resolve_no'
  )
);

COMMENT ON COLUMN logadminfunction.action_type IS 'Tipo di azione amministrativa eseguita (include: resolve_yes/resolve_no per risoluzione predictions)';

