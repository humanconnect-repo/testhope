"use client";
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { supabase } from '../lib/supabase'
import { useState, useEffect, useRef } from 'react'

// Set globale per tracciare gli address per cui abbiamo già loggato l'autenticazione
// Condiviso tra tutte le istanze dell'hook per evitare log duplicati
const globalHasLoggedAuth = new Set<string>()

export const useWeb3Auth = () => {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const lastCheckedAddressRef = useRef<string | null>(null)

  // Controlla se l'utente è già autenticato
  useEffect(() => {
    const checkUser = async () => {
      if (!address || !supabase) {
        setUser(null)
        lastCheckedAddressRef.current = null
        return
      }

      // Se abbiamo già controllato questo indirizzo e l'utente è autenticato e corrisponde, skip
      if (user && user.user_metadata?.wallet_address === address && lastCheckedAddressRef.current === address) {
        return
      }

      // Se l'address non è cambiato MA user è null o non corrisponde, dobbiamo ricontrollare
      // Quindi NON facciamo return qui - permettiamo il controllo se user è null o non corrisponde
      
      lastCheckedAddressRef.current = address
      
      try {
        // Normalizza l'indirizzo per il match (come fa upsert_profile)
        const normalizedAddress = address.toLowerCase().trim()
        
        // Controlla SEMPRE il database Supabase per lo stato reale
        // IMPORTANTE: Normalizza anche il wallet_address nel DB per il match case-insensitive
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('wallet_address', normalizedAddress) // Usa ilike per case-insensitive match
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
            // Logga solo una volta per questo address (globale tra tutte le istanze)
            if (!globalHasLoggedAuth.has(address)) {
              console.log('✅ Profilo trovato con firma, autenticando utente:', existingProfile.id)
              globalHasLoggedAuth.add(address)
            }
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
          } else {
            // Se esiste un profilo ma senza firma, richiedi la firma
            setUser(null)
          }
        } else {
          // Se non esiste, mostra il pulsante per firmare
          setUser(null)
        }
      } catch (error) {
        console.error('Errore durante controllo utente:', error)
        setUser(null)
      }
    }
    
    // Esegui immediatamente quando cambia l'indirizzo
    checkUser()
  }, [address]) // Rimosso user dalle dipendenze per evitare loop infiniti

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
      
      
      // 2. Firma il messaggio
      const signature = await signMessageAsync({ message })
      
          // 3. Crea o aggiorna il profilo utente
          // Usa la funzione RPC per creare/aggiornare il profilo
          
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

          if (!profileId) {
            throw new Error('Impossibile creare o recuperare il profilo')
          }

          // Ora carica il profilo completo usando l'ID restituito dalla funzione
          // Usa maybeSingle() per gestire il caso in cui non esiste (non dovrebbe succedere)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .maybeSingle()

          if (profileError) {
            console.error('❌ Errore caricamento profilo:', profileError)
            throw new Error(`Errore Supabase: ${profileError.message}`)
          }

          if (!profileData) {
            throw new Error('Profilo non trovato dopo la creazione')
          }


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

          console.log('✅ Profilo creato/aggiornato, impostando utente:', { 
            profileId: profile?.id, 
            walletAddress: address,
            hasSignature: !!signature 
          })
          
          setUser(mockUser)
          
          // Piccolo delay per assicurarsi che lo stato sia propagato
          // Questo aiuta la pagina profilo a riconoscere l'autenticazione
          await new Promise(resolve => setTimeout(resolve, 100))
      
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
      // Reset dei ref quando l'utente si disconnette
      lastCheckedAddressRef.current = null
      // Rimuovi solo questo address dal Set globale (non cancellare tutto per evitare conflitti)
      if (address) {
        globalHasLoggedAuth.delete(address)
      }
      disconnect()
    } catch (error) {
      console.error('Errore durante il logout:', error)
    }
  }

  const refreshUser = async () => {
    if (!address || !supabase) return

    try {
      // SICUREZZA: Carica solo il profilo del wallet corrente
      // Normalizza l'indirizzo per il match (come fa upsert_profile)
      const normalizedAddress = address.toLowerCase().trim()
      
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('wallet_address', normalizedAddress) // Usa ilike per case-insensitive match
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