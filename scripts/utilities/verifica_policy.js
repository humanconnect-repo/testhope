#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificaPolicy() {
  console.log('🔒 VERIFICA POLICY RLS (ROW LEVEL SECURITY)');
  console.log('=' .repeat(60));
  
  try {
    // 1. VERIFICA POLICY ESISTENTI
    console.log('\n📋 1. POLICY RLS ATTIVE');
    console.log('-'.repeat(40));
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename, 
            policyname, 
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        ` 
      });

    if (policiesError) {
      console.error('❌ Errore nel recupero delle policy:', policiesError);
      console.log('💡 Prova a eseguire questo nella dashboard Supabase:');
      console.log(`
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
      `);
    } else {
      if (policies && policies.length > 0) {
        console.log(`✅ Trovate ${policies.length} policy RLS:`);
        policies.forEach(policy => {
          console.log(`\n📌 ${policy.tablename}.${policy.policyname}`);
          console.log(`   Comando: ${policy.cmd}`);
          console.log(`   Ruoli: ${policy.roles || 'N/A'}`);
          console.log(`   Permissiva: ${policy.permissive ? 'Sì' : 'No'}`);
          if (policy.qual) {
            console.log(`   Condizione: ${policy.qual}`);
          }
          if (policy.with_check) {
            console.log(`   With Check: ${policy.with_check}`);
          }
        });
      } else {
        console.log('⚠️  Nessuna policy RLS trovata!');
      }
    }

    // 2. VERIFICA RLS ABILITATO SULLE TABELLE
    console.log('\n🔐 2. RLS ABILITATO SULLE TABELLE');
    console.log('-'.repeat(40));
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        ` 
      });

    if (rlsError) {
      console.log('💡 Prova a eseguire questo nella dashboard Supabase:');
      console.log(`
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
      `);
    } else {
      if (rlsStatus && rlsStatus.length > 0) {
        console.log('📊 Stato RLS per tabella:');
        rlsStatus.forEach(table => {
          const status = table.rls_enabled ? '✅ ABILITATO' : '❌ DISABILITATO';
          console.log(`   - ${table.tablename}: ${status}`);
        });
      }
    }

    // 3. VERIFICA RUOLI E PERMESSI
    console.log('\n👥 3. RUOLI E PERMESSI');
    console.log('-'.repeat(40));
    
    const { data: roles, error: rolesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            rolname,
            rolsuper,
            rolinherit,
            rolcreaterole,
            rolcreatedb,
            rolcanlogin
          FROM pg_roles 
          WHERE rolname IN ('authenticated', 'anon', 'postgres', 'supabase_admin')
          ORDER BY rolname;
        ` 
      });

    if (rolesError) {
      console.log('💡 Prova a eseguire questo nella dashboard Supabase:');
      console.log(`
SELECT 
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'postgres', 'supabase_admin')
ORDER BY rolname;
      `);
    } else {
      if (roles && roles.length > 0) {
        console.log('👤 Ruoli del sistema:');
        roles.forEach(role => {
          console.log(`\n🔑 ${role.rolname}`);
          console.log(`   Superuser: ${role.rolsuper ? 'Sì' : 'No'}`);
          console.log(`   Può creare ruoli: ${role.rolcreaterole ? 'Sì' : 'No'}`);
          console.log(`   Può creare DB: ${role.rolcreatedb ? 'Sì' : 'No'}`);
          console.log(`   Può fare login: ${role.rolcanlogin ? 'Sì' : 'No'}`);
        });
      }
    }

    // 4. GENERA SCRIPT DI BACKUP PER LE POLICY
    console.log('\n💾 4. SCRIPT BACKUP POLICY');
    console.log('-'.repeat(40));
    
    const backupScript = `
-- ==============================================
-- BACKUP POLICY RLS (ROW LEVEL SECURITY)
-- Data: ${new Date().toISOString()}
-- ==============================================

-- 1. ABILITA RLS SU TUTTE LE TABELLE PRINCIPALI
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLICY PER PREDICTIONS
-- (Inserisci qui le policy specifiche per predictions)

-- 3. POLICY PER BETS
-- (Inserisci qui le policy specifiche per bets)

-- 4. POLICY PER COMMENTS
-- (Inserisci qui le policy specifiche per comments)

-- 5. POLICY PER PROFILES
-- (Inserisci qui le policy specifiche per profiles)

-- 6. VERIFICA FINALE
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
`;

    console.log('📝 Script di backup per le policy:');
    console.log(backupScript);

    console.log('\n🎯 5. RACCOMANDAZIONI');
    console.log('-'.repeat(40));
    console.log('✅ Esegui la verifica nella dashboard Supabase');
    console.log('✅ Copia le policy esistenti nel backup');
    console.log('✅ Testa le policy con utenti diversi');
    console.log('✅ Verifica che RLS sia abilitato su tutte le tabelle');

  } catch (error) {
    console.error('❌ Errore durante la verifica delle policy:', error);
  }
}

verificaPolicy();
