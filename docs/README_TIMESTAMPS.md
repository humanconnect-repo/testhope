# 🇮🇹 Configurazione Orari Italiani per Smart Contract

## ⏰ Conversione Orari

### **Sistema di Timezone**
- **Blockchain**: Usa sempre **UTC (Coordinated Universal Time)**
- **Italia**: Usa **CET (Central European Time) = UTC+1**
- **Conversione**: Orario italiano - 1 ora = Orario UTC

### **📅 BTC 150K Prediction - Timestamp**

| Evento | Orario Italiano (CET) | Orario UTC | Timestamp Unix |
|--------|----------------------|------------|----------------|
| **Chiusura Scommesse** | 15 novembre 2025, 21:59 | 15 novembre 2025, 20:59 | `1763236740` |
| **Scadenza Prediction** | 31 dicembre 2025, 21:59 | 31 dicembre 2025, 20:59 | `1767211140` |

### **🔧 Utilizzo nei Contratti**

```solidity
// Importa la libreria
import "./TimeConfig.sol";

// Usa le costanti
uint256 public constant BETTING_CLOSE = TimeConfig.BTC_150K_BETTING_CLOSE;
uint256 public constant PREDICTION_END = TimeConfig.BTC_150K_PREDICTION_END;

// Controlli temporali
require(TimeConfig.isBettingOpen(BETTING_CLOSE), "Betting period has ended");
require(TimeConfig.isPredictionEnded(PREDICTION_END), "Prediction event has not ended yet");
```

### **🧮 Calcolo Timestamp**

**Formula:**
```
Timestamp UTC = Timestamp Italiano - 3600 secondi (1 ora)
```

**Esempio:**
```
15 novembre 2025, 21:59 CET
= 15 novembre 2025, 20:59 UTC
= 1763236740 (timestamp Unix)
```

### **📱 Verifica Frontend**

```javascript
// Converte timestamp UTC in orario italiano per display
const italianTime = new Date(timestamp * 1000).toLocaleString('it-IT', {
  timeZone: 'Europe/Rome'
});

// Esempio: 1763236740 → "15/11/2025, 21:59:00"
```

### **⚠️ Note Importanti**

1. **Ora Legale**: L'Italia usa ora legale (CEST = UTC+2) da marzo a ottobre
2. **Calcolo Automatico**: Usa sempre CET (UTC+1) per semplicità
3. **Verifica**: Controlla sempre i timestamp prima del deploy
4. **Testing**: Usa date vicine per i test locali

### **🔍 Verifica Timestamp**

```bash
# Esegui lo script di calcolo
node scripts/calculate-timestamps.cjs
```

### **📊 Esempi di Conversione**

| Data Italiana | Ora Italiana | Ora UTC | Timestamp |
|---------------|--------------|---------|-----------|
| 15/11/2025 | 21:59 | 20:59 | 1763236740 |
| 31/12/2025 | 21:59 | 20:59 | 1767211140 |
| 01/01/2026 | 00:00 | 23:00 (31/12/2025) | 1767211200 |

### **🎯 Controlli di Sicurezza**

Il contratto blocca automaticamente le scommesse dopo il timestamp di chiusura:

```solidity
modifier bettingOpen() {
    require(block.timestamp <= closingDate, "Betting period has ended");
    require(!isClosed, "Pool is closed");
    _;
}
```

**Risultato**: Nessuna scommessa può essere accettata dopo le 21:59 italiane del 15 novembre 2025.
