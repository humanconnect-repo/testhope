#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDeleteTest() {
  console.log('🔍 DEBUG: Test eliminazione profilo');
  
  const USER_1 = '0x17EE2ca31a6811F5d4198bCE9afd1C1db3837A38';
  
  try {
    console.log('Tentativo eliminazione profilo...');
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('wallet_address', USER_1)
      .select();

    console.log('Risultato:', { data, error });
    
    if (error) {
      console.log('✅ ERRORE (come previsto):', error.message);
      console.log('✅ Codice errore:', error.code);
    } else {
      console.log('❌ PERICOLO: Eliminazione riuscita!', data);
    }
  } catch (err) {
    console.log('✅ ECCEZIONE (come previsto):', err.message);
  }
}

debugDeleteTest().catch(console.error);
