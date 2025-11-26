"use client";
import { useWeb3Auth } from '../../hooks/useWeb3Auth'
import { useUserTotalBnb } from '../../hooks/useUserTotalBnb'
import { useUserActivePredictions } from '../../hooks/useUserActivePredictions'
import { useUserResolvedPredictions } from '../../hooks/useUserResolvedPredictions'
import { useUserCancelledPredictions } from '../../hooks/useUserCancelledPredictions'
import ProfileForm from '../../components/ProfileForm'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfiloPage() {
  const { isAuthenticated, address, isConnected, user, isLoading } = useWeb3Auth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false)
  const [resolvedStartIndex, setResolvedStartIndex] = useState(0)
  const resolvedItemsPerPage = 4
  const [activePredictionsPage, setActivePredictionsPage] = useState(0)
  const activePredictionsPerPage = 4
  
  // Carica il totale BNB e le statistiche dell'utente
  const { totalBnb, totalBets, bnbGained, bnbLost, netBalance, totalWins, loading: bnbLoading, error: bnbError } = useUserTotalBnb(user?.id || null)
  
  // Carica le prediction attive dell'utente
  const { predictions: activePredictions, loading: predictionsLoading, error: predictionsError } = useUserActivePredictions(user?.id || null)
  
  // Carica le prediction risolte dell'utente
  const { predictions: resolvedPredictions, loading: resolvedLoading, error: resolvedError } = useUserResolvedPredictions(user?.id || null)
  
  // Carica le prediction cancellate dell'utente
  const { predictions: cancelledPredictions, loading: cancelledLoading, error: cancelledError } = useUserCancelledPredictions(user?.id || null)
  
  // Calcola le statistiche di successo usando i dati da profiles (ottimizzato!)
  // Usa totalWins da profiles invece di filtrare resolvedPredictions
  const wonPredictions = totalWins;
  // totalResolvedPredictions = tutte le prediction risolte dove l'utente ha scommesso (vincite + perse)
  const totalResolvedPredictions = resolvedPredictions.length;
  // La percentuale di successo è calcolata SOLO sulle prediction risolte
  const successRate = totalResolvedPredictions > 0 
    ? ((wonPredictions / totalResolvedPredictions) * 100).toFixed(1) 
    : '0.0';

  // Calcola i volumi BNB solo dalle prediction risolte (escludendo quelle cancellate)
  const totalResolvedBnb = resolvedPredictions.reduce((sum, pred) => sum + (pred.amount_bnb || 0), 0);
  const totalResolvedGained = resolvedPredictions.reduce((sum, pred) => sum + (pred.winning_rewards_amount || 0), 0);
  const totalResolvedLost = totalResolvedBnb > totalResolvedGained ? totalResolvedBnb - totalResolvedGained : 0;
  const totalResolvedNetBalance = totalResolvedGained - totalResolvedBnb;
  
  // Stato per il loading durante la navigazione
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  // Funzione per gestire il click su una prediction con loading
  const handlePredictionClick = (slug: string, id: string) => {
    setNavigatingTo(id)
    router.push(`/bellanapoli.prediction/${slug}`)
  }

  // Controllo iniziale di autenticazione
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined
    let maxWaitTime: NodeJS.Timeout | undefined
    
    const checkAuth = async () => {
      // Se è già autenticato (user disponibile), non mostrare il loading
      if (isAuthenticated && user) {
        setIsChecking(false)
        setHasBeenAuthenticated(true)
        return
      }
      
      // Se non è connesso, reindirizza subito senza loading
      if (!isConnected) {
        router.push('/')
        return
      }
      
      // Se è connesso ma user non è ancora disponibile, aspetta
      // (la query potrebbe essere ancora in corso anche se isLoading è false)
      if (isConnected && !user) {
        setIsChecking(true)
        
        // Timeout massimo: se dopo 8 secondi user non è disponibile, reindirizza
        maxWaitTime = setTimeout(() => {
          if (!user && !isAuthenticated) {
            router.push('/')
          }
        }, 8000)
        
        return
      }
    }
    
    checkAuth()
    
    // Cleanup dei timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (maxWaitTime) {
        clearTimeout(maxWaitTime)
      }
    }
  }, [isAuthenticated, isConnected, address, user, router])

  // Monitora direttamente quando user diventa disponibile (reazione immediata)
  useEffect(() => {
    if (user && isConnected && address) {
      setIsChecking(false)
      setHasBeenAuthenticated(true)
    }
  }, [user, isConnected, address])

  // Reindirizza immediatamente se cambia wallet e non è autenticato
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isChecking && hasBeenAuthenticated) {
      router.push('/')
    }
  }, [address, isAuthenticated, isConnected, isChecking, hasBeenAuthenticated, router])

  // Reset dell'indice quando cambiano le prediction risolte
  useEffect(() => {
    setResolvedStartIndex(0)
  }, [resolvedPredictions.length])

  // Calcola le prediction visibili e gli indici
  const visibleResolvedPredictions = resolvedPredictions.slice(
    resolvedStartIndex,
    resolvedStartIndex + resolvedItemsPerPage
  )
  const canScrollUp = resolvedStartIndex > 0
  const canScrollDown = resolvedStartIndex + resolvedItemsPerPage < resolvedPredictions.length
  
  // Calcola il totale pagine in modo esplicito
  const totalResolvedPages = resolvedPredictions.length > 0 
    ? Math.ceil(resolvedPredictions.length / resolvedItemsPerPage)
    : 1
  const currentResolvedPage = Math.floor(resolvedStartIndex / resolvedItemsPerPage) + 1

  // Reindirizza quando non autenticato (dopo il controllo iniziale e solo se ha già controllato)
  // NON reindirizzare se user potrebbe ancora arrivare (isConnected ma user null)
  useEffect(() => {
    // Non reindirizzare se user potrebbe ancora arrivare
    if (isConnected && !user && !hasBeenAuthenticated) {
      return
    }
    if (!isAuthenticated && !user && !isChecking && hasBeenAuthenticated) {
      const timeoutId = setTimeout(() => {
        router.push('/')
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [isAuthenticated, isChecking, hasBeenAuthenticated, isConnected, user, router])

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              👤 Il tuo profilo
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              HOME
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Personalizza il tuo account e gestisci le tue informazioni.
          </p>
        </div>

        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Mobile: Wallet connesso (primo) */}
          <div className="lg:order-2">
            {/* Info wallet */}
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
          </div>

          {/* Mobile: Form profilo (secondo) */}
          <div className="lg:col-span-2 lg:order-1">
            <ProfileForm />
          </div>

          {/* Mobile: Volumi BNB (terzo) */}
          <div className="lg:col-span-2 lg:order-3 lg:-mt-6">
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💰 Volumi in BNB
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Volumi effettuati totali</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {(bnbLoading || resolvedLoading) ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : (bnbError || resolvedError) ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `${totalResolvedBnb.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB guadagnati</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {(bnbLoading || resolvedLoading) ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : (bnbError || resolvedError) ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `+${totalResolvedGained.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">BNB persi</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {(bnbLoading || resolvedLoading) ? (
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ) : (bnbError || resolvedError) ? (
                      <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                    ) : (
                      `-${totalResolvedLost.toFixed(4)} BNB`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bilancio netto</span>
                    <span className={`text-lg font-bold ${totalResolvedNetBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(bnbLoading || resolvedLoading) ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      ) : (bnbError || resolvedError) ? (
                        <span className="text-red-500 dark:text-red-400 text-sm">Errore</span>
                      ) : (
                        `${totalResolvedNetBalance >= 0 ? '+' : ''}${totalResolvedNetBalance.toFixed(4)} BNB`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Mobile: Statistiche (quarto) */}
          <div className="lg:order-4">
            {/* Statistiche */}
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Le tue statistiche
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prediction fatte</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(bnbLoading || resolvedLoading) ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </div>
                    ) : (bnbError || resolvedError) ? (
                      <span className="text-red-500 dark:text-red-400 text-xs">Errore</span>
                    ) : (
                      totalResolvedPredictions
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prediction vinte</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bnbLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-xs">Errore</span>
                    ) : (
                      wonPredictions
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Percentuale successo</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(bnbLoading || resolvedLoading) ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ) : bnbError ? (
                      <span className="text-red-500 dark:text-red-400 text-xs">Errore</span>
                    ) : (
                      `${successRate}%`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Prediction in corso (sesto) */}
          <div className="lg:col-span-2 lg:order-6">
            {/* Le tue Prediction in corso */}
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {activePredictions
                      .slice(activePredictionsPage * activePredictionsPerPage, (activePredictionsPage + 1) * activePredictionsPerPage)
                      .map((prediction) => (
                        <div
                          key={prediction.id}
                          onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                          className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer ${
                            navigatingTo === prediction.id
                              ? 'bg-primary/10 dark:bg-primary/20 border-primary/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {navigatingTo === prediction.id ? (
                            <div className="flex items-center justify-center flex-1 py-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                                <span className="text-sm text-primary dark:text-primary-400 font-medium">
                                  Caricamento...
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {prediction.image_url && (
                                <img
                                  src={prediction.image_url}
                                  alt={prediction.title}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                  {prediction.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {prediction.category}
                                </p>
                              </div>
                              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                  {/* Frecce di navigazione */}
                  {activePredictions.length > activePredictionsPerPage && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={() => setActivePredictionsPage(prev => Math.max(0, prev - 1))}
                        disabled={activePredictionsPage === 0}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Pagina precedente"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Pagina {activePredictionsPage + 1} di {Math.ceil(activePredictions.length / activePredictionsPerPage)}
                      </span>
                      <button
                        onClick={() => setActivePredictionsPage(prev => Math.min(Math.ceil(activePredictions.length / activePredictionsPerPage) - 1, prev + 1))}
                        disabled={activePredictionsPage >= Math.ceil(activePredictions.length / activePredictionsPerPage) - 1}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Pagina successiva"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile: Prediction risolte (quinto) */}
          <div className="lg:order-5 lg:-mt-6">
            {/* Le tue Prediction risolte */}
            <div id="resolved-predictions-section" className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {visibleResolvedPredictions.map((prediction) => (
                      <div
                        key={prediction.id}
                        onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                        className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer ${
                          navigatingTo === prediction.id
                            ? 'bg-primary/10 dark:bg-primary/20 border-primary/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {navigatingTo === prediction.id ? (
                          <div className="flex items-center justify-center flex-1 py-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                              <span className="text-sm text-primary dark:text-primary-400 font-medium">
                                Caricamento...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {prediction.image_url && (
                              <img
                                src={prediction.image_url}
                                alt={prediction.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                {prediction.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {prediction.category}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Frecce per scorrere le prediction */}
                  {(canScrollUp || canScrollDown) && (
                    <div className="mt-4 flex justify-center items-center gap-3">
                      {/* Freccia su */}
                      {canScrollUp && (
                        <button
                          onClick={() => {
                            const newIndex = Math.max(0, resolvedStartIndex - resolvedItemsPerPage)
                            setResolvedStartIndex(newIndex)
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Mostra prediction precedenti"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      
                      {/* Indicatore pagine */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {currentResolvedPage} di {totalResolvedPages}
                      </span>
                      
                      {/* Freccia giù */}
                      {canScrollDown && (
                        <button
                          onClick={() => {
                            setResolvedStartIndex(resolvedStartIndex + resolvedItemsPerPage)
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Mostra prediction successive"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile: Prediction cancellate (settimo) - mostrato solo se ci sono prediction cancellate */}
          {cancelledLoading ? (
            <div className="lg:col-span-3 lg:order-7">
              <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ❌ Le tue Prediction cancellate
                </h3>
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
              </div>
            </div>
          ) : cancelledError ? (
            <div className="lg:col-span-3 lg:order-7">
              <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ❌ Le tue Prediction cancellate
                </h3>
                <div className="text-center py-4">
                  <p className="text-red-500 dark:text-red-400 text-sm">{cancelledError}</p>
                </div>
              </div>
            </div>
          ) : cancelledPredictions.length > 0 ? (
            <div className="lg:col-span-3 lg:order-7">
              <div className="bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ❌ Le tue Prediction cancellate
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {cancelledPredictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      onClick={() => handlePredictionClick(prediction.slug, prediction.id)}
                      className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer ${
                        navigatingTo === prediction.id
                          ? 'bg-primary/10 dark:bg-primary/20 border-primary/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {navigatingTo === prediction.id ? (
                        <div className="flex items-center justify-center flex-1 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
                            <span className="text-sm text-primary dark:text-primary-400 font-medium">
                              Caricamento...
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {prediction.image_url && (
                            <img
                              src={prediction.image_url}
                              alt={prediction.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {prediction.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {prediction.category}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
