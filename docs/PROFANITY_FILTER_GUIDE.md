# 🛡️ Guida al Filtro Parole Inappropriate

## 📁 File da Modificare
Il filtro si trova in: `lib/profanityFilter.ts`

## 🔧 Come Aggiungere Parole

### **1. Aggiungere Parole Italiane**
Modifica l'array `ITALIAN_PROFANITY_WORDS`:

```typescript
const ITALIAN_PROFANITY_WORDS = [
  'allupato', 'ammucchiata', 'arrapato',
  // ... parole esistenti ...
  'nuova_parola_1', 'nuova_parola_2', 'nuova_parola_3'  // ← Aggiungi qui
];
```

### **2. Aggiungere Parole Inglesi**
Modifica l'array `ENGLISH_PROFANITY_WORDS`:

```typescript
const ENGLISH_PROFANITY_WORDS = [
  'abuse', 'anal', 'anus', 'ass',
  // ... parole esistenti ...
  'new_word_1', 'new_word_2', 'new_word_3'  // ← Aggiungi qui
];
```

### **3. Aggiungere Parole in Altre Lingue**
Crea un nuovo array e aggiungilo alla lista combinata:

```typescript
// Nuova lingua (es. spagnolo)
const SPANISH_PROFANITY_WORDS = [
  'palabra1', 'palabra2', 'palabra3'
];

// Aggiorna la lista combinata
const ALL_PROFANITY_WORDS = [
  ...ITALIAN_PROFANITY_WORDS, 
  ...ENGLISH_PROFANITY_WORDS,
  ...SPANISH_PROFANITY_WORDS  // ← Aggiungi qui
];
```

## 📝 Regole per Aggiungere Parole

### **✅ Formato Corretto**
- **Tutto minuscolo**: `cazzo` ✅, `Cazzo` ❌
- **Senza accenti**: `cazzo` ✅, `cazzò` ❌
- **Senza punteggiatura**: `cazzo` ✅, `cazzo!` ❌
- **Virgole separate**: `'parola1', 'parola2'` ✅

### **⚠️ Attenzione**
- Le parole vengono normalizzate automaticamente
- Gli accenti vengono rimossi: `cazzò` → `cazzo`
- La punteggiatura viene ignorata: `cazzo!` → `cazzo`
- Le maiuscole vengono convertite: `CAZZO` → `cazzo`

## 🧪 Test del Filtro

### **Test Manuale**
```typescript
import { validateComment } from '@/lib/profanityFilter';

// Test con parola italiana
console.log(validateComment('Che cazzo dici?')); 
// { isValid: false, message: "Il tuo commento contiene parole inappropriate..." }

// Test con parola inglese
console.log(validateComment('What the fuck?')); 
// { isValid: false, message: "Il tuo commento contiene parole inappropriate..." }

// Test con parola pulita
console.log(validateComment('Ottimo commento!')); 
// { isValid: true }
```

### **Test in Console Browser**
1. Apri la pagina dei commenti
2. Apri Developer Tools (F12)
3. Nella console digita:
```javascript
// Testa una parola
validateComment('testa questa parola');
```

## 📊 Statistiche Attuali

- **Italiano**: ~200 parole
- **Inglese**: ~300 parole (selezione delle più comuni)
- **Totale**: ~500 parole

## 🔄 Aggiornamento Automatico

Il filtro si aggiorna automaticamente quando modifichi il file. Non serve riavviare il server.

## 🚨 Note Importanti

1. **Backup**: Fai sempre un backup prima di modificare
2. **Test**: Testa sempre le modifiche prima di pubblicare
3. **Performance**: Troppe parole possono rallentare la validazione
4. **Privacy**: Le parole inappropriate non vengono mai mostrate all'utente

## 📚 Fonti

- **Italiano**: [censor-text/profanity-list](https://github.com/censor-text/profanity-list)
- **Inglese**: [censor-text/profanity-list](https://github.com/censor-text/profanity-list)
- **Repository**: https://github.com/censor-text/profanity-list
