const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  console.error('Assicurati di avere NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createGetRecentBetsFunction() {
  try {
    console.log('⏳ Creando funzione get_recent_bets...');
    
    // SQL per creare la funzione
    const createFunctionSQL = `
      -- 1. Elimina la funzione se esiste già
      DROP FUNCTION IF EXISTS get_recent_bets(integer);

      -- 2. Crea la funzione per ottenere le ultime scommesse
      CREATE OR REPLACE FUNCTION get_recent_bets(limit_count INTEGER DEFAULT 5)
      RETURNS TABLE (
        bet_id UUID,
        amount_bnb NUMERIC,
        position TEXT,
        created_at TIMESTAMPTZ,
        username TEXT,
        prediction_title TEXT,
        prediction_slug TEXT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          b.id as bet_id,
          b.amount_bnb,
          b.position,
          b.created_at,
          COALESCE(p.nickname, 'Anonimo') as username,
          pred.title as prediction_title,
          pred.slug as prediction_slug
        FROM bets b
        LEFT JOIN profiles p ON p.id = b.user_id
        LEFT JOIN predictions pred ON pred.id = b.prediction_id
        ORDER BY b.created_at DESC
        LIMIT limit_count;
      END;
      $$;

      -- 3. Concedi i permessi necessari
      GRANT EXECUTE ON FUNCTION get_recent_bets(INTEGER) TO authenticated, anon;
    `;
    
    // Esegui lo script SQL usando il client admin
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    
    if (error) {
      console.error('❌ Errore nell\'esecuzione dello script SQL:', error.message);
      console.log('💡 Prova a eseguire manualmente il SQL nel Supabase Dashboard > SQL Editor');
      return;
    }
    
    console.log('✅ Funzione get_recent_bets creata con successo!');
    
    // Testa la funzione
    console.log('⏳ Testando la funzione...');
    const { data, error: testError } = await supabase.rpc('get_recent_bets', { limit_count: 3 });
    
    if (testError) {
      console.error('❌ Errore nel test della funzione:', testError.message);
      return;
    }
    
    console.log('✅ Test completato! Dati restituiti:', data);
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    console.log('💡 Prova a eseguire manualmente il SQL nel Supabase Dashboard > SQL Editor');
  }
}

createGetRecentBetsFunction();
