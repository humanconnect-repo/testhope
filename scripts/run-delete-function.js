const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDeleteFunction() {
  try {
    console.log('🚀 Creando funzione delete_prediction_admin...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Funzione per eliminare predictions (solo admin)
        CREATE OR REPLACE FUNCTION delete_prediction_admin(
          prediction_id UUID,
          admin_wallet_address TEXT DEFAULT NULL
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          is_user_admin BOOLEAN;
        BEGIN
          -- Verifica che l'utente sia admin
          SELECT is_admin INTO is_user_admin 
          FROM profiles 
          WHERE wallet_address = admin_wallet_address;
          
          IF NOT is_user_admin THEN 
            RAISE EXCEPTION 'Access denied: Only admins can delete predictions'; 
          END IF;
          
          -- Elimina la prediction
          DELETE FROM predictions WHERE id = prediction_id;
          
          RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Concedi permessi di esecuzione
        GRANT EXECUTE ON FUNCTION delete_prediction_admin(UUID, TEXT) TO authenticated, anon;
      `
    });

    if (error) {
      console.error('❌ Errore:', error);
      return;
    }

    console.log('✅ Funzione delete_prediction_admin creata con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante la creazione:', error);
  }
}

createDeleteFunction();
