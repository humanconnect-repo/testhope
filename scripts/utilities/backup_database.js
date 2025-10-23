#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  console.error('Crea un file .env.local con:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = `backup_${timestamp}.sql`;
  
  console.log('🔄 Iniziando backup del database...');
  
  let backupContent = `-- Backup Database Bella Napoli
-- Data: ${new Date().toISOString()}
-- Generato automaticamente

-- ==============================================
-- 1. FUNZIONI CORRETTE
-- ==============================================

`;

  try {
    // 1. Backup delle funzioni
    console.log('📝 Esportando funzioni...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT 
            routine_name, 
            routine_definition,
            specific_name
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name IN ('get_prediction_percentages', 'get_top_bettors', 'get_prediction_comments')
          ORDER BY routine_name;
        ` 
      });

    if (functionsError) {
      console.error('❌ Errore nel recupero delle funzioni:', functionsError);
    } else {
      functions.forEach(func => {
        backupContent += `-- Funzione: ${func.routine_name}\n`;
        backupContent += `-- Specific Name: ${func.specific_name}\n`;
        backupContent += func.routine_definition + '\n\n';
      });
    }

    // 2. Backup delle tabelle (schema)
    console.log('📊 Esportando schema delle tabelle...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name IN ('predictions', 'bets', 'comments', 'profiles')
          ORDER BY table_name, ordinal_position;
        ` 
      });

    if (tablesError) {
      console.error('❌ Errore nel recupero dello schema:', tablesError);
    } else {
      backupContent += `-- ==============================================\n`;
      backupContent += `-- 2. SCHEMA TABELLE\n`;
      backupContent += `-- ==============================================\n\n`;
      
      const tableGroups = {};
      tables.forEach(col => {
        if (!tableGroups[col.table_name]) {
          tableGroups[col.table_name] = [];
        }
        tableGroups[col.table_name].push(col);
      });

      Object.keys(tableGroups).forEach(tableName => {
        backupContent += `-- Tabella: ${tableName}\n`;
        backupContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        
        const columns = tableGroups[tableName];
        columns.forEach((col, index) => {
          const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
          const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          backupContent += `  ${col.column_name} ${col.data_type}${nullable}${defaultValue}${index < columns.length - 1 ? ',' : ''}\n`;
        });
        
        backupContent += `);\n\n`;
      });
    }

    // 3. Backup dei dati (solo alcune righe per esempio)
    console.log('💾 Esportando dati di esempio...');
    
    const tablesToBackup = ['predictions', 'bets', 'comments', 'profiles'];
    
    for (const tableName of tablesToBackup) {
      try {
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*')
          .limit(10); // Solo prime 10 righe per esempio

        if (!dataError && tableData && tableData.length > 0) {
          backupContent += `-- ==============================================\n`;
          backupContent += `-- 3. DATI DI ESEMPIO - ${tableName.toUpperCase()}\n`;
          backupContent += `-- ==============================================\n\n`;
          
          tableData.forEach(row => {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            });
            
            backupContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          });
          backupContent += '\n';
        }
      } catch (err) {
        console.log(`⚠️  Non è stato possibile esportare i dati da ${tableName}:`, err.message);
      }
    }

    // 4. Backup dei permessi
    backupContent += `-- ==============================================\n`;
    backupContent += `-- 4. PERMESSI\n`;
    backupContent += `-- ==============================================\n\n`;
    backupContent += `GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;\n`;
    backupContent += `GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;\n`;
    backupContent += `GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;\n\n`;

    // 5. Salva il file
    fs.writeFileSync(backupFile, backupContent);
    
    console.log(`✅ Backup completato: ${backupFile}`);
    console.log(`📁 Dimensione file: ${fs.statSync(backupFile).size} bytes`);
    
    // Mostra un riassunto
    const lines = backupContent.split('\n').length;
    console.log(`📄 Righe totali: ${lines}`);
    
  } catch (error) {
    console.error('❌ Errore durante il backup:', error);
  }
}

backupDatabase();
