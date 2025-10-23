"use client";
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export const useWeb3Auth = () => {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Controlla se l'utente è già autenticato
  useEffect(() => {
    const checkUser = async () => {
      if (!address || !supabase) {
        setUser(null)
        return
      }

      // Se l'utente è già autenticato, non ricontrollare
      if (user && user.user_metadata?.wallet_address === address) {
        console.log('✅ Utente già autenticato, skip controllo')
        return
      }

      try {
        // Controlla SEMPRE il database Supabase per lo stato reale
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address)
          .maybeSingle() // FIX: Cambiato da .single() a .maybeSingle() per evitare errori 406

        if (error && error.code !== 'PGRST116') {
          console.error('Errore controllo profilo:', error)
          setUser(null)
          return
        }

        if (existingProfile) {
          // Controlla se il profilo ha una firma valida
          if (existingProfile.signature) {
            // Se esiste un profilo con firma, autentica l'utente
            const mockUser = {
              id: existingProfile.id, // Usa l'ID del profilo dal database
              email: `${address}@wallet.local`,
              user_metadata: {
                wallet_address: address,
                provider: 'web3',
                has_signed: true,
                profile: existingProfile
              }
            }
            setUser(mockUser)
            console.log('✅ Utente autenticato dal database (con firma):', address, existingProfile)
          } else {
            // Se esiste un profilo ma senza firma, richiedi la firma
            setUser(null)
            console.log('🔐 Profilo esistente ma senza firma - richiesta firma:', address, existingProfile)
          }
        } else {
          // Se non esiste, mostra il pulsante per firmare
          setUser(null)
          console.log('🔐 Wallet connesso ma non autenticato - richiesta firma:', address)
        }
      } catch (error) {
        console.error('Errore durante controllo utente:', error)
        setUser(null)
      }
    }
    
    // Aggiungi un piccolo delay per evitare controlli troppo frequenti
    const timeoutId = setTimeout(checkUser, 200)
    return () => clearTimeout(timeoutId)
  }, [address, user]) // Aggiungi user come dipendenza

  const signInWithWallet = async () => {
    if (!address || !supabase) {
      console.error('❌ Wallet non connesso o Supabase non configurato')
      return
    }

    setIsLoading(true)
    try {
      // 1. Genera messaggio da firmare (formato EIP-4361)
      const message = `Bella Napoli wants you to sign in with your Ethereum account:
${address}

I accept the Bella Napoli Terms of Service: https://bella-napoli.vercel.app/terms

URI: https://bella-napoli.vercel.app
Version: 1
Chain ID: 97
Nonce: ${Math.random().toString(36).substring(2, 15)}
Issued At: ${new Date().toISOString()}`
      
      console.log('🔐 Richiesta firma per wallet:', address)
      
      // 2. Firma il messaggio
      const signature = await signMessageAsync({ message })
      console.log('✅ Messaggio firmato con successo')
      
          // 3. Crea o aggiorna il profilo utente
          console.log('💾 Salvando profilo per wallet:', address)
          
          // Usa la funzione RPC per creare/aggiornare il profilo
          console.log('🔄 Usando funzione RPC per upsert profilo...')
          
          const { data: profileId, error: rpcError } = await supabase
            .rpc('upsert_profile', {
              wallet_addr: address,
              user_name: null,
              avatar_url_param: null,
              signature_param: signature,
              nonce_param: null
            })

          if (rpcError) {
            console.error('❌ Errore RPC upsert_profile:', rpcError)
            throw new Error(`Errore Supabase: ${rpcError.message}`)
          }

          // Ora carica il profilo completo
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', address)
            .single()

          if (profileError) {
            console.error('❌ Errore caricamento profilo:', profileError)
            throw new Error(`Errore Supabase: ${profileError.message}`)
          }

          console.log('✅ Profilo salvato con successo:', profileData)

          // 4. Crea l'oggetto utente con i dati del profilo
          const profile = profileData // profileData è già un oggetto singolo, non un array
          const mockUser = {
            id: profile?.id || address, // Usa l'ID del profilo se disponibile, altrimenti l'indirizzo
            email: `${address}@wallet.local`,
            user_metadata: {
              wallet_address: address,
              signature: signature,
              provider: 'web3',
              has_signed: true,
              profile: profile // Includi i dati del profilo appena creato
            }
          }

          setUser(mockUser)
          console.log('🎉 Login effettuato con successo!', mockUser)
      
    } catch (error) {
      console.error('❌ Errore durante il login:', error)
      alert(`Errore durante il login: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      disconnect()
      console.log('Logout effettuato')
    } catch (error) {
      console.error('Errore durante il logout:', error)
    }
  }

  const refreshUser = async () => {
    if (!address || !supabase) return

    try {
      // SICUREZZA: Carica solo il profilo del wallet corrente
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address) // SICUREZZA: Solo il wallet corrente
        .maybeSingle() // FIX: Cambiato da .single() a .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Errore refresh profilo:', error)
        return
      }

      if (existingProfile) {
        const mockUser = {
          id: existingProfile.id, // Usa l'ID del profilo dal database
          email: `${address}@wallet.local`,
          user_metadata: {
            wallet_address: address,
            provider: 'web3',
            has_signed: true,
            profile: existingProfile
          }
        }
        setUser(mockUser)
        console.log('🔄 Utente aggiornato:', existingProfile)
      }
    } catch (error) {
      console.error('Errore durante refresh utente:', error)
    }
  }

  return { 
    signInWithWallet, 
    signOut,
    address, 
    isConnected, 
    isLoading,
    user,
    isAuthenticated: !!user,
    refreshUser
  }
}