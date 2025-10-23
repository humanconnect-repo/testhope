#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalSecurityTest() {
  console.log('🔒 TEST FINALE SICUREZZA');
  console.log('========================\n');

  // Conta profili prima del test
  const { data: beforeData } = await supabase
    .from('profiles')
    .select('wallet_address')
    .limit(10);
  
  console.log('📊 Profili prima del test:', beforeData.length);
  beforeData.forEach(p => console.log('  -', p.wallet_address));

  // Test eliminazione
  console.log('\n🗑️ Tentativo eliminazione...');
  const { data: deleteData, error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('wallet_address', '0x17EE2ca31a6811F5d4198bCE9afd1C1db3837A38')
    .select();

  console.log('Risultato eliminazione:', { 
    data: deleteData, 
    error: deleteError,
    recordsDeleted: deleteData ? deleteData.length : 0
  });

  // Conta profili dopo il test
  const { data: afterData } = await supabase
    .from('profiles')
    .select('wallet_address')
    .limit(10);
  
  console.log('\n📊 Profili dopo il test:', afterData.length);
  afterData.forEach(p => console.log('  -', p.wallet_address));

  // Verifica finale
  if (beforeData.length === afterData.length) {
    console.log('\n✅ SICUREZZA CONFERMATA: Nessun profilo eliminato!');
    console.log('✅ Policy DELETE funziona correttamente!');
  } else {
    console.log('\n❌ PERICOLO: Profili eliminati!');
  }
}

finalSecurityTest().catch(console.error);
