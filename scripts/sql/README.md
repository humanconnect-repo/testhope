# Script SQL - Bella Napoli Prediction Market

Questa cartella contiene tutti gli script SQL organizzati per categoria.

## 📁 Struttura

### `/database/`
Script per la creazione e gestione del database:
- `create-insert-rpc.sql` - Funzioni RPC per inserimento dati
- `create-delete-rpc.sql` - Funzioni RPC per eliminazione dati
- `create-missing-rpc-functions.sql` - Funzioni RPC mancanti
- `create-missing-tables.sql` - Tabelle mancanti

### `/security/`
Script per la sicurezza e le policy RLS:
- `create-secure-rpc.sql` - Funzioni RPC sicure
- `fix-prediction-security.sql` - Fix per la sicurezza delle prediction

### `/fixes/`
Script per correzioni e fix:
- `fix-prediction-errors.sql` - Fix completo per errori prediction
- `fix-comments-table.sql` - Fix specifico per tabella comments

## 🚨 IMPORTANTE

**NON ESEGUIRE MAI `npx supabase db reset`** - Il database contiene configurazioni di sicurezza critiche che verrebbero perse.

## 📋 Ordine di Esecuzione

1. **Prima esecuzione**: Eseguire tutti gli script in `/database/`
2. **Sicurezza**: Eseguire gli script in `/security/`
3. **Fix**: Eseguire gli script in `/fixes/` se necessario

## 🔧 Come Eseguire

1. Aprire Supabase Dashboard
2. Andare su SQL Editor
3. Copiare e incollare il contenuto dello script
4. Eseguire lo script
5. Verificare che non ci siano errori

## 📝 Note

- Tutti gli script sono idempotenti (possono essere eseguiti più volte)
- Gli script includono controlli per evitare duplicazioni
- Le funzioni RPC sono create con `SECURITY DEFINER` per bypassare RLS