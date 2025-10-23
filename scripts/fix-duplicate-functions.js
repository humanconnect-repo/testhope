const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  console.error('Assicurati che NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY siano configurate in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateFunctions() {
  console.log('🔧 Risoluzione conflitto funzioni duplicate update_prediction_admin...');
  
  try {
    // 1. Prima verifichiamo le funzioni esistenti
    console.log('📋 Verifica funzioni esistenti...');
    const { data: functions, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as full_signature,
            p.oid
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE p.proname = 'update_prediction_admin'
            AND n.nspname = 'public'
          ORDER BY p.oid;
        `
      });

    if (checkError) {
      console.log('⚠️  Non posso verificare le funzioni esistenti (normale se non hai exec_sql)');
    } else {
      console.log('Funzioni trovate:', functions);
    }

    // 2. Rimuoviamo le funzioni duplicate
    console.log('🗑️  Rimozione funzioni duplicate...');
    
    const dropFunctionsSQL = `
      DROP FUNCTION IF EXISTS update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);
      DROP FUNCTION IF EXISTS update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropFunctionsSQL });
    
    if (dropError) {
      console.log('⚠️  Non posso rimuovere le funzioni automaticamente');
      console.log('📝 Esegui manualmente nel Supabase SQL Editor:');
      console.log(dropFunctionsSQL);
    } else {
      console.log('✅ Funzioni duplicate rimosse');
    }

    // 3. Creiamo la funzione corretta
    console.log('🔨 Creazione funzione corretta...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_prediction_admin(
        prediction_id UUID,
        title TEXT,
        description TEXT,
        category TEXT,
        closing_date TIMESTAMP WITH TIME ZONE,
        closing_bid TIMESTAMP WITH TIME ZONE,
        status TEXT,
        rules TEXT,
        admin_wallet_address TEXT
      )
      RETURNS BOOLEAN
      AS $$
      DECLARE
        is_admin BOOLEAN;
        prediction_exists BOOLEAN;
      BEGIN
        -- Verifica che l'utente sia admin
        SELECT check_wallet_admin_status(admin_wallet_address) INTO is_admin;
        
        IF NOT is_admin THEN
          RAISE EXCEPTION 'Accesso negato: solo gli admin possono aggiornare le prediction';
        END IF;
        
        -- Verifica che la prediction esista
        SELECT EXISTS(SELECT 1 FROM predictions WHERE id = prediction_id) INTO prediction_exists;
        
        IF NOT prediction_exists THEN
          RAISE EXCEPTION 'Prediction non trovata con ID: %', prediction_id;
        END IF;
        
        -- Aggiorna la prediction
        UPDATE predictions 
        SET 
          title = update_prediction_admin.title,
          description = update_prediction_admin.description,
          category = update_prediction_admin.category,
          closing_date = update_prediction_admin.closing_date,
          closing_bid = update_prediction_admin.closing_bid,
          status = update_prediction_admin.status,
          rules = update_prediction_admin.rules,
          updated_at = NOW()
        WHERE id = prediction_id;
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (createError) {
      console.log('⚠️  Non posso creare la funzione automaticamente');
      console.log('📝 Esegui manualmente nel Supabase SQL Editor:');
      console.log(createFunctionSQL);
    } else {
      console.log('✅ Funzione corretta creata');
    }

    // 4. Concediamo i permessi
    console.log('🔐 Concessione permessi...');
    
    const grantSQL = `
      GRANT EXECUTE ON FUNCTION update_prediction_admin(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO authenticated, anon;
    `;

    const { error: grantError } = await supabase.rpc('exec_sql', { sql: grantSQL });
    
    if (grantError) {
      console.log('⚠️  Non posso concedere i permessi automaticamente');
      console.log('📝 Esegui manualmente nel Supabase SQL Editor:');
      console.log(grantSQL);
    } else {
      console.log('✅ Permessi concessi');
    }

    console.log('\n🎉 Risoluzione conflitto completata!');
    console.log('📝 Se alcuni passaggi sono falliti, esegui manualmente il file:');
    console.log('   scripts/sql/fix_duplicate_functions.sql');
    console.log('   nel Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Errore durante la risoluzione:', error);
    console.log('\n📝 Esegui manualmente il file:');
    console.log('   scripts/sql/fix_duplicate_functions.sql');
    console.log('   nel Supabase SQL Editor');
  }
}

fixDuplicateFunctions();
