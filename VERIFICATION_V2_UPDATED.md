# Verifica Contratto BellaNapoli v2 - Aggiornato

## 📋 Informazioni Contratto

**Date**: 2025-01-26  
**Contract Name**: BellaNapoliPredictionFactory  
**Network**: BSC Testnet (Chain ID: 97)  
**Solidity Version**: 0.8.24

## ✨ Nuove Funzionalità Aggiunte

### 1. **Funzione `reopenPool()`** ✅
Permette di riaprire una pool chiusa prima che sia stato impostato il winner.

**Controlli di sicurezza:**
- Pool deve essere chiusa (`isClosed = true`)
- Winner non deve essere stato impostato (`!winnerSet`)
- Pool non deve essere cancellata (`!cancelled`)

### 2. **Funzione `recoverCancelledPoolFunds()`** ✅
Recupera tutti i fondi residui da una pool cancellata e li trasferisce al fee wallet.

**Logica:**
- Funziona anche se tutti gli utenti hanno già fatto claim
- Trasferisce qualsiasi fondo residuo al fee wallet

### 3. **Nuovi Eventi**
- `PoolReopened(address indexed poolAddress)` - Emesso quando una pool viene riaperta
- `PoolFundsRecovered(address indexed poolAddress)` - Emesso quando i fondi vengono recuperati

## 🔒 Sicurezza Aggiunta

### Controlli su Pool Cancellate
1. **Non puoi chiudere una pool cancellata**
   - `closePool()` → `require(!cancelled)`
2. **Non puoi riaprire una pool cancellata**
   - `reopenPool()` → `require(!cancelled)`
3. **Non puoi mettere in pausa una pool cancellata**
   - `setEmergencyStop()` → `require(!cancelled)`

## 📦 File Flattened

**File**: `contracts/BellaNapoliPredictionFactory-flattened-v2.sol`
- **Dimensione**: 25K
- **Righe**: 631
- **Contiene**: Tutti gli import OpenZeppelin + contratto Factory + contratto Pool

## 🚀 Funzioni Disponibili

### Per Utenti
1. `placeBet(bool)` - Scommettere su una pool
2. `claimWinnings()` - Rivendicare vincite se hanno vinto
3. `claimRefund()` - Rivendicare refund se la pool è cancellata

### Per Owner (Factory)
1. `createPool(...)` - Creare una nuova pool
2. `closePool(address)` - Chiudere una pool
3. `reopenPool(address)` - **NUOVO** - Riaprire una pool chiusa
4. `setPoolWinner(address, bool)` - Impostare il vincitore
5. `emergencyResolvePool(...)` - Risolvere in emergenza
6. `setPoolEmergencyStop(address, bool)` - Pausa/Resume
7. `cancelPoolPrediction(address, string)` - Cancellare una pool
8. `recoverCancelledPoolFunds(address)` - **NUOVO** - Recuperare fondi residui

### View Functions
1. `getAllPools()` - Tutti gli indirizzi delle pool
2. `getPoolCount()` - Numero totale di pool
3. `getPoolInfo(address)` - Informazioni di una pool
4. `getPoolsByCategory(string)` - **NUOVO** - Pool per categoria

## 📝 Verifica su BSCScan

Quando il contratto viene deployato, usa il file flattened per la verifica:

1. Vai su BSCScan Testnet
2. Clicca su "Contract" → "Verify and Publish"
3. Configurazione:
   - **Compiler Type**: Solidity (Single file)
   - **Compiler Version**: v0.8.24
   - **License**: MIT
4. Incolla il contenuto di `BellaNapoliPredictionFactory-flattened-v2.sol`
5. Verifica

## ✅ Testing

Dopo la verifica, testa le nuove funzionalità:
1. Creare una pool
2. Chiudere la pool
3. Riaprire la pool
4. Cancellare una pool
5. Recuperare fondi residui
6. Verificare eventi emessi

---
**Status**: ✅ Pronto per Deploy e Verifica  
**Network**: BSC Testnet  
**File**: `contracts/BellaNapoliPredictionFactory-flattened-v2.sol`
