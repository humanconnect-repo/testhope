# Bella Napoli - Technical Documentation

Documentazione tecnica per sviluppatori e amministratori del sistema.

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Web3**: RainbowKit, Wagmi
- **Sicurezza**: Row Level Security (RLS)

## 📁 Struttura Progetto

```
├── app/                    # Next.js App Router
├── components/             # Componenti React
├── hooks/                  # Custom hooks
├── lib/                    # Utilities e configurazioni
├── scripts/                # Script di automazione
│   └── sql/               # Script SQL organizzati
├── types/                  # TypeScript types
└── docs/                   # Documentazione dettagliata
```

## 🔧 Setup Sviluppo

1. **Clona il repository**
2. **Installa dipendenze**: `npm install`
3. **Configura variabili d'ambiente**: Crea `.env.local`
4. **Avvia il server**: `npm run dev`

## 🔒 Architettura Sicurezza

- **RLS Policies**: Protezione a livello di riga nel database
- **RPC Functions**: Funzioni sicure per operazioni critiche
- **Admin Controls**: Controlli di accesso per amministratori
- **Web3 Auth**: Autenticazione tramite wallet

## 📚 Documentazione Dettagliata

- `docs/SECURITY_IMPLEMENTATION_GUIDE.md` - Guida completa alla sicurezza
- `docs/EXECUTE_MISSING_FUNCTIONS.md` - Esecuzione script SQL
- `scripts/sql/README.md` - Organizzazione script database

## 🚀 Deploy

Il progetto è ottimizzato per il deploy su Vercel con Supabase come backend.

## ⚠️ Note Importanti

- **NON eseguire mai `npx supabase db reset`** - Le configurazioni di sicurezza sono critiche
- Gli script SQL sono organizzati in `scripts/sql/` per categoria
- La documentazione tecnica è in `docs/` (esclusa da Git per sicurezza)

---

**Per sviluppatori e amministratori del sistema**
