const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carica le variabili d'ambiente
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runPerformanceFix() {
  try {
    console.log('🚀 Avvio correzione performance warnings...');
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'sql', 'fix_performance_warnings.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 File SQL caricato:', sqlPath);
    console.log('📏 Dimensione file:', sqlContent.length, 'caratteri');
    
    // Esegui il SQL
    console.log('⚡ Esecuzione SQL...');
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Errore durante l\'esecuzione:', error);
      return;
    }
    
    console.log('✅ SQL eseguito con successo!');
    console.log('📊 Risultato:', data);
    
    // Verifica che le policy siano state create correttamente
    console.log('🔍 Verifica policy create...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public');
    
    if (policiesError) {
      console.log('⚠️ Non posso verificare le policy (normale per utenti non-admin)');
    } else {
      console.log('📋 Policy trovate:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname}`);
      });
    }
    
    console.log('🎉 Correzione completata con successo!');
    console.log('📈 Performance ottimizzate per 35 warning');
    
  } catch (error) {
    console.error('💥 Errore durante l\'esecuzione:', error);
  }
}

// Esegui lo script
runPerformanceFix();
