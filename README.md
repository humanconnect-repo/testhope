# Bella Napoli - Prediction Market 🍕

Il Prediction Market Italiano per scommettere sul futuro con stile degen!

Bella Napoli è una piattaforma Web3 costruita sulla BNB Chain che ti permette di scommettere su eventi futuri utilizzando BNB. Con un'interfaccia intuitiva e smart contract sicuri, Bella Napoli rende il mercato delle predizioni accessibile a tutti i degen che amano la bella Italia.

## 🎯 L'Idea di Bella Napoli

Bella Napoli nasce dall'idea di creare predizioni su eventi all'italiana, portando nel mondo crypto la passione e lo stile italiano. La piattaforma offre un modo unico per scommettere su eventi che riguardano la cultura, lo sport, la politica e il lifestyle italiano, combinando la tradizione con l'innovazione blockchain.

Inoltre, Bella Napoli è pensata per le community crypto che vogliono creare predizioni in live, permettendo ai membri di scommettere su eventi che riguardano crypto, NFT, DeFi o la community stessa.

## 🚀 Caratteristiche Principali

- **Predizioni Decentralizzate**: Tutte le scommesse sono gestite tramite smart contract su BNB Chain
- **Interfaccia Intuitiva**: Design moderno e user-friendly per un'esperienza fluida
- **Wallet Integration**: Supporto per MetaMask, Rabby, WalletConnect e altri wallet compatibili
- **Trasparenza Totale**: Tutte le transazioni sono verificabili on-chain
- **Gestione Profilo**: Personalizza il tuo profilo con avatar, nickname e bio
- **Categorie Diversificate**: Crypto, Politica, Sport, TV, Lifestyle e molto altro
- **Sistema di Quote**: Visualizza in tempo reale le quote delle predizioni

## 🌐 Link Utili

- **Sito Web**: [bellanapoli.io](https://bellanapoli.io)
- **X (Twitter)**: [@bellanapoli_io](https://x.com/bellanapoli_io)
- **Pear (Keet.io)**: Unisciti alla community su Keet.io tramite Pear

## ⚠️ BNB Chain Testnet

Bella Napoli è attualmente disponibile sulla **BNB Chain Testnet** per mostrare agli utenti il funzionamento della piattaforma. La versione testnet permette di testare tutte le funzionalità in un ambiente sicuro, utilizzando token di test.

**Nota importante**: i fondi utilizzati nella testnet sono token di test e non hanno valore reale.

### Configurazione Wallet

Per utilizzare Bella Napoli, devi configurare il tuo wallet per connettersi alla BNB Chain Testnet:

- **Network Name**: BSC Testnet
- **RPC URL**: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`
- **ChainID**: 97 (0x61)
- **Symbol**: tBNB
- **Explorer**: [testnet.bscscan.com](https://testnet.bscscan.com/)

**Metodo consigliato**: Utilizza [ChainList](https://chainlist.org/chain/97) per aggiungere automaticamente la rete al tuo wallet.

## 🎮 Come Funziona

1. **Connetti il Wallet**: Connetti il tuo wallet (MetaMask, Rabby, ecc.) alla BNB Chain Testnet
2. **Ottieni tBNB**: Richiedi tBNB da un faucet per iniziare a scommettere
3. **Crea il Profilo**: Firma un messaggio per creare il tuo profilo sulla piattaforma
4. **Scegli una Predizione**: Esplora le predizioni disponibili e scegli quella su cui vuoi scommettere
5. **Piazza la Scommessa**: Scegli la tua posizione (SI/NO) e l'importo in BNB
6. **Firma la Transazione**: Conferma la transazione nel tuo wallet
7. **Attendi il Risultato**: Quando la predizione viene risolta, se hai vinto puoi fare claim delle tue vincite

## 🛠️ Stack Tecnologico

### Frontend

- **Next.js 14**: Framework React full-stack con App Router, Server Components e API Routes
- **React 18**: Libreria UI per interfacce moderne e reattive
- **TypeScript 5.3**: Type safety end-to-end con Strict Mode
- **Tailwind CSS 3.3**: Framework CSS utility-first per design responsive
- **TanStack Query 5.90**: Gestione stato server, caching e sincronizzazione dati
- **Recharts 3.3**: Libreria per grafici e visualizzazioni dati

### Blockchain & Web3

- **BNB Chain Testnet**: Rete blockchain per smart contract e transazioni
- **Wagmi**: React hooks per Ethereum
- **RainbowKit**: Componenti UI per connessione wallet
- **Viem**: Libreria TypeScript per interagire con la blockchain
- **Hardhat**: Framework di sviluppo per smart contract Solidity

### Backend & Database

- **Supabase**: Database PostgreSQL con Row Level Security (RLS)
- **PostgreSQL**: Database relazionale per dati utenti e predizioni
- **Custom Auth**: Sistema di autenticazione basato su wallet (firma messaggi EIP-4361)

### Smart Contracts

- **Solidity**: Linguaggio per smart contract
- **Factory Contract**: Contratto principale per gestione predizioni
- **PredictionPool Contracts**: Contratti istanziati per ogni singola predizione

### API & Integrazioni

- **UEFA API**: Dati eventi sportivi
- **Polymarket API**: Analisi trend e argomenti discussi
- **BSCScan API**: Verifica transazioni e contratti

## 📁 Struttura del Progetto

```
app/                          # Next.js App Router
├── layout.tsx               # Root layout
├── page.tsx                 # Home page
├── documentation/             # Documentazione
├── bellanapoli.prediction/   # Pagine prediction
└── api/                     # API routes

components/                   # Componenti React riutilizzabili
├── Header.tsx
├── Footer.tsx
├── Web3Provider.tsx
├── AdminPanel.tsx
└── ...

lib/                         # Utilities e helpers
├── contracts.ts             # Funzioni smart contracts
├── wagmi.ts                 # Configurazione Wagmi
└── supabase.ts              # Client Supabase

hooks/                       # Custom React hooks
├── useWeb3Auth.ts
├── useContracts.ts
└── ...

contracts/                    # Smart contracts Solidity
├── BellaNapoliPredictionFactory.sol
└── test/                    # Test per smart contracts

public/                      # Asset statici
└── media/

docs/                        # Documentazione
├── policysupa/              # Policy RLS Supabase
└── smartcontracts/          # Documentazione smart contracts
```

## 🔒 Sicurezza

Bella Napoli implementa multiple misure di sicurezza per garantire la protezione dei dati e la trasparenza:

- **Smart Contract Verificati**: Tutti i contratti sono verificati e open source su BSCScan
- **Database Sicuro**: Policy RLS blindate e funzioni RPC con SECURITY DEFINER per protezione dati
- **Autenticazione Wallet**: Sistema custom basato su firma messaggi (EIP-4361) senza password
- **Trasparenza Blockchain**: Tutte le transazioni sono pubbliche e verificabili on-chain

## 📚 Documentazione

La documentazione completa è disponibile su [bellanapoli.io/documentation](https://bellanapoli.io/documentation) e include tutorial, specifiche tecniche, documentazione smart contracts e guide di sicurezza.

## 🚀 Getting Started

### Prerequisiti

- Node.js 18+ e npm/yarn
- Wallet crypto (MetaMask, Rabby, ecc.)
- Account Supabase (per sviluppo locale)

### Installazione

```bash
# Clona il repository
git clone <repository-url>

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env.local
# Modifica .env.local con le tue credenziali

# Avvia il server di sviluppo
npm run dev
```

### Variabili d'Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📝 Licenza

Bella Napoli è open source. Consulta i file di licenza per maggiori dettagli.

## 🤝 Contribuire

Contributi, issue e feature request sono benvenuti! Per maggiori informazioni, consulta la documentazione.

**Bella Napoli** - Dove le predizioni diventano realtà! 🍕
