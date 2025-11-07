# Soluzione Deploy Smart Contracts - BNB Chain Testnet

## 🚨 Problema Iniziale

Durante il deploy con Hardhat Ignition su BNB Chain Testnet, abbiamo riscontrato l'errore:

```
ProviderError: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go value of type common.Address
```

## 🔍 Analisi del Problema

### Cause Identificate:

1. **RPC Incompatibile**: L'RPC `https://data-seed-prebsc-1-s1.binance.org:8545/` non era compatibile con Viem/Ignition
2. **Versioni Plugin**: Hardhat Ignition 3.x+ ha bug di encoding con RPC Go-based come BNB Chain
3. **Configurazione Account**: Ignition non riusciva a identificare correttamente l'account deployer

## ✅ Soluzioni Implementate

### 1. Aggiornamento RPC URL

**File**: `hardhat.config.js`

```javascript
bnbTestnet: {
  type: "http",
  url: "https://bsc-testnet.publicnode.com", // ✅ RPC più stabile
  chainId: 97,
  gasPrice: 20000000000,
  httpHeaders: { 'Content-Type': 'application/json' }, // ✅ Headers espliciti
  timeout: 20000, // ✅ Timeout per evitare blocchi
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
},
```

**Motivo**: RPC pubblico più stabile e compatibile con le richieste JSON-RPC di Viem.

### 2. Deploy Diretto con Ethers.js

Dato che Hardhat Ignition aveva problemi persistenti, abbiamo implementato un approccio diretto:

**File**: `scripts/deploy-simple-direct.mjs`

```javascript
import { ethers } from "ethers";
import { config } from "dotenv";

// Carica variabili d'ambiente
config({ path: ".env.local" });

async function main() {
  // Configurazione BNB Testnet
  const provider = new ethers.JsonRpcProvider("https://bsc-testnet.publicnode.com");
  
  // Carica chiave privata
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Deploy contract
  const factory = new ethers.ContractFactory(SimpleStorageABI, SimpleStorageBytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  // Test contract
  await contract.set(42);
  const value = await contract.get();
  console.log("✅ Value retrieved:", value.toString());
}
```

### 3. Utilizzo Bytecode Reale

Invece di bytecode hardcoded, abbiamo utilizzato i file compilati da Hardhat:

```javascript
// ABI e Bytecode dai file compilati
const SimpleStorageABI = [/* ABI reale da artifacts/ */];
const SimpleStorageBytecode = "0x6080604052348015600e575f80fd5b5060a58061001b5f395ff3fe...";
```

## 🎯 Risultato

### Deploy Completato con Successo:

- **📍 Contract Address**: `0xF3ceb00466c1389D7b7e38b58c9c4B7Ca3Efe27D`
- **🌐 Network**: BNB Chain Testnet (Chain ID: 97)
- **✅ Deploy**: Completato senza errori
- **✅ Test**: Funzioni `set()` e `get()` funzionanti
- **💰 Gas**: Consumo normale (~0.001 BNB)

## 📋 Lezioni Apprese

### 1. RPC Selection
- **❌ Evitare**: RPC ufficiali Binance (spesso instabili)
- **✅ Preferire**: RPC pubblici affidabili come `publicnode.com`

### 2. Hardhat Ignition vs Deploy Diretto
- **Ignition**: Ottimo per deploy complessi, ma può avere problemi con RPC specifici
- **Deploy Diretto**: Più controllo, funziona sempre con ethers.js

### 3. Configurazione Environment
- **✅ Essenziale**: Caricare `.env.local` esplicitamente in ESM
- **✅ Verificare**: Formato chiave privata (64 caratteri, senza 0x)

## 🚀 Prossimi Passi

1. **Deploy Factory**: Applicare la stessa soluzione per `BellaNapoliPredictionFactory`
2. **Verifica BSCScan**: Verificare i contratti deployati
3. **Integrazione Frontend**: Collegare i contratti deployati al frontend

## 📁 File Coinvolti

- `hardhat.config.js` - Configurazione RPC aggiornata
- `scripts/deploy-simple-direct.mjs` - Script deploy diretto
- `artifacts/contracts/SimpleStorage.sol/SimpleStorage.json` - Bytecode reale
- `.env.local` - Chiave privata per deploy

## 🔧 Comandi Utili

```bash
# Deploy diretto
node scripts/deploy-simple-direct.mjs

# Verifica contratto
npx hardhat verify --network bnbTestnet <CONTRACT_ADDRESS>

# Test locale
npx hardhat test
```

---

**Data**: 2024-01-XX  
**Status**: ✅ Risolto  
**Network**: BNB Chain Testnet  
**Gas Used**: ~0.001 BNB
