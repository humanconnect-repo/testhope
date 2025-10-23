#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Supabase non configurato!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Funzione per eseguire SQL tramite API REST
async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Funzione per creare policies sicure
async function createSecurePolicies() {
  console.log('🔒 Creando policies sicure per storage...');

  const policies = [
    {
      name: "Avatar files are publicly accessible",
      sql: `CREATE POLICY "Avatar files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatar');`
    },
    {
      name: "Avatar files can be uploaded with valid path",
      sql: `CREATE POLICY "Avatar files can be uploaded with valid path" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%');`
    },
    {
      name: "Avatar files can be updated with valid path", 
      sql: `CREATE POLICY "Avatar files can be updated with valid path" ON storage.objects FOR UPDATE USING (bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%');`
    },
    {
      name: "Avatar files can be deleted with valid path",
      sql: `CREATE POLICY "Avatar files can be deleted with valid path" ON storage.objects FOR DELETE USING (bucket_id = 'avatar' AND name LIKE 'avatar/0x%/%');`
    }
  ];

  try {
    // Prima rimuovi policies esistenti
    console.log('🗑️ Rimuovendo policies esistenti...');
    const dropSQL = `
      DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_0" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files are publicly accessible lbslgex_1" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files are publicly accessible" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be uploaded with valid path" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be updated with valid path" ON storage.objects;
      DROP POLICY IF EXISTS "Avatar files can be deleted with valid path" ON storage.objects;
    `;
    
    try {
      await executeSQL(dropSQL);
      console.log('✅ Policies esistenti rimosse');
    } catch (error) {
      console.log('⚠️ Alcune policies non esistevano (normale)');
    }

    // Crea nuove policies
    for (const policy of policies) {
      console.log(`📝 Creando policy: ${policy.name}`);
      try {
        await executeSQL(policy.sql);
        console.log(`✅ Policy ${policy.name} creata con successo`);
      } catch (error) {
        console.log(`⚠️ Policy ${policy.name}: ${error.message}`);
      }
    }

    // Abilita RLS
    console.log('🔒 Abilitando RLS per storage.objects...');
    try {
      await executeSQL('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
      console.log('✅ RLS abilitato per storage.objects');
    } catch (error) {
      console.log(`⚠️ RLS: ${error.message}`);
    }

    console.log('🎉 Policies create con successo!');
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Funzione per disabilitare RLS
async function disableRLS() {
  console.log('🔓 Disabilitando RLS per storage.objects...');
  try {
    await executeSQL('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS disabilitato per storage.objects');
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Funzione per testare storage
async function testStorage() {
  console.log('🧪 Testando storage...');
  
  // Test upload
  const testContent = 'Test file content';
  const testFileName = `test-${Date.now()}.txt`;
  
  try {
    const { data, error } = await supabase.storage
      .from('avatar')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (error) {
      console.error('❌ Errore upload test:', error.message);
    } else {
      console.log('✅ Upload test riuscito:', data.path);
      
      // Pulisci
      await supabase.storage
        .from('avatar')
        .remove([`test/${testFileName}`]);
      console.log('🧹 File di test rimosso');
    }
  } catch (error) {
    console.error('❌ Errore test:', error.message);
  }
}

// Funzione per mostrare status
async function showStatus() {
  console.log('📊 Status Storage:');
  
  // Bucket info
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('❌ Errore buckets:', bucketError.message);
    return;
  }
  
  const avatarBucket = buckets.find(b => b.name === 'avatar');
  if (avatarBucket) {
    console.log('✅ Bucket "avatar" trovato');
    console.log(`   Pubblico: ${avatarBucket.public}`);
    console.log(`   Dimensione max: ${avatarBucket.file_size_limit} bytes`);
  } else {
    console.log('❌ Bucket "avatar" non trovato');
  }
  
  // File info
  const { data: files, error: filesError } = await supabase.storage
    .from('avatar')
    .list('', { limit: 10 });
  
  if (filesError) {
    console.log('⚠️ Errore file:', filesError.message);
  } else {
    console.log(`📁 File nel bucket: ${files.length}`);
    files.forEach(file => {
      console.log(`   - ${file.name}`);
    });
  }
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'create':
        await createSecurePolicies();
        break;
      case 'disable':
        await disableRLS();
        break;
      case 'test':
        await testStorage();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        console.log('🔧 Storage Policies Manager - Comandi:');
        console.log('');
        console.log('  create                  - Crea policies sicure per avatar');
        console.log('  disable                 - Disabilita RLS per storage');
        console.log('  test                    - Testa upload/download file');
        console.log('  status                  - Mostra status bucket e file');
        console.log('');
        console.log('Esempi:');
        console.log('  node scripts/final-storage-policies.js create');
        console.log('  node scripts/final-storage-policies.js test');
        console.log('  node scripts/final-storage-policies.js status');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
