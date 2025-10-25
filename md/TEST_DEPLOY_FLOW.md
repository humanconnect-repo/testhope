# Test Deploy Flow - Admin Panel

## 🧪 Test Scenarios

### **Scenario 1: Deploy Contract (Prediction in_attesa)**
1. **Prediction Status**: `in_attesa`
2. **Pool Address**: `NULL`
3. **Azione**: Clicca "Attiva Contract"
4. **Risultato Atteso**:
   - ✅ Pool creata sulla blockchain
   - ✅ Database aggiornato: `status = 'attiva'`, `pool_address = '0xNEW...'`
   - ✅ RPC Response: `{success: true, message: "Contract activated successfully"}`

### **Scenario 2: Redeploy Contract (Prediction attiva)**
1. **Prediction Status**: `attiva`
2. **Pool Address**: `0xOLD123...`
3. **Azione**: Clicca "Redeploy Contract"
4. **Risultato Atteso**:
   - ✅ Nuova pool creata sulla blockchain
   - ✅ Database aggiornato: `pool_address = '0xNEW456...'` (status rimane `attiva`)
   - ✅ RPC Response: `{success: true, message: "Contract activated successfully"}`

## 🔍 Debug Steps

### **1. Controlla Console Browser**
```javascript
// Dovresti vedere questi log:
🚀 Attivando contract per prediction: [ID]
📅 Date convertite: {...}
✅ Contract creato con indirizzo: 0x...
📋 Hash transazione: 0x...
✅ Contract attivato con successo: Contract activated successfully
✅ Prediction attivata con successo: {predictionId: ..., contractAddress: ..., rpcResponse: {...}}
```

### **2. Controlla Database Supabase**
```sql
-- Verifica che la prediction sia stata aggiornata
SELECT id, title, status, pool_address, updated_at 
FROM predictions 
WHERE id = '[PREDICTION_ID]'
ORDER BY updated_at DESC;
```

### **3. Controlla Blockchain**
- Vai su BSCScan Testnet
- Cerca l'indirizzo della pool creata
- Verifica che sia verificata e funzionante

## ⚠️ Possibili Errori

### **Errore RPC**
```
❌ Errore RPC: [error details]
```
**Soluzione**: Verifica connessione Supabase e permessi

### **Errore Attivazione**
```
❌ Errore attivazione contract: Prediction not found
```
**Soluzione**: Verifica che l'ID prediction sia corretto

### **Errore Contract Creation**
```
❌ Errore durante attivazione contract: [contract error]
```
**Soluzione**: Verifica wallet connesso e gas sufficiente

## ✅ Success Indicators

1. **Modal di transazione** si completa senza errori
2. **Console log** mostra tutti i step completati
3. **Database** ha `pool_address` aggiornato
4. **Prediction** appare come "attiva" nell'admin panel
5. **Pool** è verificabile su BSCScan

## 🚀 Ready to Test!

Il codice è ora aggiornato per gestire correttamente:
- ✅ JSON response dalla funzione RPC
- ✅ Error handling migliorato
- ✅ Log dettagliati per debug
- ✅ Supporto per Deploy e Redeploy

**Prova ora il deploy/redeploy nell'admin panel!** 🎯
