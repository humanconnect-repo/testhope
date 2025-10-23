const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  console.error('Crea un file .env.local con:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSecurity() {
  console.log('🔒 Test di Sicurezza - Bella Napoli Admin Panel');
  console.log('=' .repeat(50));

  try {
    // 1. Test: Leggere predictions (dovrebbe funzionare)
    console.log('\n1️⃣ Test: Lettura predictions (dovrebbe funzionare)');
    const { data: predictions, error: readError } = await supabase
      .from('predictions')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log('❌ Errore lettura:', readError.message);
    } else {
      console.log('✅ Lettura OK:', predictions.length > 0 ? 'Trovate predictions' : 'Nessuna prediction');
    }

    // 2. Test: Tentativo UPDATE diretto (dovrebbe fallire)
    console.log('\n2️⃣ Test: UPDATE diretto (dovrebbe fallire)');
    const { data: updateData, error: updateError } = await supabase
      .from('predictions')
      .update({
        title: 'HACKED BY NON-ADMIN',
        updated_at: new Date().toISOString()
      })
      .eq('id', predictions[0]?.id || 'fake-id')
      .select();

    if (updateError) {
      console.log('✅ UPDATE bloccato (come previsto):', updateError.message);
    } else if (updateData && updateData.length > 0) {
      console.log('❌ PERICOLO: UPDATE riuscito senza permessi!');
    } else {
      console.log('✅ UPDATE bloccato (nessun dato modificato)');
    }

    // 3. Test: Tentativo RPC con wallet non-admin
    console.log('\n3️⃣ Test: RPC con wallet non-admin (dovrebbe fallire)');
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_prediction_admin', {
      prediction_id: predictions[0]?.id || 'fake-id',
      title: 'HACKED VIA RPC',
      description: 'Tentativo di hack',
      category: 'Crypto',
      closing_date: new Date().toISOString(),
      status: 'attiva',
      rules: 'Hack attempt',
      admin_wallet_address: '0x0000000000000000000000000000000000000000' // Wallet falso
    });

    if (rpcError) {
      console.log('✅ RPC bloccato (come previsto):', rpcError.message);
    } else if (rpcData === true) {
      console.log('❌ PERICOLO: RPC riuscito con wallet falso!');
    } else {
      console.log('✅ RPC bloccato (wallet non-admin)');
    }

    // 4. Test: Tentativo RPC con wallet admin (dovrebbe funzionare)
    console.log('\n4️⃣ Test: RPC con wallet admin (dovrebbe funzionare)');
    const { data: adminRpcData, error: adminRpcError } = await supabase.rpc('update_prediction_admin', {
      prediction_id: predictions[0]?.id || 'fake-id',
      title: 'Test Admin Update',
      description: 'Test di sicurezza admin',
      category: 'Crypto',
      closing_date: new Date().toISOString(),
      status: 'attiva',
      rules: 'Test rules',
      admin_wallet_address: '0x7504349365e571f3978BDd5304042B3493C03cc4' // Wallet admin reale
    });

    if (adminRpcError) {
      console.log('❌ RPC admin fallito:', adminRpcError.message);
    } else if (adminRpcData === true) {
      console.log('✅ RPC admin funziona correttamente');
    } else {
      console.log('⚠️ RPC admin restituito:', adminRpcData);
    }

    // 5. Test: Tentativo di creare prediction (dovrebbe fallire)
    console.log('\n5️⃣ Test: Creazione prediction (dovrebbe fallire)');
    const { data: insertData, error: insertError } = await supabase
      .from('predictions')
      .insert([{
        title: 'HACKED PREDICTION',
        description: 'Tentativo di creare prediction senza permessi',
        category: 'Crypto',
        closing_date: new Date().toISOString(),
        status: 'attiva',
        rules: 'Hack attempt'
      }])
      .select();

    if (insertError) {
      console.log('✅ Creazione bloccata (come previsto):', insertError.message);
    } else if (insertData && insertData.length > 0) {
      console.log('❌ PERICOLO: Creazione riuscita senza permessi!');
    } else {
      console.log('✅ Creazione bloccata (nessun dato creato)');
    }

    // 6. Test: Verifica admin status
    console.log('\n6️⃣ Test: Verifica status admin');
    const { data: adminCheck, error: adminCheckError } = await supabase.rpc('check_wallet_admin_status', {
      input_wallet_address: '0x7504349365e571f3978BDd5304042B3493C03cc4'
    });

    if (adminCheckError) {
      console.log('❌ Errore verifica admin:', adminCheckError.message);
    } else {
      console.log('✅ Status admin:', adminCheck ? 'ADMIN' : 'NON-ADMIN');
    }

    // 7. Test: Verifica wallet falso
    console.log('\n7️⃣ Test: Verifica wallet falso');
    const { data: fakeAdminCheck, error: fakeAdminCheckError } = await supabase.rpc('check_wallet_admin_status', {
      input_wallet_address: '0x0000000000000000000000000000000000000000'
    });

    if (fakeAdminCheckError) {
      console.log('❌ Errore verifica wallet falso:', fakeAdminCheckError.message);
    } else {
      console.log('✅ Status wallet falso:', fakeAdminCheck ? 'ADMIN (PERICOLO!)' : 'NON-ADMIN (OK)');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Test di sicurezza completati!');
    console.log('💡 Se vedi "PERICOLO" o "❌" in rosso, c\'è un problema di sicurezza!');

  } catch (error) {
    console.error('❌ Errore generale durante i test:', error);
  }
}

testSecurity();
