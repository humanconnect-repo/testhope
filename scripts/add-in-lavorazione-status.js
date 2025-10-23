const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addInLavorazioneStatus() {
  try {
    console.log('🚀 Aggiunta status "In lavorazione"...');
    
    // Prima controlliamo se lo status esiste già
    const { data: existingPredictions, error: checkError } = await supabase
      .from('predictions')
      .select('status')
      .eq('status', 'in_lavorazione')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Errore nel controllo status:', checkError.message);
      return;
    }
    
    if (existingPredictions && existingPredictions.length > 0) {
      console.log('✅ Status "in_lavorazione" già presente nel database');
      return;
    }
    
    // Aggiungiamo lo status "in_lavorazione" al constraint CHECK
    console.log('📝 Aggiornamento constraint CHECK per includere "in_lavorazione"...');
    
    // Prima rimuoviamo il constraint esistente
    const dropConstraintSQL = `
      ALTER TABLE predictions 
      DROP CONSTRAINT IF EXISTS predictions_status_check;
    `;
    
    // Poi aggiungiamo il nuovo constraint con "in_lavorazione"
    const addConstraintSQL = `
      ALTER TABLE predictions 
      ADD CONSTRAINT predictions_status_check 
      CHECK (status IN ('attiva', 'scaduta', 'bloccata', 'in_lavorazione'));
    `;
    
    console.log('⚠️  Nota: Le modifiche ai constraint richiedono accesso diretto al database');
    console.log('📋 Esegui manualmente questi comandi SQL in Supabase SQL Editor:');
    console.log('\n1. Rimuovi constraint esistente:');
    console.log(dropConstraintSQL);
    console.log('\n2. Aggiungi nuovo constraint:');
    console.log(addConstraintSQL);
    
    console.log('\n✅ Script completato! Esegui i comandi SQL sopra in Supabase SQL Editor');
    
  } catch (error) {
    console.error('💥 Errore durante l\'aggiornamento:', error);
  }
}

addInLavorazioneStatus();
