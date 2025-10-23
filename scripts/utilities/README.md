# 🔧 Script di Utilità Database

Questa cartella contiene script JavaScript di utilità per la gestione e verifica del database Bella Napoli.

## 📋 Script Disponibili

### 🔍 **Script di Verifica**
- **`verifica_database.js`** - Verifica completa del database
  - Controlla tabelle, funzioni, policy RLS
  - Verifica dati esistenti
  - Mostra stato generale del sistema

- **`verifica_policy.js`** - Verifica specifica delle policy RLS
  - Controlla policy di sicurezza
  - Verifica RLS abilitato
  - Analizza ruoli e permessi

### 💾 **Script di Backup**
- **`backup_database.js`** - Backup automatico del database
  - Esporta funzioni, schema, dati
  - Genera backup SQL completo
  - Include verifiche di sicurezza

## 🚀 Come Usare

### Prerequisiti:
```bash
# Assicurati di avere il file .env.local con le credenziali Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Eseguire gli Script:
```bash
# Verifica completa del database
node scripts/utilities/verifica_database.js

# Verifica policy RLS
node scripts/utilities/verifica_policy.js

# Backup del database
node scripts/utilities/backup_database.js
```

## ⚠️ **IMPORTANTE**

Questi script sono **SOLO per sviluppo e manutenzione**:
- ❌ **NON** sono necessari per il funzionamento del website
- ❌ **NON** devono essere deployati in produzione
- ✅ **SÌ** sono utili per verifiche e backup
- ✅ **SÌ** possono essere eseguiti localmente

## 📁 **Struttura**

```
scripts/utilities/
├── README.md              # Questa documentazione
├── verifica_database.js   # Verifica completa database
├── verifica_policy.js     # Verifica policy RLS
└── backup_database.js     # Backup automatico
```

## 🎯 **Utilizzo Tipico**

1. **Durante lo sviluppo**: Usa `verifica_database.js` per controllare lo stato
2. **Prima del deploy**: Usa `verifica_policy.js` per verificare la sicurezza
3. **Per i backup**: Usa `backup_database.js` per creare backup automatici

---

**Nota**: Questi script sono stati creati per facilitare la gestione del database durante lo sviluppo. Non sono parte dell'applicazione principale.
