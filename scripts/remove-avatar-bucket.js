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

async function removeAvatarBucket() {
  console.log('🗑️ Rimuovendo bucket avatar...');

  try {
    // Prima rimuovi tutti i file dal bucket
    console.log('1️⃣ Rimuovendo tutti i file dal bucket avatar...');
    const { data: files, error: listError } = await supabase.storage
      .from('avatar')
      .list('', { limit: 1000 });

    if (listError) {
      console.log('⚠️ Errore nel listare file:', listError.message);
    } else if (files && files.length > 0) {
      console.log(`📁 Trovati ${files.length} file da rimuovere`);
      
      const filePaths = files.map(file => file.name);
      const { error: removeError } = await supabase.storage
        .from('avatar')
        .remove(filePaths);

      if (removeError) {
        console.log('⚠️ Errore nella rimozione file:', removeError.message);
      } else {
        console.log('✅ File rimossi con successo');
      }
    } else {
      console.log('📁 Nessun file trovato nel bucket');
    }

    // Poi rimuovi il bucket
    console.log('2️⃣ Rimuovendo bucket avatar...');
    const { error: deleteError } = await supabase.storage.deleteBucket('avatar');

    if (deleteError) {
      console.log('⚠️ Errore nella rimozione bucket:', deleteError.message);
    } else {
      console.log('✅ Bucket avatar rimosso con successo');
    }

    // Verifica che il bucket sia stato rimosso
    console.log('3️⃣ Verificando rimozione...');
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
    await removeAvatarBucket();
    console.log('🎉 Operazione completata!');
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

main();
