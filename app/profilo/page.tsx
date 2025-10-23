"use client";
import { useWeb3Auth } from '@/hooks/useWeb3Auth'
import ProfileForm from '@/components/ProfileForm'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProfiloPage() {
  const { isAuthenticated, address, isConnected } = useWeb3Auth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false)

  // Controllo iniziale di autenticazione
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const checkAuth = async () => {
      console.log('🔍 Stato attuale:', { isAuthenticated, isConnected, address })
      
      // Se è già autenticato, non mostrare il loading
      if (isAuthenticated) {
        console.log('✅ Già autenticato, accesso diretto')
        setIsChecking(false)
        setHasBeenAuthenticated(true)
        return
      }
      
      // Se non è connesso, reindirizza subito senza loading
      if (!isConnected) {
        console.log('❌ Non connesso, reindirizzamento immediato...')
        router.push('/')
        return
      }
      
      // Se è connesso ma non autenticato, aspetta di più per il controllo
      console.log('🔍 Wallet connesso, controllo autenticazione...')
      timeoutId = setTimeout(() => {
        // Usa una funzione che accede ai valori più recenti
        const checkAfterDelay = () => {
          console.log('🔍 Stato dopo delay:', { isAuthenticated, isConnected, address, hasBeenAuthenticated })
          if (!isAuthenticated && !hasBeenAuthenticated) {
            console.log('❌ Connesso ma non autenticato, reindirizzamento...')
            router.push('/')
          } else {
            console.log('✅ Autenticazione verificata:', { isAuthenticated, isConnected, address })
            setIsChecking(false)
            setHasBeenAuthenticated(true)
          }
        }
        checkAfterDelay()
      }, 5000) // Aumentato a 5 secondi
    }
    
    checkAuth()
    
    // Cleanup del timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isAuthenticated, isConnected, address, hasBeenAuthenticated]) // Aggiungi le dipendenze

  // Monitora i cambiamenti di stato senza reindirizzare
  useEffect(() => {
    if (isAuthenticated && isChecking) {
      console.log('✅ Autenticazione rilevata, fermando il loading')
      setIsChecking(false)
      setHasBeenAuthenticated(true)
    }
  }, [isAuthenticated, isChecking])

  // Prevenire reindirizzamento se l'utente diventa autenticato
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Utente autenticato, fermando qualsiasi reindirizzamento')
      setIsChecking(false)
      setHasBeenAuthenticated(true)
    }
  }, [isAuthenticated])

  // Cancella il timeout se l'utente diventa autenticato
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ Utente autenticato, cancellando timeout di reindirizzamento')
      // Il timeout verrà cancellato automaticamente dal cleanup del primo useEffect
    }
  }, [isAuthenticated])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-yellow-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Reindirizzamento alla homepage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              👤 Il tuo profilo
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200"
            >
              🏠 HOME
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Personalizza il tuo account e gestisci le tue informazioni.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form profilo */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileForm />
            
            {/* Volumi BNB */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💰 Volumi in BNB
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Volumi effettuati totali</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">0.00 BNB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB guadagnati</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">+0.00 BNB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB persi</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">-0.00 BNB</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bilancio netto</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">0.00 BNB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info aggiuntive */}
          <div className="space-y-6">
            {/* Info wallet */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔗 Wallet connesso
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Indirizzo</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stato</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Connesso
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiche */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Le tue statistiche
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prediction fatte</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prediction vinte</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Percentuale successo</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">-</span>
                </div>
              </div>
            </div>

            {/* Azioni rapide */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Azioni rapide
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {/* TODO: Implementare navigazione alle prediction in corso */}}
                  className="w-full text-left px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  📊 Le tue Prediction in corso
                </button>
                <button
                  onClick={() => {/* TODO: Implementare navigazione alle prediction passate */}}
                  className="w-full text-left px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  📈 Le tue Prediction passate
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
