const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPredictionAdminFunction() {
  console.log('🔧 Creando funzione create_prediction_admin...');
  
  const createFunctionSQL = `
-- Funzione per creare prediction (solo per admin autenticati)
CREATE OR REPLACE FUNCTION create_prediction_admin(
  title TEXT,
  description TEXT,
  category TEXT,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_bid TIMESTAMP WITH TIME ZONE,
  status TEXT,
  rules TEXT DEFAULT NULL,
  admin_wallet_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  is_user_admin BOOLEAN;
  prediction_id UUID;
  prediction_slug TEXT;
BEGIN
  -- Verifica che l'utente sia admin usando il wallet address passato
  SELECT is_admin INTO is_user_admin
  FROM profiles 
  WHERE wallet_address = admin_wallet_address;
  
  -- Se non è admin, nega l'accesso
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'Access denied: Only admins can create predictions';
  END IF;
  
  -- Genera slug dal titolo
  prediction_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  prediction_slug := trim(both '-' from prediction_slug);
  
  -- Assicurati che lo slug sia unico
  WHILE EXISTS (SELECT 1 FROM predictions WHERE slug = prediction_slug) LOOP
    prediction_slug := prediction_slug || '-' || extract(epoch from now())::text;
  END LOOP;
  
  -- Crea la prediction
  INSERT INTO predictions (
    title, 
    description, 
    category, 
    closing_date, 
    closing_bid,
    status, 
    rules,
    slug
  )
  VALUES (
    create_prediction_admin.title,
    create_prediction_admin.description,
    create_prediction_admin.category,
    create_prediction_admin.closing_date,
    create_prediction_admin.closing_bid,
    create_prediction_admin.status,
    create_prediction_admin.rules,
    prediction_slug
  )
  RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION create_prediction_admin(TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO authenticated, anon;
  `;

  try {
    // Esegui la funzione SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      console.error('❌ Errore creazione funzione:', error);
      return;
    }
    
    console.log('✅ Funzione create_prediction_admin creata con successo!');
    console.log('📝 Ora puoi usare la funzione dal pannello admin');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    console.log('💡 Prova a eseguire lo SQL direttamente nel Supabase Dashboard');
  }
}

createPredictionAdminFunction();
