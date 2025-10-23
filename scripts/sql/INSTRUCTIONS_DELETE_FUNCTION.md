# Istruzioni per Creare la Funzione di Eliminazione

## 🚀 Esegui questo SQL nella Dashboard di Supabase

Vai su **SQL Editor** nella dashboard di Supabase e esegui questo codice:

```sql
-- Funzione per eliminare predictions (solo admin)
CREATE OR REPLACE FUNCTION delete_prediction_admin(
  prediction_id UUID,
  admin_wallet_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_user_admin BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin
  SELECT is_admin INTO is_user_admin 
  FROM profiles 
  WHERE wallet_address = admin_wallet_address;
  
  IF NOT is_user_admin THEN 
    RAISE EXCEPTION 'Access denied: Only admins can delete predictions'; 
  END IF;
  
  -- Elimina la prediction
  DELETE FROM predictions WHERE id = prediction_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi permessi di esecuzione
GRANT EXECUTE ON FUNCTION delete_prediction_admin(UUID, TEXT) TO authenticated, anon;
```

## ✅ Verifica

Dopo aver eseguito il SQL, verifica che la funzione sia stata creata:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'delete_prediction_admin';
```

## 🔧 Come Funziona

1. **Solo admin** possono eliminare predictions
2. **Verifica** il wallet address nella tabella `profiles`
3. **Elimina** la prediction se l'utente è admin
4. **Restituisce** `true` se eliminata, `false` se non trovata
