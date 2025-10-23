# 🔧 Esecuzione Script SQL per Funzioni Mancanti

## ⚠️ IMPORTANTE
**NON resettare mai il database Supabase!** Le configurazioni di sicurezza sono critiche.

## 📋 Script da Eseguire

### 1. Prima esegui questo script per creare le tabelle mancanti:

```sql
-- Copia e incolla il contenuto di scripts/sql/database/create-missing-tables.sql
-- nel SQL Editor di Supabase
```

### 2. Poi esegui questo script per creare le funzioni RPC:

```sql
-- Copia e incolla il contenuto di scripts/sql/database/create-missing-rpc-functions.sql
-- nel SQL Editor di Supabase
```

## 🎯 Cosa Risolve

### ✅ Errori 404 Risolti:
- `get_recent_bets` - Scommesse recenti globali
- `get_top_bettors` - Top scommettitori per prediction
- `get_prediction_comments` - Commenti per prediction

### ✅ Tabelle Create:
- `bets` - Per le scommesse degli utenti
- `comments` - Per i commenti alle prediction
- `slug` - Campo aggiunto alle predictions per URL friendly

### ✅ Funzioni RPC Create:
- `get_recent_bets(limit_count)` - Scommesse recenti
- `get_top_bettors(prediction_uuid, limit_count)` - Top scommettitori
- `get_prediction_comments(prediction_uuid, limit_count)` - Commenti
- `create_comment(prediction_uuid, content, caller_wallet)` - Crea commento
- `create_bet(prediction_uuid, amount, position, caller_wallet)` - Crea scommessa

## 🔒 Sicurezza

Tutte le funzioni sono `SECURITY DEFINER` con controlli interni:
- Verifica esistenza utente tramite wallet
- Validazione input
- RLS policies per protezione dati

## 🚀 Dopo l'Esecuzione

1. Ricarica la pagina dei dettagli della prediction
2. Gli errori 404 dovrebbero scomparire
3. Le sezioni "Scommesse Recenti", "Top Scommettitori" e "Commenti" funzioneranno
4. Console pulita senza errori

## 📁 File Coinvolti

- `create-missing-tables.sql` - Crea tabelle bets, comments, aggiunge slug
- `create-missing-rpc-functions.sql` - Crea funzioni RPC mancanti
- `app/bellanapoli.prediction/[slug]/page.tsx` - Gestione errori migliorata
