import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updatePredictionStates() {
  console.log('🔄 Aggiornamento stati prediction...');
  
  try {
    // Prima verifichiamo gli stati attuali
    console.log('\n📊 Stati attuali:');
    const { data: currentStates, error: currentError } = await supabase
      .from('predictions')
      .select('status')
      .not('status', 'is', null);
    
    if (currentError) throw currentError;
    
    const stateCounts = currentStates?.reduce((acc: any, pred: any) => {
      acc[pred.status] = (acc[pred.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Stati trovati:', stateCounts);
    
    // Aggiorna in_attesa -> in_pausa
    console.log('\n🟡 Aggiornamento in_attesa -> in_pausa...');
    const { data: pausedData, error: pausedError } = await supabase
      .from('predictions')
      .update({ status: 'in_pausa' })
      .eq('status', 'in_attesa')
      .select();
    
    if (pausedError) throw pausedError;
    console.log(`✅ Aggiornate ${pausedData?.length || 0} prediction da 'in_attesa' a 'in_pausa'`);
    
    // Aggiorna scaduta -> risolta
    console.log('\n🏆 Aggiornamento scaduta -> risolta...');
    const { data: resolvedData, error: resolvedError } = await supabase
      .from('predictions')
      .update({ status: 'risolta' })
      .eq('status', 'scaduta')
      .select();
    
    if (resolvedError) throw resolvedError;
    console.log(`✅ Aggiornate ${resolvedData?.length || 0} prediction da 'scaduta' a 'risolta'`);
    
    // Aggiorna bloccata -> cancellata
    console.log('\n🔴 Aggiornamento bloccata -> cancellata...');
    const { data: cancelledData, error: cancelledError } = await supabase
      .from('predictions')
      .update({ status: 'cancellata' })
      .eq('status', 'bloccata')
      .select();
    
    if (cancelledError) throw cancelledError;
    console.log(`✅ Aggiornate ${cancelledData?.length || 0} prediction da 'bloccata' a 'cancellata'`);
    
    // Verifica stati finali
    console.log('\n📊 Stati finali:');
    const { data: finalStates, error: finalError } = await supabase
      .from('predictions')
      .select('status')
      .not('status', 'is', null);
    
    if (finalError) throw finalError;
    
    const finalStateCounts = finalStates?.reduce((acc: any, pred: any) => {
      acc[pred.status] = (acc[pred.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Stati aggiornati:', finalStateCounts);
    console.log('\n🎉 Aggiornamento stati completato!');
    
  } catch (error) {
    console.error('❌ Errore durante aggiornamento:', error);
  }
}

updatePredictionStates();
