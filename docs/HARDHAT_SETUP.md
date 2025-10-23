# Setup Hardhat per BNB Chain

## 1. Configurazione Completata ✅

- ✅ Node.js aggiornato a v22.21.0 (usando nvm)
- ✅ Hardhat installato (v2.22.0)
- ✅ Dipendenze installate
- ✅ Configurazione creata (`hardhat.config.cjs`)
- ✅ Struttura cartelle creata
- ✅ **COMPILAZIONE FUNZIONANTE!** 🎉

## 2. Prossimi Passi

### 2.1 Crea il file .env
Copia `env.example` e rinominalo in `.env`:
```bash
cp env.example .env
```

### 2.2 Configura le variabili d'ambiente
Apri `.env` e inserisci:

**PRIVATE_KEY:**
- Apri MetaMask
- Vai su Account Details > Export Private Key
- Copia la chiave privata (senza 0x iniziale)

**BSCSCAN_API_KEY:**
- Vai su https://bscscan.com/
- Crea un account
- Vai su API-KEYs
- Crea una nuova API key
- Copia la chiave

### 2.3 Testa la configurazione
```bash
# Compila i contratti
npx hardhat compile

# Esegui i test
npx hardhat test

# Verifica la configurazione
npx hardhat run scripts/deploy.ts --network localhost
```

## 3. Struttura Progetto

```
├── contracts/          # Smart contracts (.sol)
├── scripts/           # Script di deploy e utility
├── test/              # Test dei contratti
├── hardhat.config.ts  # Configurazione Hardhat
├── .env              # Variabili d'ambiente (da creare)
└── env.example       # Template variabili d'ambiente
```

## 4. Reti Configurate

- **localhost**: Rete locale per test
- **bnbTestnet**: BNB Smart Chain Testnet (Chain ID: 97)
- **bnbMainnet**: BNB Smart Chain Mainnet (Chain ID: 56)

## 5. Comandi Utili

```bash
# Compila
npx hardhat compile

# Test
npx hardhat test

# Deploy su testnet
npx hardhat run scripts/deploy.ts --network bnbTestnet

# Verifica contratto
npx hardhat verify --network bnbTestnet <CONTRACT_ADDRESS>
```

## 6. Sicurezza ⚠️

- **NON condividere mai la tua PRIVATE_KEY**
- **NON committare il file .env**
- **Usa sempre testnet per i test**
- **Verifica sempre il codice prima del deploy**
