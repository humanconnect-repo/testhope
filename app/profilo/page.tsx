"use client";
import { useWeb3Auth } from '../../hooks/useWeb3Auth'
import { useUserTotalBnb } from '../../hooks/useUserTotalBnb'
import { useUserActivePredictions } from '../../hooks/useUserActivePredictions'
import { useUserResolvedPredictions } from '../../hooks/useUserResolvedPredictions'
import { useUserCancelledPredictions } from '../../hooks/useUserCancelledPredictions'
import ProfileForm from '../../components/ProfileForm'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfiloPage() {
  const { isAuthenticated, address, isConnected, user } = useWeb3Auth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false)
  
  // Carica il totale BNB e le statistiche dell'utente
  const { totalBnb, totalBets, bnbGained, bnbLost, netBalance, loading: bnbLoading, error: bnbError } = useUserTotalBnb(user?.id || null)
  
  // Carica le prediction attive dell'utente
  const { predictions: activePredictions, loading: predictionsLoading, error: predictionsError } = useUserActivePredictions(user?.id || null)
  
  // Carica le prediction risolte dell'utente
  const { predictions: resolvedPredictions, loading: resolvedLoading, error: resolvedError } = useUserResolvedPredictions(user?.id || null)
  
  // Carica le prediction cancellate dell'utente
  const { predictions: cancelledPredictions, loading: cancelledLoading, error: cancelledError } = useUserCancelledPredictions(user?.id || null)
  
  // Calcola le statistiche di successo
  const wonPredictions = resolvedPredictions.filter(p => p.winning_rewards_amount && p.winning_rewards_amount > 0).length;
  const totalResolvedPredictions = resolvedPredictions.length;
  const successRate = totalResolvedPredictions > 0 ? ((wonPredictions / totalResolvedPredictions) * 100).toFixed(1) : '0.0';
  
  // Stato per il loading durante la navigazione
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  // Funzione per gestire il click su una prediction con loading
  const handlePredictionClick = (slug: string, id: string) => {
    setNavigatingTo(id)
    router.push(`/bellanapoli.prediction/${slug}`)
  }

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
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {bnbLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `${totalBnb.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB guadagnati</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {bnbLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `+${bnbGained.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB persi</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {bnbLoading ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `-${bnbLost.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bilancio netto</span>
                    <span className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {bnbLoading ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      ) : bnbError ? (
                        <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                      ) : (
                        `${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(4)} BNB`
                      )}
                    </span>
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
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bnbLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-xs">Errore</span>
                    ) : (
                      totalBets
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prediction vinte</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resolvedLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </div>
                    ) : (
                      wonPredictions
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Percentuale successo</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resolvedLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ) : (
                      `${successRate}%`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Le tue Prediction in corso */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Le tue Prediction in corso
              </h3>
              {predictionsLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : predictionsError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 dark:text-red-400 text-sm">{predictionsError}</p>
                </div>
              ) : activePredictions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Non hai prediction attive al momento
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activePredictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                      className={`block p-3 rounded-md transition-colors duration-200 cursor-pointer ${
                        navigatingTo === prediction.id
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {navigatingTo === prediction.id ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                            <span className="text-sm text-primary dark:text-primary-400 font-medium">
                              Caricamento...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {prediction.title}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 ml-2 flex-shrink-0">
                              {prediction.category}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Scommessa: {prediction.amount_bnb.toFixed(4)} BNB
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              prediction.position === 'yes' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {prediction.position === 'yes' ? 'Sì' : 'No'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Le tue Prediction risolte */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏆 Le tue Prediction risolte
              </h3>
              {resolvedLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : resolvedError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 dark:text-red-400 text-sm">{resolvedError}</p>
                </div>
              ) : resolvedPredictions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Non hai prediction risolte al momento
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {resolvedPredictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                      className={`block p-3 rounded-md transition-colors duration-200 cursor-pointer ${
                        navigatingTo === prediction.id
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {navigatingTo === prediction.id ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                            <span className="text-sm text-primary dark:text-primary-400 font-medium">
                              Caricamento...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {prediction.title}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 ml-2 flex-shrink-0">
                              🏆 Risolta
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                Scommessa: {prediction.amount_bnb.toFixed(4)} BNB
                              </span>
                              <span className={`px-2 py-1 rounded ${
                                prediction.position === 'yes' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {prediction.position === 'yes' ? 'Sì' : 'No'}
                              </span>
                            </div>
                            {prediction.winning_rewards_amount && (
                              <div className="text-xs font-medium text-green-600 dark:text-green-400">
                                💰 Vincita: {prediction.winning_rewards_amount.toFixed(4)} BNB
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Le tue Prediction cancellate */}
            <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ❌ Le tue Prediction cancellate
              </h3>
              {cancelledLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : cancelledError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 dark:text-red-400 text-sm">{cancelledError}</p>
                </div>
              ) : cancelledPredictions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Non hai prediction cancellate al momento
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cancelledPredictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                      className={`block p-3 rounded-md transition-colors duration-200 cursor-pointer ${
                        navigatingTo === prediction.id
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {navigatingTo === prediction.id ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                            <span className="text-sm text-primary dark:text-primary-400 font-medium">
                              Caricamento...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {prediction.title}
                            </h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 ml-2 flex-shrink-0">
                              ❌ Cancellata
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                Scommessa: {prediction.amount_bnb.toFixed(4)} BNB
                              </span>
                              <span className={`px-2 py-1 rounded ${
                                prediction.position === 'yes' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {prediction.position === 'yes' ? 'Sì' : 'No'}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
