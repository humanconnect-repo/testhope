# ✅ Guida Verifica Contratto su BSCScan

## 📋 Informazioni Contratto

- **Indirizzo**: `0x3C16d0e1aF0a290ad47ea35214D32c88F910b846`
- **Network**: BSC Testnet
- **Chain ID**: 97
- **File Flattened**: `contracts/BellaNapoliPredictionFactory-flattened-v2.sol`

## 🔗 Link Verifica

👉 https://testnet.bscscan.com/address/0x3C16d0e1aF0a290ad47ea35214D32c88F910b846

## 📝 Passaggi per Verificare

### 1. Vai sulla pagina del contratto
- Clicca sul link sopra
- Oppure cerca l'indirizzo su https://testnet.bscscan.com

### 2. Apri la sezione Contract
- Vedi la tab "Contract" nella parte superiore
- Clicca su "Verify and Publish"

### 3. Compila il Form

#### **Compi (Compilatore)**
- **Compilation Type**: **Solidity (Single file)**
- **Compiler Version**: v0.8.24+commit.e11b9ed9 (o semplicemente 0.8.24)
- **Open Source License Type**: MIT License (MIT)
- **Optimization**: **Yes** (dev essere attivo!)
- **Runs**: **200**

#### **Constructor Arguments**
- **Constructor Arguments ABI-encoded**: (lascia vuoto, il costruttore non ha parametri)

### 4. Inserisci il Codice Sorgente
- Apri il file: `contracts/BellaNapoliPredictionFactory-flattened-v2.sol`
- **SELEZIONA TUTTO** (Ctrl+A o Cmd+A)
- **COPIOLA** (Ctrl+C o Cmd+C)
- **INCOLLA** nel campo "Enter the Solidity Contract Code"
- **NON modificare nulla!**

### 5. Verifica
- Clicca su "Verify and Publish"
- Attendi la conferma (pochi secondi)
- ✅ Done! Il contratto è verificato

## ⚠️ Possibili Problemi

### Errore: "Unable to verify"
- Verifica che Optimization sia **Yes** con Runs = **200**
- Verifica che Compiler Version sia **0.8.24**
- Verifica di aver copiato TUTTO il contenuto del file flattened

### Errore: "Bytecode doesn't match"
- Assicurati di usare EXATTAMENTE le impostazioni di compilazione usate per il deploy
- Verifica che il contratto sia stato deployato sulla BSC Testnet

### File troppo grande
- Il file flatten è ~631 righe, dovrebbe stare tranquillamente
- Se hai problemi, usa il metodo "via API" (vedi sotto)

## 🚀 Dopo la Verifica

Una volta verificato:
1. ✅ Il contratto sarà leggibile
2. ✅ I wallet mostreranno i nomi delle funzioni (niente più "unknown transaction")
3. ✅ Puoi vedere e tracciare le chiamate in tempo reale
4. ✅ Gli utenti avranno informazioni dettagliate sulle transazioni

## 🔧 Metodo Alternativo: Verifica via API (AVANZATO)

Se il metodo sopra non funziona, puoi verificare via API:

```bash
npx hardhat verify --network bnbTestnet 0x3C16d0e1aF0a290ad47ea35214D32c88F910b846
```

Ma prima devi aggiungere BSCScan API key nel file `.env.local`:
```
BSCSCAN_API_KEY=your_api_key_here
```

## 📊 Impostazioni Corrette

| Impostazione | Valore |
|--------------|--------|
| Compilation Type | Solidity (Single file) |
| Compiler Version | 0.8.24 |
| License | MIT |
| Optimization | ✅ Enabled |
| Runs | 200 |
| Constructor Args | (vuoto) |

---
**Status**: ✅ File Pronto  
**Prova ora**: https://testnet.bscscan.com/address/0x3C16d0e1aF0a290ad47ea35214D32c88F910b846
