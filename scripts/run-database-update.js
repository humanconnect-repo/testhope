const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica le variabili d'ambiente da .env.local se esiste
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Controllo variabili d\'ambiente...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Mancante');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Presente' : '❌ Mancante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseUpdate() {
  try {
    console.log('🚀 Avvio aggiornamento database...');
    
    // Leggi il file SQL della migrazione
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Esecuzione script SQL...');
    
    // Esegui lo script SQL completo
    const { data, error } = await supabase.rpc('exec', { 
      sql: sqlContent 
    });
    
    if (error) {
      console.error('❌ Errore nell\'esecuzione SQL:', error);
      
      // Prova con un approccio alternativo - esegui comando per comando
      console.log('🔄 Tentativo con approccio alternativo...');
      await executeCommandByCommand(sqlContent);
    } else {
      console.log('✅ Database aggiornato con successo!');
      console.log('📄 Risultato:', data);
    }
    
  } catch (error) {
    console.error('💥 Errore durante l\'aggiornamento:', error);
  }
}

async function executeCommandByCommand(sqlContent) {
  // Dividi lo script in comandi separati
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
  
  console.log(`📝 Trovati ${commands.length} comandi SQL da eseguire`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (!command) continue;
    
    try {
      console.log(`\n🔄 Esecuzione comando ${i + 1}/${commands.length}...`);
      
      // Prova prima con rpc exec
      let { data, error } = await supabase.rpc('exec', { sql: command });
      
      if (error) {
        // Se fallisce, prova con query diretta
        console.log('⚠️  RPC exec fallito, provo con query diretta...');
        const { data: queryData, error: queryError } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', command);
        
        if (queryError) {
          console.error(`❌ Errore nel comando ${i + 1}:`, queryError.message);
          errorCount++;
        } else {
          console.log(`✅ Comando ${i + 1} eseguito con successo`);
          successCount++;
        }
      } else {
        console.log(`✅ Comando ${i + 1} eseguito con successo`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Errore nel comando ${i + 1}:`, err.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Risultati finali:`);
  console.log(`✅ Comandi eseguiti con successo: ${successCount}`);
  console.log(`❌ Comandi falliti: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('🎉 Database aggiornato con successo!');
  } else {
    console.log('⚠️  Alcuni comandi hanno fallito, ma il database potrebbe essere parzialmente aggiornato');
  }
}

// Esegui lo script
runDatabaseUpdate();
