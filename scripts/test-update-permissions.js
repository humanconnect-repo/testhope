const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdatePermissions() {
  console.log('🧪 Testando permessi UPDATE...');
  
  try {
    // Prima leggiamo una prediction esistente
    const { data: predictions, error: readError } = await supabase
      .from('predictions')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Errore lettura predictions:', readError);
      return;
    }
    
    if (!predictions || predictions.length === 0) {
      console.log('❌ Nessuna prediction trovata');
      return;
    }
    
    const prediction = predictions[0];
    console.log('📖 Prediction trovata:', {
      id: prediction.id,
      title: prediction.title,
      updated_at: prediction.updated_at
    });
    
    // Proviamo un UPDATE semplice
    const newTitle = `Test Update ${Date.now()}`;
    console.log('🔄 Tentativo UPDATE con titolo:', newTitle);
    
    const { data: updateData, error: updateError } = await supabase
      .from('predictions')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction.id)
      .select();
    
    console.log('📊 Risultato UPDATE:', {
      data: updateData,
      error: updateError
    });
    
    if (updateError) {
      console.error('❌ Errore UPDATE:', updateError);
      return;
    }
    
    // Verifichiamo se l'UPDATE è andato a buon fine
    const { data: verifyData, error: verifyError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', prediction.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Errore verifica:', verifyError);
      return;
    }
    
    console.log('✅ Verifica finale:', {
      id: verifyData.id,
      title: verifyData.title,
      updated_at: verifyData.updated_at
    });
    
    if (verifyData.title === newTitle) {
      console.log('🎉 UPDATE funziona correttamente!');
    } else {
      console.log('❌ UPDATE non ha funzionato. Titolo attuale:', verifyData.title);
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

testUpdatePermissions();
