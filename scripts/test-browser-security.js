const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  process.exit(1);
}

// Simula un client browser normale (senza autenticazione)
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrowserSecurity() {
  console.log('🌐 Test di Sicurezza Browser - Simulazione Utente Normale');
  console.log('=' .repeat(60));

  try {
    // 1. Test: Accesso diretto alla tabella predictions
    console.log('\n1️⃣ Test: Lettura predictions (utente non autenticato)');
    const { data: predictions, error: readError } = await supabase
      .from('predictions')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log('❌ Lettura bloccata:', readError.message);
    } else {
      console.log('✅ Lettura permessa:', predictions.length > 0 ? 'Trovate predictions' : 'Nessuna prediction');
    }

    // 2. Test: Tentativo di modifica prediction
    console.log('\n2️⃣ Test: Modifica prediction (utente non autenticato)');
    const { data: updateData, error: updateError } = await supabase
      .from('predictions')
      .update({
        title: 'HACKED BY BROWSER USER',
        updated_at: new Date().toISOString()
      })
      .eq('id', predictions[0]?.id || 'fake-id')
      .select();

    if (updateError) {
      console.log('✅ Modifica bloccata (come previsto):', updateError.message);
    } else if (updateData && updateData.length > 0) {
      console.log('❌ PERICOLO: Modifica riuscita senza autenticazione!');
    } else {
      console.log('✅ Modifica bloccata (nessun dato modificato)');
    }

    // 3. Test: Tentativo di creazione prediction
    console.log('\n3️⃣ Test: Creazione prediction (utente non autenticato)');
    const { data: insertData, error: insertError } = await supabase
      .from('predictions')
      .insert([{
        title: 'HACKED PREDICTION FROM BROWSER',
        description: 'Tentativo di creare prediction senza autenticazione',
        category: 'Crypto',
        closing_date: new Date().toISOString(),
        status: 'attiva',
        rules: 'Hack attempt from browser'
      }])
      .select();

    if (insertError) {
      console.log('✅ Creazione bloccata (come previsto):', insertError.message);
    } else if (insertData && insertData.length > 0) {
      console.log('❌ PERICOLO: Creazione riuscita senza autenticazione!');
    } else {
      console.log('✅ Creazione bloccata (nessun dato creato)');
    }

    // 4. Test: Tentativo di accesso alla funzione RPC
    console.log('\n4️⃣ Test: Accesso RPC update_prediction_admin (utente non autenticato)');
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_prediction_admin', {
      prediction_id: predictions[0]?.id || 'fake-id',
      title: 'HACKED VIA RPC FROM BROWSER',
      description: 'Tentativo di hack via RPC',
      category: 'Crypto',
      closing_date: new Date().toISOString(),
      status: 'attiva',
      rules: 'Hack attempt via RPC',
      admin_wallet_address: '0x0000000000000000000000000000000000000000'
    });

    if (rpcError) {
      console.log('✅ RPC bloccato (come previsto):', rpcError.message);
    } else if (rpcData === true) {
      console.log('❌ PERICOLO: RPC riuscito senza autenticazione!');
    } else {
      console.log('✅ RPC bloccato (utente non autenticato)');
    }

    // 5. Test: Tentativo di accesso alla funzione check_wallet_admin_status
    console.log('\n5️⃣ Test: Verifica admin status (utente non autenticato)');
    const { data: adminCheck, error: adminCheckError } = await supabase.rpc('check_wallet_admin_status', {
      input_wallet_address: '0x7504349365e571f3978BDd5304042B3493C03cc4'
    });

    if (adminCheckError) {
      console.log('✅ Verifica admin bloccata (come previsto):', adminCheckError.message);
    } else {
      console.log('⚠️ Verifica admin permessa:', adminCheck ? 'ADMIN' : 'NON-ADMIN');
    }

    // 6. Test: Tentativo di accesso alla tabella profiles
    console.log('\n6️⃣ Test: Accesso tabella profiles (utente non autenticato)');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('✅ Accesso profiles bloccato (come previsto):', profilesError.message);
    } else {
      console.log('⚠️ Accesso profiles permesso:', profiles.length > 0 ? 'Trovati profili' : 'Nessun profilo');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Test di sicurezza browser completati!');
    console.log('💡 Se vedi "PERICOLO" o "❌" in rosso, c\'è un problema di sicurezza!');
    console.log('💡 Se vedi "⚠️" in giallo, potrebbe essere un problema di configurazione RLS!');

  } catch (error) {
    console.error('❌ Errore generale durante i test:', error);
  }
}

testBrowserSecurity();
