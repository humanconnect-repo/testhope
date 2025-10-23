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

// Funzione per eseguire query SQL tramite RPC
async function executeSQL(query) {
  try {
    // Prova prima con una funzione RPC personalizzata
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error && error.code === 'PGRST202') {
      // Se exec_sql non esiste, prova con una query diretta
      console.log('⚠️ Funzione exec_sql non disponibile, usando approccio alternativo...');
      return { data: null, error: new Error('exec_sql non disponibile') };
    }
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Funzione per gestire le policies tramite API REST
async function manageStoragePolicies(action, policyName = null, policyData = null) {
  try {
    const baseUrl = `${supabaseUrl}/rest/v1`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      'apikey': supabaseServiceRoleKey
    };

    switch (action) {
      case 'list':
        // Lista policies esistenti
        const { data: policies, error: listError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'objects')
          .eq('schemaname', 'storage');
        
        if (listError) {
          console.error('❌ Errore listando policies:', listError.message);
          return;
        }
        
        if (!policies || policies.length === 0) {
          console.log('📋 Nessuna policy trovata per storage.objects');
          return;
        }
        
        console.log('\n📋 Policies Storage Esistenti:');
        console.log('='.repeat(60));
        
        policies.forEach((policy, index) => {
          console.log(`\n${index + 1}. 🔹 ${policy.policyname}`);
          console.log(`   Operazione: ${policy.cmd}`);
          console.log(`   Ruoli: ${policy.roles?.join(', ') || 'N/A'}`);
          console.log(`   USING: ${policy.qual || 'N/A'}`);
          console.log(`   WITH CHECK: ${policy.with_check || 'N/A'}`);
        });
        break;

      case 'create':
        console.log('📝 Creando policies sicure per storage...');
        
        // Crea policies tramite SQL diretto
        const storagePolicies = [
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

        for (const policy of storagePolicies) {
          console.log(`📝 Creando policy: ${policy.name}`);
          
          // Usa l'API REST per eseguire SQL
          const sql = policy.type === "USING" 
            ? `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} USING (${policy.expression});`
            : `CREATE POLICY "${policy.name}" ON storage.objects FOR ${policy.operation} WITH CHECK (${policy.expression});`;
          
          try {
            const response = await fetch(`${baseUrl}/rpc/exec_sql`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ query: sql })
            });
            
            if (!response.ok) {
              const error = await response.text();
              console.log(`⚠️ Policy ${policy.name}: ${error}`);
            } else {
              console.log(`✅ Policy ${policy.name} creata con successo`);
            }
          } catch (err) {
            console.log(`⚠️ Policy ${policy.name}: ${err.message}`);
          }
        }
        break;

      case 'status':
        console.log('📊 Verificando status storage...');
        
        // Verifica bucket avatar
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
          console.error('❌ Errore verificando buckets:', bucketError.message);
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
        
        // Lista file nel bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('avatar')
          .list('', { limit: 10 });
        
        if (filesError) {
          console.log('⚠️ Errore listando file:', filesError.message);
        } else {
          console.log(`📁 File nel bucket avatar: ${files.length}`);
          files.forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
          });
        }
        break;

      default:
        console.log('❌ Azione non riconosciuta:', action);
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  const subcommand = process.argv[3];

  try {
    switch (command) {
      case 'policies':
        await manageStoragePolicies('list');
        break;
      case 'create-policies':
        await manageStoragePolicies('create');
        break;
      case 'status':
        await manageStoragePolicies('status');
        break;
      case 'test-upload':
        console.log('🧪 Testando upload file...');
        
        // Crea un file di test
        const testContent = 'Test file content';
        const testFileName = `test-${Date.now()}.txt`;
        
        const { data, error } = await supabase.storage
          .from('avatar')
          .upload(`test/${testFileName}`, testContent, {
            contentType: 'text/plain'
          });
        
        if (error) {
          console.error('❌ Errore upload test:', error.message);
        } else {
          console.log('✅ Upload test riuscito:', data.path);
          
          // Pulisci il file di test
          await supabase.storage
            .from('avatar')
            .remove([`test/${testFileName}`]);
          console.log('🧹 File di test rimosso');
        }
        break;
      default:
        console.log('🔧 Supabase Storage Manager CLI - Comandi disponibili:');
        console.log('');
        console.log('  policies                 - Lista policies storage esistenti');
        console.log('  create-policies          - Crea policies sicure per avatar');
        console.log('  status                   - Verifica status bucket e file');
        console.log('  test-upload              - Testa upload file');
        console.log('');
        console.log('Esempi:');
        console.log('  node scripts/supabase-storage-manager.js policies');
        console.log('  node scripts/supabase-storage-manager.js create-policies');
        console.log('  node scripts/supabase-storage-manager.js status');
        console.log('  node scripts/supabase-storage-manager.js test-upload');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
