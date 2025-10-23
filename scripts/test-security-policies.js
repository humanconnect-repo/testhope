#!/usr/bin/env node

/**
 * SCRIPT DI TEST SICUREZZA POLICY PROFILES
 * ========================================
 * 
 * Questo script testa tutte le policy di sicurezza per verificare che:
 * 1. Gli utenti NON possano auto-promuoversi admin
 * 2. Gli utenti NON possano modificare profili di altri
 * 3. I campi critici siano protetti (signature, wallet_address, id)
 * 4. Solo il proprietario possa modificare il proprio profilo
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utenti di test
const USER_1 = '0x17EE2ca31a6811F5d4198bCE9afd1C1db3837A38'; // Non admin
const USER_2 = '0x7504349365e571f3978BDd5304042B3493C03cc4'; // Admin

async function testSecurityPolicies() {
  console.log('🔒 TEST SICUREZZA POLICY PROFILES');
  console.log('==================================\n');

  let allTestsPassed = true;

  // Test 1: Tentativo di auto-promozione admin
  console.log('1️⃣ Test: Auto-promozione admin (utente non admin)');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('wallet_address', USER_1)
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Auto-promozione admin permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 2: Tentativo di modificare profilo di altro utente
  console.log('\n2️⃣ Test: Modifica profilo di altro utente');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        nickname: 'HACKER',
        bio: 'Sono un hacker!'
      })
      .eq('wallet_address', USER_2) // Tenta di modificare l'admin
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Modifica profilo altrui permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 3: Tentativo di modificare wallet_address
  console.log('\n3️⃣ Test: Modifica wallet_address');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        wallet_address: '0xHACKED123456789'
      })
      .eq('wallet_address', USER_1)
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Modifica wallet_address permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 4: Tentativo di modificare signature
  console.log('\n4️⃣ Test: Modifica signature');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        signature: '0xFAKE_SIGNATURE_123456789'
      })
      .eq('wallet_address', USER_1)
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Modifica signature permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 5: Tentativo di modificare ID
  console.log('\n5️⃣ Test: Modifica ID');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        id: '0xHACKED_ID_123456789'
      })
      .eq('wallet_address', USER_1)
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Modifica ID permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 6: Tentativo di eliminare profilo (solo service role)
  console.log('\n6️⃣ Test: Eliminazione profilo (solo service role)');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('wallet_address', USER_1)
      .select();

    if (error) {
      console.log('✅ BLOCCATO (come previsto):', error.message);
    } else {
      console.log('❌ PERICOLO: Eliminazione profilo permessa!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ BLOCCATO (come previsto):', err.message);
  }

  // Test 7: Verifica che la lettura funzioni (dovrebbe essere permessa)
  console.log('\n7️⃣ Test: Lettura profili (dovrebbe essere permessa)');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_address, nickname, bio, is_admin')
      .limit(2);

    if (error) {
      console.log('❌ ERRORE: Lettura profili bloccata!', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ PERMESSO (come previsto):', data.length, 'profili letti');
    }
  } catch (err) {
    console.log('❌ ERRORE: Lettura profili bloccata!', err.message);
    allTestsPassed = false;
  }

  // Risultato finale
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TUTTI I TEST DI SICUREZZA SUPERATI!');
    console.log('✅ Le policy funzionano correttamente');
    console.log('✅ Il sistema è sicuro per la produzione');
  } else {
    console.log('🚨 ALCUNI TEST DI SICUREZZA FALLITI!');
    console.log('❌ Ci sono problemi di sicurezza da risolvere');
    console.log('❌ NON usare in produzione fino a risoluzione');
  }
  console.log('='.repeat(50));
}

// Esegui i test
testSecurityPolicies().catch(console.error);
