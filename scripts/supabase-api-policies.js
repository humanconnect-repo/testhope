#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase non configurato! Assicurati che NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY siano presenti in .env.local');
  process.exit(1);
}

// Funzione per eseguire query SQL tramite API REST
async function executeSQL(query) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Funzione per creare policies sicure per storage
async function createSecureStoragePolicies() {
  console.log('🔒 Creando policies sicure per storage...');

  const policies = [
    {
      name: "Avatar files are publicly accessible",
      operation: "SELECT",
      expression: "bucket_id = 'avatar'",
      type: "USING"
    },
    {
      name: "Avatar files can be uploaded with valid path",
      operation: "INSERT",
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'",
      type: "WITH CHECK"
    },
    {
      name: "Avatar files can be updated with valid path",
      operation: "UPDATE",
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'",
      type: "USING"
    },
    {
      name: "Avatar files can be deleted with valid path",
      operation: "DELETE",
      expression: "bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%'",
      type: "USING"
    }
  ];

  try {
    // Prima rimuovi le policies esistenti
    console.log('🗑️ Rimuovendo policies esistenti...');
    const dropQuery = `
      DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_0" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_1" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be uploaded with valid path" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be updated with valid path" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be deleted with valid path" ON storage.objects;
    `;
    
    const { error: dropError } = await executeSQL(dropQuery);
    if (dropError) {
      console.log('⚠️ Alcune policies non esistevano (normale)');
    }

    // Crea le nuove policies
    for (const policy of policies) {
      console.log(`📝 Creando policy: ${policy.name}`);
      
      let sql;
      if (policy.type === "USING") {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} USING (${policy.expression});`;
      } else {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} WITH CHECK (${policy.expression});`;
      }
      
      const { error } = await executeSQL(sql);
      if (error) {
        console.error(`❌ Errore creando policy ${policy.name}:`, error.message);
      } else {
        console.log(`✅ Policy ${policy.name} creata con successo`);
      }
    }

    // Abilita RLS
    console.log('🔒 Abilitando RLS per storage.objects...');
    const { error: rlsError } = await executeSQL('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
    if (rlsError) {
      console.error('❌ Errore abilitando RLS:', rlsError.message);
    } else {
      console.log('✅ RLS abilitato per storage.objects');
    }

    console.log('🎉 Policies create con successo!');
  } catch (error) {
    console.error('❌ Errore nella creazione delle policies:', error.message);
  }
}

// Funzione per listare le policies esistenti
async function listStoragePolicies() {
  console.log('📋 Recuperando policies storage...');
  
  const query = `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage'
    ORDER BY policyname;
  `;

  const { data, error } = await executeSQL(query);
  
  if (error) {
    console.error('❌ Errore nel recupero delle policies:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('Nessuna policy trovata per storage.objects');
    return;
  }
  
  console.log('\n📋 Policies Storage Esistenti:');
  console.log('='.repeat(60));
  
  data.forEach((policy, index) => {
    console.log(`\n${index + 1}. 🔹 ${policy.policyname}`);
    console.log(`   Operazione: ${policy.cmd}`);
    console.log(`   Ruoli: ${policy.roles?.join(', ') || 'N/A'}`);
    console.log(`   USING: ${policy.qual || 'N/A'}`);
    console.log(`   WITH CHECK: ${policy.with_check || 'N/A'}`);
  });
}

// Funzione per disabilitare RLS
async function disableStorageRLS() {
  console.log('🔓 Disabilitando RLS per storage.objects...');
  
  const { error } = await executeSQL('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
  
  if (error) {
    console.error('❌ Errore disabilitando RLS:', error.message);
  } else {
    console.log('✅ RLS disabilitato per storage.objects');
  }
}

// Funzione per abilitare RLS
async function enableStorageRLS() {
  console.log('🔒 Abilitando RLS per storage.objects...');
  
  const { error } = await executeSQL('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
  
  if (error) {
    console.error('❌ Errore abilitando RLS:', error.message);
  } else {
    console.log('✅ RLS abilitato per storage.objects');
  }
}

// Funzione per testare le policies
async function testStoragePolicies() {
  console.log('🧪 Testando policies storage...');
  
  // Test 1: Verifica RLS status
  const rlsQuery = `
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    WHERE tablename = 'objects' AND schemaname = 'storage';
  `;
  
  const { data: rlsData, error: rlsError } = await executeSQL(rlsQuery);
  
  if (rlsError) {
    console.error('❌ Errore verificando RLS:', rlsError.message);
    return;
  }
  
  if (rlsData && rlsData.length > 0) {
    console.log(`📊 RLS Status: ${rlsData[0].rowsecurity ? 'ABILITATO' : 'DISABILITATO'}`);
  }
  
  // Test 2: Lista policies
  await listStoragePolicies();
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'list':
        await listStoragePolicies();
        break;
      case 'create-secure':
        await createSecureStoragePolicies();
        break;
      case 'disable-rls':
        await disableStorageRLS();
        break;
      case 'enable-rls':
        await enableStorageRLS();
        break;
      case 'test':
        await testStoragePolicies();
        break;
      default:
        console.log('🔧 Supabase Storage Policies CLI - Comandi disponibili:');
        console.log('');
        console.log('  list                    - Lista policies storage esistenti');
        console.log('  create-secure           - Crea policies sicure per avatar');
        console.log('  disable-rls             - Disabilita RLS per storage');
        console.log('  enable-rls              - Abilita RLS per storage');
        console.log('  test                    - Testa policies e RLS status');
        console.log('');
        console.log('Esempi:');
        console.log('  node scripts/supabase-api-policies.js list');
        console.log('  node scripts/supabase-api-policies.js create-secure');
        console.log('  node scripts/supabase-api-policies.js test');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
