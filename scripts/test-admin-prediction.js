#!/usr/bin/env node

/**
 * TEST ADMIN PREDICTION - Verifica che gli admin possano modificare prediction
 * ===========================================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_WALLET = '0x7D03E4E68017fdf5240Ca3c2358d72370e5D6b77';

async function testAdminPrediction() {
  console.log('👑 TEST ADMIN PREDICTION');
  console.log('========================\n');

  // 1. Verifica prediction esistenti
  console.log('1️⃣ Verifica prediction esistenti:');
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('id, title, status')
    .order('created_at', { ascending: false })
    .limit(1);

  if (predictionsError) {
    console.log('❌ Errore lettura prediction:', predictionsError.message);
    return;
  }

  if (!predictions || predictions.length === 0) {
    console.log('⚠️  Nessuna prediction trovata per il test');
    return;
  }

  const testPrediction = predictions[0];
  console.log(`✅ Prediction trovata: "${testPrediction.title}"`);

  // 2. Test: Modifica prediction da admin (dovrebbe funzionare)
  console.log('\n2️⃣ Test: Modifica prediction da admin (dovrebbe funzionare)');
  try {
    const { data, error } = await supabase.rpc('update_prediction_admin', {
      prediction_id: testPrediction.id,
      title: 'Prediction Modificata da Admin',
      description: 'Questa prediction è stata modificata correttamente da un admin!',
      category: 'Test',
      closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      closing_bid: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'attiva',
      rules: 'Regole di test per admin',
      admin_wallet_address: ADMIN_WALLET
    });

    if (error) {
      console.log('❌ ERRORE: Modifica admin fallita!', error.message);
    } else {
      console.log('✅ SUCCESSO: Modifica admin riuscita!', data);
    }
  } catch (err) {
    console.log('❌ ERRORE: Modifica admin fallita!', err.message);
  }

  // 3. Verifica risultato finale
  console.log('\n3️⃣ Verifica risultato finale:');
  const { data: finalPrediction, error: finalError } = await supabase
    .from('predictions')
    .select('id, title, description')
    .eq('id', testPrediction.id)
    .single();

  if (finalError) {
    console.log('❌ Errore lettura prediction finale:', finalError.message);
  } else {
    console.log('✅ Prediction finale:');
    console.log(`  - Titolo: ${finalPrediction.title}`);
    console.log(`  - Descrizione: ${finalPrediction.description}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Test admin prediction completato!');
  console.log('='.repeat(50));
}

testAdminPrediction().catch(console.error);
