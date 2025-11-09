"use client";
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWeb3Auth } from '../hooks/useWeb3Auth'
import Avatar from './Avatar'

interface Profile {
  nickname: string;
  avatar_url: string;
  bio: string;
}

interface User {
  user_metadata?: {
    profile?: Profile;
    username?: string;
    avatar_url?: string;
    bio?: string;
  };
}

export default function ProfileForm() {
  const { address, isAuthenticated, user, refreshUser }: {
    address: string | undefined;
    isAuthenticated: boolean;
    user: User | null;
    refreshUser: () => void;
  } = useWeb3Auth()
  
  const [profile, setProfile] = useState<Profile>({
    nickname: '',
    avatar_url: '',
    bio: ''
  })
  const [pending, setPending] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Carica profilo esistente
  useEffect(() => {
    if (!address || !isAuthenticated) return

    const loadProfile = async () => {
      try {
        // Prima prova a usare i dati già caricati nell'utente
        const userProfile = user?.user_metadata
        
        if (userProfile && userProfile.username) {
          setProfile({
            nickname: userProfile.username || '', // username nel DB, nickname nel form
            avatar_url: userProfile.avatar_url || '',
            bio: userProfile.bio || ''
          })
          // Non serve più setAvatarPreview
          setLoading(false)
          return
        }

        // Se non ci sono dati nell'utente, carica dal database
        // Normalizza l'indirizzo per il match case-insensitive
        const normalizedAddress = address.toLowerCase().trim()
        
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio')
          .ilike('wallet_address', normalizedAddress) // Case-insensitive match
          .maybeSingle() // Usa maybeSingle invece di single per evitare errori 406

        // Gestisci errore PGRST116 (No rows) come caso normale (quando il profilo non esiste ancora)
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Errore caricamento profilo:', error)
          }
        } else if (data) {
          setProfile({
            nickname: data.username || '', // username nel DB, nickname nel form
            avatar_url: data.avatar_url || '',
            bio: data.bio || ''
          })
          // Non serve più setAvatarPreview
        }
      } catch (err) {
        console.error('Errore caricamento profilo:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [address, isAuthenticated, user])

  // Funzione per validare URL immagine
  const isValidImageUrl = (url: string): { valid: boolean; error?: string } => {
    if (!url.trim()) return { valid: true } // URL vuoto è valido (userà immagine stock)
    
    try {
      const urlObj = new URL(url)
      
      // Blocca immagini delle predizioni
      if (urlObj.pathname.includes('prediction-images') || urlObj.pathname.includes('/predictions/')) {
        return { valid: false, error: 'Non è possibile utilizzare immagini delle predizioni come avatar' }
      }
      
      // Verifica che sia HTTP/HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL non valido. Inserisci un link a un\'immagine (jpg, png, gif, webp)' }
      }
      
      // Verifica estensione immagine
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
      const hasValidExtension = imageExtensions.test(urlObj.pathname) || urlObj.hostname.includes('imgur') || urlObj.hostname.includes('cloudinary')
      
      if (!hasValidExtension) {
        return { valid: false, error: 'URL non valido. Inserisci un link a un\'immagine (jpg, png, gif, webp)' }
      }
      
      return { valid: true }
    } catch {
      return { valid: false, error: 'URL non valido. Inserisci un link a un\'immagine (jpg, png, gif, webp)' }
    }
  }

  // Gestisce il cambio dell'URL avatar
  const handleAvatarUrlChange = (url: string) => {
    setUrlError(null)
    setProfile(prev => ({ ...prev, avatar_url: url }))
    
    if (url) {
      const validation = isValidImageUrl(url)
      if (!validation.valid) {
        setUrlError(validation.error || 'URL non valido')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!address || !isAuthenticated) {
      alert('❌ Devi essere autenticato per modificare il profilo')
      return
    }

    // Valida URL prima di salvare
    if (profile.avatar_url) {
      const validation = isValidImageUrl(profile.avatar_url)
      if (!validation.valid) {
        setUrlError(validation.error || 'URL non valido. Inserisci un link a un\'immagine valida')
        return
      }
    }

    setPending(true)
    try {
      // Aggiorna profilo usando funzione RPC sicura - SICUREZZA: Solo il proprietario può modificare
      const { data, error } = await supabase.rpc('update_profile_secure', {
        p_wallet_address: address,
        p_nickname: profile.nickname?.trim() || null,
        p_avatar_url: profile.avatar_url?.trim() === '' ? null : (profile.avatar_url?.trim() || null),
        p_bio: profile.bio?.trim() || null,
        p_caller_wallet: address  // SICUREZZA: Passa il wallet dell'utente chiamante
      })

      if (error) throw error
      
      if (!data) {
        throw new Error('Impossibile aggiornare il profilo. Verifica di essere il proprietario.')
      }
      
      // Ricarica i dati freschi dal database per aggiornare il form
      // Normalizza l'indirizzo per il match case-insensitive
      const normalizedAddress = address.toLowerCase().trim()
      
      const { data: freshData, error: freshError } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .ilike('wallet_address', normalizedAddress) // Case-insensitive match
        .maybeSingle() // Usa maybeSingle invece di single

      if (!freshError && freshData) {
        setProfile({
          nickname: freshData.username || '',
          avatar_url: freshData.avatar_url || '',
          bio: freshData.bio || ''
        })
      }
      
      // Aggiorna l'utente autenticato con i nuovi dati
      await refreshUser()
      
      alert('✅ Profilo aggiornato con successo!')
    } catch (err: any) {
      console.error('Errore salvataggio:', err)
      alert(`❌ Errore: ${err.message}`)
    } finally {
      setPending(false)
    }
  }

  if (!isAuthenticated || !address || loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Caricamento profilo...</span>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 shadow-sm">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar e Nickname - sempre visibili */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar 
              src={profile.avatar_url}
              alt="Avatar"
              size="md"
              fallbackText={profile.nickname?.[0] || address?.slice(2, 4)}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile.nickname || `Wallet ${address?.slice(0, 6)}...`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Immagine profilo
              </p>
            </div>
          </div>
          
          {/* Freccia per espandere/contrarre */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors duration-200"
            aria-label={isExpanded ? 'Contrai' : 'Espandi'}
          >
            <svg 
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Campi modificabili - visibili solo quando espanso */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-blue-200 dark:border-blue-700 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Immagine Profilo
              </label>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => handleAvatarUrlChange(e.target.value)}
                placeholder="https://esempio.com/immagine.jpg (opzionale)"
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {urlError && (
                <p className="text-red-500 text-xs mt-1">{urlError}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lascia vuoto per usare l'immagine predefinita. Supporta: jpg, png, gif, webp, svg.
              </p>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nickname
              </label>
              <input
                type="text"
                value={profile.nickname}
                onChange={(e) => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Il tuo nickname degen"
                maxLength={20}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {profile.nickname.length}/20 caratteri
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Raccontaci qualcosa di te..."
                rows={3}
                maxLength={150}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {profile.bio.length}/150 caratteri
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {pending ? '💾 Salvataggio...' : '💾 Salva profilo'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
