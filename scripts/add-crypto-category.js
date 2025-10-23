const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCryptoCategory() {
  try {
    console.log('⏳ Aggiungendo categoria Crypto...');
    
    // 1. Verifica le categorie esistenti
    console.log('📊 Categorie esistenti:');
    const { data: existingCategories, error: catError } = await supabase
      .from('predictions')
      .select('category')
      .not('category', 'is', null);
    
    if (catError) throw catError;
    
    const uniqueCategories = [...new Set(existingCategories.map(p => p.category))];
    console.log(uniqueCategories);
    
    // 2. Aggiungi una prediction di esempio per Crypto
    console.log('⏳ Aggiungendo prediction Crypto di esempio...');
    const { data: newPrediction, error: insertError } = await supabase
      .from('predictions')
      .insert({
        title: 'Bitcoin raggiungerà $100,000 entro fine 2024?',
        description: 'Con il recente rally di Bitcoin e l\'approvazione degli ETF, molti analisti prevedono che BTC possa raggiungere i $100,000 entro la fine del 2024. Cosa ne pensi?',
        slug: 'bitcoin-raggiungera-100000-entro-fine-2024',
        category: 'Crypto',
        closing_date: '2024-12-31T23:59:59Z',
        status: 'attiva',
        rules: 'La prediction si chiude il 31 dicembre 2024. Bitcoin deve raggiungere almeno $100,000 su almeno un exchange principale per essere considerato valido.'
      })
      .select();
    
    if (insertError) throw insertError;
    
    console.log('✅ Prediction Crypto aggiunta con successo!');
    console.log('📊 Dati:', newPrediction);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

addCryptoCategory();
