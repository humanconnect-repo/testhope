const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('🚀 Creazione tabelle manuale...');
    
    // 1. Aggiungi colonna is_admin alla tabella profiles
    console.log('⏳ Aggiungendo colonna is_admin alla tabella profiles...');
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;'
      });
      if (error) {
        console.log('⚠️  Errore aggiunta colonna is_admin (potrebbe già esistere):', error.message);
      } else {
        console.log('✅ Colonna is_admin aggiunta con successo!');
      }
    } catch (err) {
      console.log('⚠️  Errore aggiunta colonna is_admin:', err.message);
    }
    
    // 2. Crea tabella predictions
    console.log('⏳ Creando tabella predictions...');
    const createPredictionsSQL = `
      CREATE TABLE IF NOT EXISTS predictions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        closing_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('attiva', 'scaduta', 'bloccata')),
        rules TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES profiles(id),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createPredictionsSQL });
      if (error) {
        console.log('❌ Errore creazione tabella predictions:', error.message);
      } else {
        console.log('✅ Tabella predictions creata con successo!');
      }
    } catch (err) {
      console.log('❌ Errore creazione tabella predictions:', err.message);
    }
    
    // 3. Crea tabella bets
    console.log('⏳ Creando tabella bets...');
    const createBetsSQL = `
      CREATE TABLE IF NOT EXISTS bets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id),
        amount_bnb DECIMAL(18,8) NOT NULL,
        position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createBetsSQL });
      if (error) {
        console.log('❌ Errore creazione tabella bets:', error.message);
      } else {
        console.log('✅ Tabella bets creata con successo!');
      }
    } catch (err) {
      console.log('❌ Errore creazione tabella bets:', err.message);
    }
    
    // 4. Crea tabella comments
    console.log('⏳ Creando tabella comments...');
    const createCommentsSQL = `
      CREATE TABLE IF NOT EXISTS comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id),
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createCommentsSQL });
      if (error) {
        console.log('❌ Errore creazione tabella comments:', error.message);
      } else {
        console.log('✅ Tabella comments creata con successo!');
      }
    } catch (err) {
      console.log('❌ Errore creazione tabella comments:', err.message);
    }
    
    // 5. Inserisci dati di esempio
    console.log('⏳ Inserendo dati di esempio...');
    const sampleData = [
      {
        title: 'Il Napoli vincerà lo scudetto di questa stagione?',
        description: 'La stagione calcistica 2024-25 è iniziata e tutti si chiedono se il Napoli riuscirà a conquistare nuovamente lo scudetto. Con una squadra rinnovata e nuovi acquisti, i partenopei puntano al titolo. Scommetti su chi pensi che vincerà il campionato!',
        slug: 'il-napoli-vincera-lo-scudetto-di-questa-stagione',
        category: 'Sport',
        closing_date: '2025-05-31T23:59:59Z',
        status: 'attiva',
        rules: 'La prediction si chiude alla fine della stagione regolare. Il Napoli deve vincere il campionato di Serie A 2024-25.'
      },
      {
        title: 'Arresteranno Fabrizio Corona entro 6 mesi?',
        description: 'Il caso Corona continua a tenere banco. Con tutte le indagini in corso e le accuse che si moltiplicano, riuscirà la giustizia a mettere le mani su di lui entro i prossimi 6 mesi?',
        slug: 'arresteranno-fabrizio-corona-entro-6-mesi',
        category: 'Degen',
        closing_date: '2024-12-20T23:59:59Z',
        status: 'attiva',
        rules: 'La prediction si chiude se Corona viene arrestato o se scadono i 6 mesi. Arresto deve essere formale e confermato dalle autorità.'
      }
    ];
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert(sampleData);
      
      if (error) {
        console.log('❌ Errore inserimento dati di esempio:', error.message);
      } else {
        console.log('✅ Dati di esempio inseriti con successo!');
      }
    } catch (err) {
      console.log('❌ Errore inserimento dati di esempio:', err.message);
    }
    
    console.log('🎉 Processo completato!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

createTables();
