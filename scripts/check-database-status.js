const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Controllo stato del database...');
    
    // Controlla se la tabella predictions esiste
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .limit(1);
    
    if (predError) {
      console.log('❌ Tabella predictions non esiste:', predError.message);
    } else {
      console.log('✅ Tabella predictions esiste');
    }
    
    // Controlla se la tabella bets esiste
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .limit(1);
    
    if (betsError) {
      console.log('❌ Tabella bets non esiste:', betsError.message);
    } else {
      console.log('✅ Tabella bets esiste');
    }
    
    // Controlla se la tabella comments esiste
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.log('❌ Tabella comments non esiste:', commentsError.message);
    } else {
      console.log('✅ Tabella comments esiste');
    }
    
    // Controlla se la colonna is_admin esiste in profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('is_admin')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Colonna is_admin non esiste in profiles:', profilesError.message);
    } else {
      console.log('✅ Colonna is_admin esiste in profiles');
    }
    
    console.log('\n📊 Riepilogo:');
    console.log('- Se tutte le tabelle esistono, il database è già aggiornato');
    console.log('- Se mancano tabelle, dobbiamo eseguire lo script SQL');
    
  } catch (error) {
    console.error('💥 Errore durante il controllo:', error);
  }
}

checkDatabaseStatus();
