# BSCScan Verification Files

Questa cartella contiene tutti i file necessari per la verifica dei contratti su BSCScan.

## 📁 Struttura Cartelle

### `bscscan-test-verification/`
- **Scopo**: Test con contratto semplice (SimpleStorage)
- **Contratto**: SimpleStorage (0xfa8C198F6b57011f52c01876a76Cf7187B027955)
- **Stato**: ✅ Verificato automaticamente da BSCScan
- **File**: `SimpleStorage.sol`, `README.md`

### `bscscan-verification/`
- **Scopo**: Verifica del contratto Factory originale
- **Contratto**: BellaNapoliPredictionFactory (0xB1eAda2A721057cF44c5100a09150B34497B785D)
- **Stato**: ❌ In corso di verifica
- **File**:
  - `BellaNapoliPredictionFactory.sol` - Versione completa
  - `BellaNapoliPredictionFactory-Clean.sol` - Versione pulita
  - `BellaNapoliPredictionFactory-FactoryOnly.sol` - Solo Factory
  - `BellaNapoliPredictionFactory-Only.sol` - Versione alternativa
  - `README.md` - Istruzioni generali
  - `README-Clean.md` - Istruzioni per versione pulita

### `bscscan-verification-optimized/`
- **Scopo**: Verifica con contratto ottimizzato per ridurre dimensione
- **Contratto**: BellaNapoliPredictionFactory (0xB1eAda2A721057cF44c5100a09150B34497B785D)
- **Stato**: ❌ In corso di verifica
- **File**:
  - `BellaNapoliPredictionFactory-Optimized.sol` - Versione ottimizzata
  - `README.md` - Istruzioni per versione ottimizzata

## 🔧 File di Supporto

### File JSON di Verifica
- `factory-complete-flattened.json` - Contratto completo flattened
- `factory-complete-source.json` - Codice sorgente completo
- `factory-deployed-bytecode.json` - Bytecode deployato
- `factory-deployed-version.json` - Versione deployata
- `factory-flattened.sol` - Codice flattened
- `factory-simple.sol` - Versione semplificata
- `factory-single-license.json` - Licenza singola
- `factory-verification-final.json` - Verifica finale
- `factory-verification-flattened.json` - Verifica flattened
- `factory-verification-original.json` - Verifica originale
- `factory-verification.json` - Verifica base
- `simple-factory-verification.json` - Verifica semplice

## 🎯 Prossimi Passi

1. **Test con SimpleStorage**: ✅ Completato
2. **Verifica Factory originale**: 🔄 In corso
3. **Verifica Factory ottimizzato**: 🔄 In corso
4. **Documentazione**: ✅ Completata

## 📋 Istruzioni Rapide

### Per Verificare il Factory Originale
1. Vai su: https://testnet.bscscan.com/address/0xB1eAda2A721057cF44c5100a09150B34497B785D
2. Clicca "Contract" → "Verify and Publish"
3. Seleziona "Solidity (Single file)"
4. Usa il file: `bscscan-verification/BellaNapoliPredictionFactory.sol`
5. Impostazioni:
   - **Contract Name**: `BellaNapoliPredictionFactory`
   - **Compiler**: `v0.8.19+commit.7dd6d404`
   - **Optimization**: `Yes, 200 runs`
   - **License**: `MIT License (3)`

### Per Verificare il Factory Ottimizzato
1. Usa il file: `bscscan-verification-optimized/BellaNapoliPredictionFactory-Optimized.sol`
2. Stesse impostazioni del Factory originale

## 🚨 Problemi Noti

- **Dimensione contratto**: Il contratto supera il limite di 24576 bytes
- **API V1 deprecata**: BSCScan ha deprecato l'API V1
- **Bytecode mismatch**: Il bytecode non corrisponde al codice sorgente

## ✅ Successi

- **SimpleStorage**: Verificato automaticamente da BSCScan
- **File organizzati**: Tutti i file di verifica sono organizzati
- **Documentazione**: Istruzioni complete per ogni versione
