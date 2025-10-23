const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  console.error('Assicurati di avere NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRecentBetsRPC() {
  try {
    console.log('⏳ Testando la funzione get_recent_bets...');
    
    // Testa la funzione RPC
    const { data, error } = await supabase.rpc('get_recent_bets', { limit_count: 5 });
    
    if (error) {
      console.error('❌ Errore nella chiamata RPC:', error.message);
      console.log('💡 Assicurati di aver eseguito il SQL nel Supabase Dashboard');
      return;
    }
    
    console.log('✅ RPC chiamata con successo!');
    console.log('📊 Dati restituiti:', JSON.stringify(data, null, 2));
    
    if (data && data.length > 0) {
      console.log(`\n📈 Trovate ${data.length} scommesse recenti:`);
      data.forEach((bet, index) => {
        console.log(`${index + 1}. ${bet.username} - ${bet.amount_bnb} BNB (${bet.position}) - ${bet.prediction_title}`);
      });
    } else {
      console.log('ℹ️  Nessuna scommessa trovata nel database');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

testRecentBetsRPC();
