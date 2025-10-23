#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase non configurato! Assicurati che NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY siano presenti in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listStoragePolicies() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
              FROM pg_policies 
              WHERE tablename = 'objects' AND schemaname = 'storage'`
    });
    
    if (error) throw error;
    
    if (data.length === 0) {
      console.log('Nessuna policy trovata per storage.objects');
      return;
    }
    
    console.log('📋 Policies Storage:');
    data.forEach(policy => {
      console.log(`\n🔹 ${policy.policyname}`);
      console.log(`   Operazione: ${policy.cmd}`);
      console.log(`   Ruoli: ${policy.roles?.join(', ') || 'N/A'}`);
      console.log(`   USING: ${policy.qual || 'N/A'}`);
      console.log(`   WITH CHECK: ${policy.with_check || 'N/A'}`);
    });
  } catch (error) {
    console.error('❌ Errore nel recupero delle policies:', error.message);
  }
}

async function createSecurePolicies() {
  const policies = [
    {
      name: "Avatar files are publicly accessible",
      operation: "SELECT",
      expression: "bucket_id = 'avatar'"
    },
    {
      name: "Avatar files can be uploaded with valid path",
      operation: "INSERT", 
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'"
    },
    {
      name: "Avatar files can be updated with valid path",
      operation: "UPDATE",
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'"
    },
    {
      name: "Avatar files can be deleted with valid path", 
      operation: "DELETE",
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'"
    }
  ];

  try {
    // Prima rimuovi le policies esistenti
    console.log('🗑️ Rimuovendo policies esistenti...');
    await supabase.rpc('exec_sql', { 
      query: `DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_0" ON storage.objects;
              DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_1" ON storage.objects;`
    });

    // Crea le nuove policies
    for (const policy of policies) {
      console.log(`📝 Creando policy: ${policy.name}`);
      
      let sql;
      if (policy.operation === 'SELECT') {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} USING (${policy.expression});`;
      } else {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} WITH CHECK (${policy.expression});`;
      }
      
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) throw error;
    }

    console.log('✅ Policies create con successo!');
  } catch (error) {
    console.error('❌ Errore nella creazione delle policies:', error.message);
  }
}

async function disableStorageRLS() {
  try {
    console.log('🔓 Disabilitando RLS per storage.objects...');
    const { error } = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    });
    
    if (error) throw error;
    console.log('✅ RLS disabilitato per storage.objects');
  } catch (error) {
    console.error('❌ Errore nella disabilitazione RLS:', error.message);
  }
}

async function enableStorageRLS() {
  try {
    console.log('🔒 Abilitando RLS per storage.objects...');
    const { error } = await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    
    if (error) throw error;
    console.log('✅ RLS abilitato per storage.objects');
  } catch (error) {
    console.error('❌ Errore nell\'abilitazione RLS:', error.message);
  }
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'list':
        await listStoragePolicies();
        break;
      case 'create-secure':
        await createSecurePolicies();
        break;
      case 'disable-rls':
        await disableStorageRLS();
        break;
      case 'enable-rls':
        await enableStorageRLS();
        break;
      default:
        console.log('🔧 Storage Policies CLI - Comandi disponibili:');
        console.log('');
        console.log('  list                    - Lista policies storage esistenti');
        console.log('  create-secure           - Crea policies sicure per avatar');
        console.log('  disable-rls             - Disabilita RLS per storage');
        console.log('  enable-rls              - Abilita RLS per storage');
        console.log('');
        console.log('Esempi:');
        console.log('  node scripts/storage-policies.js list');
        console.log('  node scripts/storage-policies.js create-secure');
        console.log('  node scripts/storage-policies.js disable-rls');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
