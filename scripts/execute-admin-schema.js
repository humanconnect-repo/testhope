const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeAdminSchema() {
  try {
    console.log('🚀 Avvio esecuzione schema admin...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividi lo script in comandi separati (per evitare errori di esecuzione)
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
        console.log(`📄 ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (error) {
          console.error(`❌ Errore nel comando ${i + 1}:`, error.message);
          errorCount++;
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
      console.log('🎉 Schema admin creato con successo!');
    } else {
      console.log('⚠️  Alcuni comandi hanno fallito, controlla i log sopra');
    }
    
  } catch (error) {
    console.error('💥 Errore durante l\'esecuzione:', error);
  }
}

// Funzione alternativa per eseguire SQL direttamente
async function executeSQLDirect() {
  try {
    console.log('🚀 Esecuzione diretta SQL...');
    
    // Prima creiamo la funzione exec_sql se non esiste
    const createExecFunction = `
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
    
    const { error: funcError } = await supabase.rpc('exec_sql', { 
      sql_query: createExecFunction 
    });
    
    if (funcError) {
      console.log('ℹ️  Funzione exec_sql già esistente o errore:', funcError.message);
    }
    
    // Ora eseguiamo lo schema principale
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Esecuzione schema completo...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });
    
    if (error) {
      console.error('❌ Errore nell\'esecuzione:', error);
    } else {
      console.log('✅ Schema eseguito con successo!');
      console.log('📄 Risultato:', data);
    }
    
  } catch (error) {
    console.error('💥 Errore durante l\'esecuzione diretta:', error);
  }
}

// Esegui lo script
executeSQLDirect();
