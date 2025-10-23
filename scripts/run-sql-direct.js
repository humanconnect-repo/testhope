const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica le variabili d'ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
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
    
    // Esegui ogni query usando l'API REST
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.trim()) {
        console.log(`⏳ Eseguendo query ${i + 1}/${queries.length}...`);
        
        try {
          // Usa l'API REST per eseguire la query
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
              sql: query
            })
          });
          
          if (response.ok) {
            console.log(`✅ Query ${i + 1} eseguita con successo`);
          } else {
            const error = await response.text();
            console.error(`❌ Errore nella query ${i + 1}:`, error);
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

// Funzione alternativa usando l'API SQL di Supabase
async function runSQLViaSQLAPI() {
  try {
    console.log('🚀 Avvio esecuzione script SQL via SQL API...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'sql', 'admin_predictions_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Usa l'API SQL di Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Script eseguito con successo via SQL API!');
      console.log('Risultato:', result);
    } else {
      const error = await response.text();
      console.error('❌ Errore:', error);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Prova prima con l'API SQL
runSQLViaSQLAPI().catch(() => {
  console.log('🔄 Tentativo con approccio alternativo...');
  runSQLScript();
});
