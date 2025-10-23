# 🔒 Sicurezza Admin Panel - Bella Napoli

## 🛡️ Livelli di Protezione Implementati

### 1. **Autenticazione Web3**
- ✅ **Wallet Connection**: Solo utenti con wallet connesso possono accedere
- ✅ **Firma Digitale**: Richiede firma per autenticazione
- ✅ **Session Management**: Gestione sicura delle sessioni

### 2. **Autorizzazione Admin**
- ✅ **Database Check**: Verifica `is_admin = true` nel database
- ✅ **RPC Function**: Usa `check_wallet_admin_status()` per controllo sicuro
- ✅ **Wallet Address**: Verifica tramite indirizzo wallet univoco

### 3. **Protezione Frontend**
- ✅ **useAdmin Hook**: Controllo centralizzato dei permessi
- ✅ **Route Protection**: Redirect automatico se non admin
- ✅ **Component Guard**: Doppia protezione nel componente AdminPanel
- ✅ **Loading States**: UI sicura durante verifiche

### 4. **Protezione Backend**
- ✅ **RLS Policies**: Row Level Security su tabella predictions
- ✅ **Admin Only UPDATE**: Solo admin possono modificare predictions
- ✅ **Service Role**: Funzioni critiche solo per service role
- ✅ **Input Validation**: Validazione dati lato server

## 🔐 Flusso di Sicurezza

```
1. Utente si connette con wallet
   ↓
2. Firma digitale per autenticazione
   ↓
3. Verifica is_admin nel database
   ↓
4. Se admin: accesso al pannello
   ↓
5. Se non admin: redirect alla home
```

## 🚫 Cosa NON può fare un utente normale

- ❌ Accedere alla pagina `/0x9dc9ca268dc8370b`
- ❌ Vedere il pulsante "OP Panel" nell'header
- ❌ Modificare predictions nel database
- ❌ Creare nuove predictions
- ❌ Accedere alle funzioni admin

## ✅ Cosa può fare SOLO un admin

- ✅ Accedere al pannello admin
- ✅ Creare nuove predictions
- ✅ Modificare predictions esistenti
- ✅ Gestire lo stato delle predictions
- ✅ Vedere statistiche e dati sensibili

## 🔍 Controlli di Sicurezza

### Frontend
```typescript
// 1. Hook useAdmin
const { isAdmin, loading, error } = useAdmin();

// 2. Protezione route
if (!loading && !isAdmin) {
  router.push('/');
}

// 3. Protezione componente
if (!loading && !isAdmin) {
  return <AccessDenied />;
}
```

### Backend
```sql
-- 1. Policy RLS
CREATE POLICY "Only admins can update predictions" ON predictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'sub' AND is_admin = true
    )
  );

-- 2. Funzione di controllo admin
CREATE OR REPLACE FUNCTION check_wallet_admin_status(input_wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE wallet_address = input_wallet_address AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🚨 Note di Sicurezza

1. **Nessun Bypass**: Impossibile bypassare i controlli lato client
2. **Database First**: La verifica admin avviene sempre nel database
3. **Wallet Unico**: Ogni wallet può avere solo un profilo admin
4. **Session Secure**: Le sessioni sono gestite in modo sicuro
5. **Error Handling**: Gestione sicura degli errori senza leak di informazioni

## 🔧 Manutenzione

- **Aggiungere Admin**: Impostare `is_admin = true` nel database
- **Rimuovere Admin**: Impostare `is_admin = false` nel database
- **Verificare Logs**: Controllare console per tentativi di accesso
- **Monitorare Accessi**: Tracciare chi accede al pannello

---

**⚠️ IMPORTANTE**: La sicurezza è implementata a più livelli. Anche se qualcuno riuscisse a bypassare un livello, gli altri livelli lo fermerebbero.
