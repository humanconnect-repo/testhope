const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica le variabili d'ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  console.error('Assicurati che .env.local contenga NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crea client Supabase con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLScript() {
  try {
    console.log('🚀 Avvio esecuzione script SQL...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividi lo script in singole query (separate da ;)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log(`📝 Trovate ${queries.length} query da eseguire`);
    
    // Esegui ogni query
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.trim()) {
        console.log(`⏳ Eseguendo query ${i + 1}/${queries.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: query 
          });
          
          if (error) {
            console.error(`❌ Errore nella query ${i + 1}:`, error.message);
            // Continua con le altre query
          } else {
            console.log(`✅ Query ${i + 1} eseguita con successo`);
          }
        } catch (err) {
          console.error(`❌ Errore nella query ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Script completato!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    process.exit(1);
  }
}

// Funzione alternativa usando l'API REST
async function runSQLViaREST() {
  try {
    console.log('🚀 Avvio esecuzione script SQL via REST API...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Usa l'API REST per eseguire lo script
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql_query: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('✅ Script eseguito con successo via REST API!');
    } else {
      const error = await response.text();
      console.error('❌ Errore:', error);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Prova prima con RPC, poi con REST
runSQLScript().catch(() => {
  console.log('🔄 Tentativo con REST API...');
  runSQLViaREST();
});
