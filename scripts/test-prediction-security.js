#!/usr/bin/env node

/**
 * SCRIPT DI TEST SICUREZZA PREDICTION
 * ===================================
 * 
 * Questo script testa la sicurezza delle prediction per verificare che:
 * 1. Un utente normale NON possa modificare le prediction
 * 2. Un utente normale NON possa creare prediction
 * 3. Solo gli admin possano gestire le prediction
 * 4. Le RPC functions abbiano controlli di sicurezza corretti
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

async function testPredictionSecurity() {
  console.log('🔒 TEST SICUREZZA PREDICTION');
  console.log('============================\n');

  let allTestsPassed = true;

  // Test 1: Verifica prediction esistenti
  console.log('1️⃣ Verifica prediction esistenti:');
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (predictionsError) {
    console.log('❌ Errore lettura prediction:', predictionsError.message);
    allTestsPassed = false;
  } else {
    console.log('✅ Prediction trovate:', predictions.length);
    predictions.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.status})`);
    });
  }

  // Test 2: Tentativo di modifica prediction da utente normale (dovrebbe fallire)
  console.log('\n2️⃣ Test: Modifica prediction da utente normale (dovrebbe fallire)');
  if (predictions && predictions.length > 0) {
    const firstPrediction = predictions[0];
    try {
      const { data, error } = await supabase.rpc('update_prediction_admin', {
        prediction_id: firstPrediction.id,
        title: 'HACKED PREDICTION',
        description: 'Questa prediction è stata hackerata!',
        category: 'HACKED',
        closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        closing_bid: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'hacked',
        rules: 'Regole hackerate!',
        admin_wallet_address: USER_WALLET  // Wallet utente normale (NON admin)
      });

      if (error) {
        console.log('✅ SICUREZZA OK: Modifica prediction bloccata!', error.message);
      } else {
        console.log('❌ VULNERABILITÀ: Modifica prediction riuscita!', data);
        allTestsPassed = false;
      }
    } catch (err) {
      console.log('✅ SICUREZZA OK: Modifica prediction bloccata!', err.message);
    }
  } else {
    console.log('⚠️  Nessuna prediction trovata per il test');
  }

  // Test 3: Tentativo di creazione prediction da utente normale (dovrebbe fallire)
  console.log('\n3️⃣ Test: Creazione prediction da utente normale (dovrebbe fallire)');
  try {
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        title: 'Prediction Hackerata',
        description: 'Questa prediction è stata creata da un utente normale!',
        category: 'HACKED',
        closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        closing_bid: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        rules: 'Regole hackerate!',
        created_by: USER_WALLET  // Wallet utente normale
      })
      .select();

    if (error) {
      console.log('✅ SICUREZZA OK: Creazione prediction bloccata!', error.message);
    } else {
      console.log('❌ VULNERABILITÀ: Creazione prediction riuscita!', data);
      allTestsPassed = false;
    }
  } catch (err) {
    console.log('✅ SICUREZZA OK: Creazione prediction bloccata!', err.message);
  }

  // Test 4: Tentativo di modifica diretta prediction da utente normale (dovrebbe fallire)
  console.log('\n4️⃣ Test: Modifica diretta prediction da utente normale (dovrebbe fallire)');
  if (predictions && predictions.length > 0) {
    const firstPrediction = predictions[0];
    try {
      const { data, error } = await supabase
        .from('predictions')
        .update({
          title: 'DIRECT HACK ATTEMPT',
          description: 'Tentativo di modifica diretta!'
        })
        .eq('id', firstPrediction.id)
        .select();

      if (error) {
        console.log('✅ SICUREZZA OK: Modifica diretta bloccata!', error.message);
      } else {
        console.log('❌ VULNERABILITÀ: Modifica diretta riuscita!', data);
        allTestsPassed = false;
      }
    } catch (err) {
      console.log('✅ SICUREZZA OK: Modifica diretta bloccata!', err.message);
    }
  }

  // Test 5: Verifica che le prediction non siano state modificate
  console.log('\n5️⃣ Verifica che le prediction non siano state modificate:');
  const { data: finalPredictions, error: finalError } = await supabase
    .from('predictions')
    .select('id, title, status')
    .order('created_at', { ascending: false })
    .limit(3);

  if (finalError) {
    console.log('❌ Errore lettura prediction finali:', finalError.message);
  } else {
    console.log('✅ Prediction finali (dovrebbero essere invariate):');
    finalPredictions.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.status})`);
    });
  }

  // Test 6: Verifica che non ci siano prediction "hackerate"
  console.log('\n6️⃣ Verifica assenza di prediction "hackerate":');
  const { data: hackedPredictions, error: hackedError } = await supabase
    .from('predictions')
    .select('id, title, description')
    .or('title.ilike.%HACKED%,description.ilike.%hackerata%');

  if (hackedError) {
    console.log('❌ Errore ricerca prediction hackerate:', hackedError.message);
  } else if (hackedPredictions.length === 0) {
    console.log('✅ Nessuna prediction "hackerata" trovata - SICUREZZA OK!');
  } else {
    console.log('❌ VULNERABILITÀ: Prediction "hackerate" trovate!');
    hackedPredictions.forEach(p => {
      console.log(`  - ${p.title}: ${p.description}`);
    });
    allTestsPassed = false;
  }

  // Risultato finale
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 TUTTI I TEST DI SICUREZZA PREDICTION SUPERATI!');
    console.log('✅ Le prediction sono protette');
    console.log('✅ Solo gli admin possono gestire le prediction');
    console.log('✅ Gli utenti normali non possono modificare/creare prediction');
  } else {
    console.log('🚨 ALCUNI TEST DI SICUREZZA PREDICTION FALLITI!');
    console.log('❌ Ci sono problemi di sicurezza nelle prediction da risolvere');
  }
  console.log('='.repeat(50));
}

// Esegui i test
testPredictionSecurity().catch(console.error);
