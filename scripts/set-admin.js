// Script per impostare admin bypassando il trigger
const { createClient } = require('@supabase/supabase-js');

// Usa la service role key per bypassare RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Chiave service role
);

async function setAdmin() {
  try {
    console.log('🔧 Impostando wallet come admin...');
    
    // Inserisci direttamente il record admin
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        wallet_address: '0x7D03E4E68017fdf5240Ca3c2358d72370e5D6b77',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (error) {
      console.error('❌ Errore:', error);
      return;
    }

    console.log('✅ Admin impostato con successo!');
    
    // Verifica
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address, is_admin')
      .eq('wallet_address', '0x7D03E4E68017fdf5240Ca3c2358d72370e5D6b77')
      .single();
    
    console.log('📊 Verifica:', profile);
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

setAdmin();
