"use client";
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWeb3Auth } from '@/hooks/useWeb3Auth'
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

  // Carica profilo esistente
  useEffect(() => {
    if (!address || !isAuthenticated) return

    const loadProfile = async () => {
      try {
        // Prima prova a usare i dati già caricati nell'utente
        const userProfile = user?.user_metadata
        console.log('🔍 ProfileForm useEffect - user:', user)
        console.log('🔍 ProfileForm useEffect - userProfile:', userProfile)
        console.log('🔍 ProfileForm useEffect - user.user_metadata:', user?.user_metadata)
        
        if (userProfile && userProfile.username) {
          console.log('📋 Caricando profilo da utente autenticato:', userProfile)
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
        console.log('📋 Caricando profilo dal database...')
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio')
          .eq('wallet_address', address)
          .single()

        console.log('🔍 Database query result:', { data, error })

        if (error && error.code !== 'PGRST116') {
          console.error('Errore caricamento profilo:', error)
        } else if (data) {
          console.log('📋 Dati caricati dal database:', data)
          setProfile({
            nickname: data.username || '', // username nel DB, nickname nel form
            avatar_url: data.avatar_url || '',
            bio: data.bio || ''
          })
          // Non serve più setAvatarPreview
        } else {
          console.log('📋 Nessun profilo trovato nel database')
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
  const isValidImageUrl = (url: string): boolean => {
    if (!url.trim()) return true // URL vuoto è valido (userà immagine stock)
    
    try {
      const urlObj = new URL(url)
      // Verifica che sia HTTP/HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false
      }
      // Verifica estensione immagine
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
      return imageExtensions.test(urlObj.pathname) || urlObj.hostname.includes('imgur') || urlObj.hostname.includes('cloudinary')
    } catch {
      return false
    }
  }

  // Gestisce il cambio dell'URL avatar
  const handleAvatarUrlChange = (url: string) => {
    setUrlError(null)
    setProfile(prev => ({ ...prev, avatar_url: url }))
    
    if (url && !isValidImageUrl(url)) {
      setUrlError('URL non valido. Inserisci un link a un\'immagine (jpg, png, gif, webp)')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!address || !isAuthenticated) {
      alert('❌ Devi essere autenticato per modificare il profilo')
      return
    }

    // Valida URL prima di salvare
    if (profile.avatar_url && !isValidImageUrl(profile.avatar_url)) {
      setUrlError('URL non valido. Inserisci un link a un\'immagine valida')
      return
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
      const { data: freshData, error: freshError } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('wallet_address', address)
        .single()

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
    <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
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
      </form>
    </div>
  )
}
