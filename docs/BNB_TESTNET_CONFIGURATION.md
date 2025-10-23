# Configurazione BNB Chain Testnet

## Panoramica
L'applicazione Bella Napoli è stata configurata per utilizzare la **testnet di BNB Chain** invece della mainnet. Questo permette di testare l'applicazione in un ambiente sicuro senza utilizzare fondi reali.

## Configurazione Wallet

### 1. Aggiungere la rete BNB Chain Testnet al wallet

Per utilizzare l'applicazione, devi aggiungere la testnet di BNB Chain al tuo wallet (MetaMask, Rabby Wallet, ecc.):

#### Parametri di rete:
- **Nome della rete**: BNB Chain Testnet
- **Nuovo URL RPC**: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- **Chain ID**: `97`
- **Simbolo valuta**: `tBNB`
- **URL Block Explorer**: `https://testnet.bscscan.com`

### 2. Ottenere tBNB (Test BNB)

Per testare le transazioni, avrai bisogno di tBNB (test BNB):

1. Visita il [BNB Smart Chain Faucet](https://www.bnbchain.org/en/blog/what-is-bnb-testnet-faucet)
2. Inserisci l'indirizzo del tuo wallet
3. Richiedi i tBNB gratuiti per i test

## Modifiche Implementate

### 1. Configurazione Wagmi (`lib/wagmi.ts`)
```typescript
// Prima (mainnet)
import { bsc } from 'wagmi/chains'
chains: [bsc]

// Dopo (testnet)
import { bscTestnet } from 'wagmi/chains'
chains: [bscTestnet]
```

### 2. Hook di Autenticazione (`hooks/useWeb3Auth.ts`)
```typescript
// Chain ID aggiornato da 56 (mainnet) a 97 (testnet)
Chain ID: 97
```

## Vantaggi della Testnet

1. **Sicurezza**: Nessun rischio di perdere fondi reali
2. **Test gratuiti**: tBNB gratuiti per testare le funzionalità
3. **Sviluppo**: Ambiente ideale per testare nuove funzionalità
4. **Debug**: Facile identificazione e risoluzione di problemi

## Note Importanti

- I tBNB non hanno valore reale e sono solo per i test
- Le transazioni sulla testnet sono più veloci e gratuite
- I dati sulla testnet possono essere resettati periodicamente
- Per la produzione, sarà necessario tornare alla mainnet

## Troubleshooting

### Wallet non si connette alla testnet
1. Verifica che la rete sia configurata correttamente
2. Controlla che il Chain ID sia `97`
3. Prova a disconnettere e riconnettere il wallet

### Transazioni falliscono
1. Verifica di avere tBNB sufficienti
2. Controlla che il wallet sia connesso alla testnet
3. Verifica la connessione internet

### Prezzo BNB non si aggiorna
Il prezzo mostrato è sempre quello della mainnet (BNB reale) per riferimento, ma le transazioni avvengono sulla testnet con tBNB.
