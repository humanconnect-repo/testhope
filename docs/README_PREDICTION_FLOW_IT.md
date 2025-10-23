# 📘 Bella Napoli Prediction Market – Guida Operativa (IT)

Questo documento spiega, in italiano, come funziona il sistema di smart contract per le prediction e descrive un caso reale con 4 utenti sulla prediction “Bitcoin raggiungerà $150.000 entro fine 2025?”.

## 🏗️ Architettura
- `BellaNapoliPredictionFactory`: crea e traccia i pool di prediction.
- `PredictionPool`: gestisce una singola prediction (scommesse, chiusura, esito, claim, fee).

## 🕒 Tempi chiave (Esempio BTC 150k)
- Chiusura scommesse (Italia): 15 novembre 2025, ore 21:59 (CET)
- Scadenza evento (Italia): 31 dicembre 2025, ore 21:59 (CET)
- In blockchain gli orari sono in UTC (vedi `README_TIMESTAMPS.md`).

## 🔐 Regole principali
- Le scommesse sono accettate solo fino a `closingDate`.
- Ogni wallet può scommettere una sola volta su un pool.
- Dopo `closingBid`, l’owner del pool imposta manualmente l’esito con `setWinner(true/false)`.
- I vincitori eseguono autonomamente `claim()` per riscattare il premio.
- Fee: l’1,5% viene prelevato dal **pool dei perdenti** e inviato al wallet fisso `secret`. Il restante 98,5% dei perdenti si somma al pool dei vincitori e viene redistribuito pro‑rata ai vincitori.

## 🧪 Caso pratico: 4 utenti
Prediction: “BTC ≥ $150.000 entro il 31/12/2025?” (YES/NO)

### 1) Scommesse effettuate
- Utente A: YES – 50 BNB
- Utente B: YES – 100 BNB
- Utente C: NO – 60 BNB
- Utente D: NO – 40 BNB

Riepilogo:
- Totale YES (vincitori potenziali): 150 BNB
- Totale NO (perdenti potenziali): 100 BNB

### 2) Chiusura scommesse
- Dopo `closingDate` nessuna nuova scommessa è accettata. Il contratto lo fa in automatico confrontando `block.timestamp` con `closingDate`.

### 3) Scadenza evento e impostazione esito
- Dopo `closingBid`, l’owner del pool controlla il prezzo di riferimento e chiama:
  - `setWinner(true)` se BTC ≥ $150.000 (vince YES)
  - `setWinner(false)` se BTC < $150.000 (vince NO)

Supponiamo che **vince YES**.

### 4) Calcolo fee e monte premi
- Pool perdenti (NO): 100 BNB
- Fee 1,5%: 100 × 1,5% = **1,5 BNB** → inviata a `secret` (una sola volta al primo claim)
- Perdenti netti: 100 − 1,5 = **98,5 BNB**
- Pool vincitori (YES): 150 BNB
- Totale da redistribuire ai YES: 150 + 98,5 = **248,5 BNB**

### 5) Claim dei vincitori (self‑service)
Ogni vincitore chiama `claim()` dal proprio wallet. La quota è proporzionale alla puntata sul pool vincente.

- Utente A (YES 50 BNB):
  - Quota = 50 / 150 = 33,33%
  - Premio = 248,5 × 33,33% = **82,833 BNB**

- Utente B (YES 100 BNB):
  - Quota = 100 / 150 = 66,67%
  - Premio = 248,5 × 66,67% = **165,667 BNB**

Totali pagati = 82,833 + 165,667 ≈ **248,5 BNB** (arrotondamenti a parte)

Note:
- I perdenti (C e D) non ricevono nulla.
- La **fee 1,5%** è stata inviata una sola volta al primo `claim()` eseguito.
- Ogni vincitore può fare `claim()` una sola volta; il contratto impedisce doppi claim.

## 🔎 Eventi emessi
- `BetPlaced(user, amount, choice, totalYes, totalNo)` – al momento della scommessa.
- `WinnerSet(winner)` – quando l’owner imposta l’esito.
- `FeeTransferred(feeWallet, amount)` – quando la fee viene inviata.
- `RewardClaimed(user, amount)` – quando un vincitore riceve il premio.

Questi eventi sono utili per aggiornare la UI in tempo reale o indicizzare i dati con listener esterni.

## 🧭 Ruoli e permessi
- **Owner del pool**: imposta l’esito con `setWinner` (solo dopo `closingBid`).
- **Tutti i wallet**: possono scommettere durante la finestra aperta; i vincitori possono fare `claim()` una volta impostato l’esito.

## 🛡️ Sicurezza
- `bettingOpen` blocca scommesse dopo la chiusura.
- `nonReentrant` protegge i payout da reentrancy.
- Doppia scommessa e doppio claim sono impediti da mapping di stato.

## 💼 Fee e trasparenza
- Fee fissa 1,5% prelevata dal pool perdenti e inviata al wallet configurato.
- Redistribuzione ai vincitori = pool vincente + perdenti netti (dopo fee) pro‑rata.

## 🧰 Suggerimenti UI/UX
- Mostrare countdown alla chiusura scommesse e alla scadenza evento.
- Abilitare il bottone `Claim` solo per i vincitori dopo `WinnerSet`.
- Visualizzare lo storico eventi on‑chain per trasparenza.

---
Per i timestamp italiani e la conversione in UTC, vedi anche `contractweb3/README_TIMESTAMPS.md` e lo script `scripts/calculate-timestamps.cjs`.
