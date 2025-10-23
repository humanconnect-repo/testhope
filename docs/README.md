# 🍕 Bella Napoli - Prediction Market Italiano

**Scommetti sul futuro, con stile degen italiano.**

Un sito di prediction market ispirato a Polymarket, completamente in italiano e con supporto per dark mode.

## 🚀 Caratteristiche

- **Next.js 14** con App Router
- **Tailwind CSS** per lo styling
- **Dark Mode** completo con toggle
- **Design responsive** per mobile e desktop
- **5 prediction statiche** con dati di esempio
- **Pagine dinamiche** per ogni prediction
- **UI moderna** ispirata a Polymarket
- **Web3 Integration** con wallet connection (MetaMask, Rabby)
- **Supabase Backend** per autenticazione e profili utente
- **Avatar Upload** con storage sicuro

## 🎨 Design

### Modalità Chiara
- Sfondo bianco pulito
- Testo grigio scuro
- Colori primari: blu-turchese (#00A8E8) e verde acqua (#2ECC71)
- Card con ombre leggere

### Modalità Scura
- Sfondo nero lavagna (#0D1117)
- Testo bianco
- Card grigio antracite (#1E1E1E)
- Effetti glow sottili

## 📱 Struttura

### Homepage (`/`)
- Header con navbar e ricerca
- Lista delle 5 prediction principali
- Footer minimal

### Pagine Prediction (`/bellanapoli.prediction/[slug]`)
- Titolo e descrizione
- Percentuali Sì/No
- Box per scommettere
- Dettagli evento
- Top scommettitori
- Sezione commenti

## 🛠️ Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Configura le variabili d'ambiente:
Crea un file `.env.local` con le tue credenziali Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Avvia il server di sviluppo:
```bash
npm run dev
```

4. Apri [http://localhost:3000](http://localhost:3000) nel browser

## 📦 Script Disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Build per produzione
- `npm run start` - Avvia il server di produzione
- `npm run lint` - Esegue il linting

## 🎯 Prediction Incluse

1. **Chi vincerà la finale di X Factor?** (TV)
2. **Arresteranno Fabrizio Corona entro 6 mesi?** (Disagio)
3. **Lacerenza aprirà una nuova Gintoneria entro la fine dell'anno?** (Disagio)
4. **Tether riuscirà a piazzare un suo candidato dentro il board della Juve alla prossima votazione?** (Politica)
5. **Ci sarà un blackout nazionale entro il 2026?** (Politica)

## 🎨 Componenti

- `Header.tsx` - Header con navbar e ricerca
- `ThemeToggle.tsx` - Toggle per dark/light mode
- `PredictionCard.tsx` - Card per le prediction
- `PredictionList.tsx` - Lista delle prediction
- `Footer.tsx` - Footer del sito

## 🔧 Tecnologie

- **Next.js 14** - Framework React
- **TypeScript** - Tipizzazione statica
- **Tailwind CSS** - Framework CSS
- **Font Nunito Sans** - Font principale

## 📝 Note

- Tutti i dati sono statici e di esempio
- Le scommesse non sono funzionali (solo UI)
- Il dark mode è persistente tramite localStorage
- Design completamente responsive

---

*Sviluppato con ❤️ per la community degen italiana*
