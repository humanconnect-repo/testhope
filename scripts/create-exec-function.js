const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExecFunction() {
  try {
    console.log('🚀 Creazione funzione exec_sql...');
    
    // Crea la funzione exec_sql
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS TEXT AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'OK';
      EXCEPTION WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Esegui direttamente tramite query raw
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', createFunctionSQL);
    
    if (error) {
      console.error('❌ Errore nella creazione della funzione:', error);
    } else {
      console.log('✅ Funzione exec_sql creata con successo!');
    }
    
  } catch (error) {
    console.error('💥 Errore:', error);
  }
}

createExecFunction();
