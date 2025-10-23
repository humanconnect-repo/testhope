#!/usr/bin/env node

/**
 * SCRIPT DI TEST SICUREZZA RPC FUNCTIONS
 * ======================================
 * 
 * Questo script testa la sicurezza delle RPC functions per verificare che:
 * 1. Un utente normale NON possa modificare il profilo dell'admin
 * 2. Un utente normale possa modificare solo il proprio profilo
 * 3. Le RPC functions abbiano controlli di sicurezza corretti
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carica variabili d'ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Wallet di test
const ADMIN_WALLET = '0x7D03E4E68017fdf5240Ca3c2358d72370e5D6b77';
const USER_WALLET = '0x7504349365e571f3978BDd5304042B3493C03cc4';

async function testSecurityRPC() {
  console.log('🔒 TEST SICUREZZA RPC FUNCTIONS');
  console.log('================================\n');

  let allTestsPassed = true;

  // Test 1: Verifica stato iniziale
  console.log('1️⃣ Verifica stato iniziale profili:');
  const { data: initialProfiles, error: initialError } = await supabase
    .from('profiles')
    .select('wallet_address, username, is_admin')
    .in('wallet_address', [ADMIN_WALLET, USER_WALLET])
    .order('is_admin', { ascending: false });

  if (initialError) {
    console.log('❌ Errore lettura profili:', initialError.message);
    allTestsPassed = false;
  } else {
    console.log('✅ Profili letti correttamente:');
    initialProfiles.forEach(p => {
      console.log(`  - ${p.wallet_address}: ${p.username} (admin: ${p.is_admin})`);
    });
  }

  // Test 2: Tentativo di modifica profilo admin da utente normale (dovrebbe fallire)
  console.log('\n2️⃣ Test: Modifica profilo admin da utente normale (dovrebbe fallire)');
  try {
    const { data, error } = await supabase.rpc('update_profile_secure', {
      p_wallet_address: ADMIN_WALLET,  // Wallet admin
      p_avatar_url: 'https://hacked-avatar.com',
      p_bio: 'Sono stato hackerato da utente normale!',
      p_nickname: 'HACKED_ADMIN',
      p_caller_wallet: USER_WALLET  // Wallet utente normale
    });

    if (error) {
      console.log('✅ SICUREZZA OK: Modifica bloccata!', error.message);
    } else {
      console.log('❌ VULNERABILITÀ: Modifica riuscita!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ SICUREZZA OK: Modifica bloccata!', err.message);
  }

  // Test 3: Modifica profilo proprio da utente normale (dovrebbe funzionare)
  console.log('\n3️⃣ Test: Modifica profilo proprio da utente normale (dovrebbe funzionare)');
  try {
    const { data, error } = await supabase.rpc('update_profile_secure', {
      p_wallet_address: USER_WALLET,  // Wallet utente normale
      p_avatar_url: 'https://my-avatar.com',
      p_bio: 'Questo è il mio profilo!',
      p_nickname: 'Utente Test',
      p_caller_wallet: USER_WALLET  // Stesso wallet (proprio profilo)
    });

    if (error) {
      console.log('❌ ERRORE: Modifica profilo proprio fallita!', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ PERMESSO: Modifica profilo proprio riuscita!', data);
    }
  } catch (err) {
    console.log('❌ ERRORE: Modifica profilo proprio fallita!', err.message);
    allTestsPassed = false;
  }

  // Test 4: Verifica stato finale
  console.log('\n4️⃣ Verifica stato finale profili:');
  const { data: finalProfiles, error: finalError } = await supabase
    .from('profiles')
    .select('wallet_address, username, is_admin')
    .in('wallet_address', [ADMIN_WALLET, USER_WALLET])
    .order('is_admin', { ascending: false });

  if (finalError) {
    console.log('❌ Errore lettura profili finali:', finalError.message);
  } else {
    console.log('✅ Profili finali:');
    finalProfiles.forEach(p => {
      console.log(`  - ${p.wallet_address}: ${p.username} (admin: ${p.is_admin})`);
    });
  }

  // Risultato finale
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TUTTI I TEST DI SICUREZZA SUPERATI!');
    console.log('✅ Le RPC functions sono sicure');
    console.log('✅ Il sistema è protetto contro modifiche non autorizzate');
  } else {
    console.log('🚨 ALCUNI TEST DI SICUREZZA FALLITI!');
    console.log('❌ Ci sono problemi di sicurezza da risolvere');
  }
  console.log('='.repeat(50));
}

// Esegui i test
testSecurityRPC().catch(console.error);
