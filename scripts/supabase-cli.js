#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti!')
  console.error('Assicurati che .env.local contenga:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const command = process.argv[2]
  const args = process.argv.slice(3)

  try {
    switch (command) {
      case 'list-profiles':
        const { data: profiles, error: listError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (listError) throw listError
        
        console.log('👥 Profili utenti:')
        console.table(profiles)
        break

      case 'get-profile':
        const address = args[0]
        if (!address) {
          console.error('❌ Fornisci un indirizzo wallet')
          process.exit(1)
        }
        
        const { data: profile, error: getError } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address)
          .single()
        
        if (getError) throw getError
        
        console.log('👤 Profilo utente:')
        console.log(JSON.stringify(profile, null, 2))
        break

      case 'update-profile':
        const [walletAddress, field, value] = args
        if (!walletAddress || !field || !value) {
          console.error('❌ Uso: update-profile <wallet_address> <field> <value>')
          process.exit(1)
        }
        
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            [field]: value, 
            updated_at: new Date().toISOString() 
          })
          .eq('wallet_address', walletAddress)
          .select()
        
        if (updateError) throw updateError
        
        console.log('✅ Profilo aggiornato:')
        console.log(JSON.stringify(updated[0], null, 2))
        break

      case 'create-bucket':
        const bucketName = args[0] || 'avatars'
        const { data: bucket, error: bucketError } = await supabase.storage
          .createBucket(bucketName, { public: true, fileSizeLimit: 2097152 })
        
        if (bucketError) throw bucketError
        
        console.log(`✅ Bucket "${bucketName}" creato con successo`)
        break

      case 'list-buckets':
        const { data: buckets, error: bucketsError } = await supabase.storage
          .listBuckets()
        
        if (bucketsError) throw bucketsError
        
        console.log('📁 Buckets disponibili:')
        console.table(buckets)
        break

      case 'sql':
        const sql = args.join(' ')
        if (!sql) {
          console.error('❌ Fornisci una query SQL')
          process.exit(1)
        }
        
        // Prova prima con rpc, poi con query diretta
        let result, sqlError
        
        try {
          const response = await supabase.rpc('exec_sql', { 
            query: sql 
          })
          result = response.data
          sqlError = response.error
        } catch (err) {
          // Se rpc non funziona, prova con query diretta usando fetch
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                'apikey': supabaseServiceRoleKey
              },
              body: JSON.stringify({ query: sql })
            })
            
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.message || 'Errore esecuzione SQL')
            }
            result = data
            sqlError = null
          } catch (fetchErr) {
            console.error('❌ Errore esecuzione SQL:', fetchErr.message)
            console.log('💡 Suggerimento: Esegui manualmente nel SQL Editor di Supabase:')
            console.log(sql)
            process.exit(1)
          }
        }
        
        if (sqlError) {
          console.error('❌ Errore SQL:', sqlError.message)
          console.log('💡 Suggerimento: Esegui manualmente nel SQL Editor di Supabase:')
          console.log(sql)
          process.exit(1)
        }
        
        console.log('📊 Risultato query:')
        console.log(JSON.stringify(result, null, 2))
        break

      default:
        console.log('🔧 Supabase CLI - Comandi disponibili:')
        console.log('')
        console.log('  list-profiles                    - Lista tutti i profili')
        console.log('  get-profile <wallet_address>     - Mostra profilo specifico')
        console.log('  update-profile <address> <field> <value> - Aggiorna campo profilo')
        console.log('  create-bucket [name]             - Crea bucket storage')
        console.log('  list-buckets                     - Lista buckets')
        console.log('  sql "SELECT * FROM profiles"     - Esegui query SQL')
        console.log('')
        console.log('Esempi:')
        console.log('  node scripts/supabase-cli.js list-profiles')
        console.log('  node scripts/supabase-cli.js get-profile 0x123...')
        console.log('  node scripts/supabase-cli.js update-profile 0x123... nickname "Mario"')
        console.log('  node scripts/supabase-cli.js create-bucket avatars')
    }
  } catch (error) {
    console.error('❌ Errore:', error.message)
    process.exit(1)
  }
}

main()
