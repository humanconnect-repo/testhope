const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  console.error('Crea un file .env.local con:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUpdateFunction() {
  console.log('🔧 Creando funzione update_prediction_admin...');
  
  const createFunctionSQL = `
-- Funzione per aggiornare prediction (solo per admin autenticati)
CREATE OR REPLACE FUNCTION update_prediction_admin(
  prediction_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT DEFAULT NULL,
  admin_wallet_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin usando il wallet address passato
  SELECT is_admin INTO is_user_admin
  FROM profiles 
  WHERE wallet_address = admin_wallet_address;
  
  -- Se non è admin, nega l'accesso
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can update predictions';
  END IF;
  
  -- Aggiorna la prediction
  UPDATE predictions 
  SET 
    title = update_prediction_admin.title,
    description = update_prediction_admin.description,
    category = update_prediction_admin.category,
    closing_date = update_prediction_admin.closing_date,
    status = update_prediction_admin.status,
    rules = update_prediction_admin.rules,
    updated_at = NOW()
  WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO authenticated, anon;
  `;

  try {
    // Esegui la funzione SQL
    const { data, error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    
    if (error) {
      console.error('❌ Errore creazione funzione:', error);
      return;
    }
    
    console.log('✅ Funzione update_prediction_admin creata con successo!');
    console.log('📝 Ora puoi usare la funzione dal pannello admin');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    console.log('💡 Prova a eseguire lo SQL direttamente nel Supabase Dashboard');
  }
}

createAdminUpdateFunction();
