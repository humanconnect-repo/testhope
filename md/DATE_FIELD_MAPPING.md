# Mapping Campi Date - Admin Panel

## 📋 Mapping Corretto

### **Form Labels ↔ Database Fields:**

| Etichetta Form | Campo Database | Descrizione | Uso nel Contratto |
|----------------|----------------|-------------|-------------------|
| **"Data Chiusura Scommesse"** | `closing_date` | Fino a quando si può scommettere | `closingDate` (primo parametro) |
| **"Data Chiusura Prediction"** | `closing_bid` | Quando finisce l'evento | `closingBid` (secondo parametro) |

### **🔧 Logica del Contratto:**

Il contratto smart richiede:
```solidity
require(closingBid > closingDate, "Closing bid must be after closing date");
```

**Quindi:**
- `closing_date` (scommesse) deve essere **prima**
- `closing_bid` (prediction) deve essere **dopo**

### **📅 Esempio Pratico:**

**Prediction**: "Il Napoli vincerà la partita?"

1. **Data Chiusura Scommesse**: 2025-11-30 23:59:00
   - Campo DB: `closing_date`
   - Parametro contratto: `closingDate`
   - Significato: Ultimo momento per scommettere

2. **Data Chiusura Prediction**: 2025-12-01 23:59:00
   - Campo DB: `closing_bid`
   - Parametro contratto: `closingBid`
   - Significato: Quando finisce l'evento (dopo la partita)

### **✅ Risultato:**

- ✅ **Scommesse aperte** fino al 30 novembre
- ✅ **Evento finisce** il 1 dicembre
- ✅ **Contratto valido** (closingBid > closingDate)

## 🎯 Form Comportamento

### **Creazione Prediction:**
- **"Data Chiusura Scommesse"** → salva in `closing_date`
- **"Data Chiusura Prediction"** → salva in `closing_bid`

### **Modifica Prediction:**
- **"Data Chiusura Scommesse"** → aggiorna `closing_date`
- **"Data Chiusura Prediction"** → aggiorna `closing_bid`

### **Deploy Contract:**
- `closing_date` → `closingDate` (primo parametro)
- `closing_bid` → `closingBid` (secondo parametro)

## 🚀 Test

Ora quando crei una prediction:
1. **"Data Chiusura Scommesse"**: 30 novembre 2025
2. **"Data Chiusura Prediction"**: 1 dicembre 2025
3. **Deploy Contract**: Funzionerà senza errori!

**Il mapping è ora corretto e coerente!** ✅
