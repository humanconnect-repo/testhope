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

async function forceRemoveAvatarBucket() {
  console.log('🗑️ Rimozione forzata del bucket avatar...');

  try {
    // Rimuovi ricorsivamente tutti i file
    console.log('1️⃣ Rimuovendo tutti i file ricorsivamente...');
    
    const removeAllFiles = async (path = '') => {
      const { data: files, error: listError } = await supabase.storage
        .from('avatar')
        .list(path, { limit: 1000 });

      if (listError) {
        console.log(`⚠️ Errore nel listare file in ${path}:`, listError.message);
        return;
      }

      if (files && files.length > 0) {
        console.log(`📁 Trovati ${files.length} file in ${path || 'root'}`);
        
        for (const file of files) {
          const fullPath = path ? `${path}/${file.name}` : file.name;
          
          if (file.metadata) {
            // È un file
            console.log(`🗑️ Rimuovendo file: ${fullPath}`);
            const { error: removeError } = await supabase.storage
              .from('avatar')
              .remove([fullPath]);

            if (removeError) {
              console.log(`⚠️ Errore rimozione ${fullPath}:`, removeError.message);
            }
          } else {
            // È una cartella, rimuovi ricorsivamente
            console.log(`📁 Rimuovendo cartella: ${fullPath}`);
            await removeAllFiles(fullPath);
          }
        }
      }
    };

    await removeAllFiles();

    // Aspetta un momento per la propagazione
    console.log('⏳ Aspetto 2 secondi per la propagazione...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Prova a rimuovere il bucket
    console.log('2️⃣ Tentativo di rimozione bucket...');
    const { error: deleteError } = await supabase.storage.deleteBucket('avatar');

    if (deleteError) {
      console.log('⚠️ Errore nella rimozione bucket:', deleteError.message);
      
      // Prova con SQL diretto
      console.log('3️⃣ Tentativo con SQL diretto...');
      try {
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          query: "DELETE FROM storage.objects WHERE bucket_id = 'avatar';"
        });
        
        if (sqlError) {
          console.log('⚠️ Errore SQL:', sqlError.message);
        } else {
          console.log('✅ File rimossi con SQL');
          
          // Riprova a rimuovere il bucket
          const { error: retryError } = await supabase.storage.deleteBucket('avatar');
          if (retryError) {
            console.log('⚠️ Bucket ancora presente:', retryError.message);
          } else {
            console.log('✅ Bucket rimosso con successo');
          }
        }
      } catch (sqlErr) {
        console.log('⚠️ Errore esecuzione SQL:', sqlErr.message);
      }
    } else {
      console.log('✅ Bucket rimosso con successo');
    }

    // Verifica finale
    console.log('4️⃣ Verifica finale...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('⚠️ Errore nel verificare buckets:', bucketError.message);
    } else {
      const avatarBucket = buckets.find(b => b.name === 'avatar');
      if (avatarBucket) {
        console.log('❌ Bucket avatar ancora presente');
      } else {
        console.log('✅ Bucket avatar rimosso con successo');
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

async function main() {
  try {
    await forceRemoveAvatarBucket();
    console.log('🎉 Operazione completata!');
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
