"use client";
import { useState, useEffect, useRef } from 'react';
import LazyPredictionCard from './LazyPredictionCard';
import { supabase } from '../lib/supabase';
import { getPoolWinner } from '../lib/contracts';
import { formatItalianDateShort, getClosingDateText } from '../lib/dateUtils';

// Hook per rilevare se siamo su mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint di Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Cache per conteggi bets e volumi (TTL 5 minuti)
interface CachedBetsData {
  total: number;
  yesCount: number;
  noCount: number;
  totalBnbAmount: number;
  timestamp: number;
}

const betsDataCache = new Map<string, CachedBetsData>();
const BETS_CACHE_DURATION = 5 * 60 * 1000; // 5 minuti in millisecondi

// Helper function per ottenere totalBets e volumi dal database (primario) con cache
// Il contratto viene usato solo per lo status della pool, non per i conteggi
async function getTotalBetsFromContractOrDb(prediction: any): Promise<{ total: number; yesCount: number; noCount: number; totalBnbAmount: number }> {
  // Controlla cache
  const cached = betsDataCache.get(prediction.id);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < BETS_CACHE_DURATION) {
    // Restituisci dati dalla cache
    return {
      total: cached.total,
      yesCount: cached.yesCount,
      noCount: cached.noCount,
      totalBnbAmount: cached.totalBnbAmount
    };
  }

  // Usa sempre il database come fonte primaria per i conteggi
  const { count: totalBets } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('prediction_id', prediction.id);
  
  const { count: yesBets } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('prediction_id', prediction.id)
    .eq('position', 'yes');
  
  const { count: noBets } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('prediction_id', prediction.id)
    .eq('position', 'no');

  // Calcola anche i volumi (amount_bnb)
  const { data: betAmounts } = await supabase
    .from('bets')
    .select('amount_bnb')
    .eq('prediction_id', prediction.id);
  
  const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

  const total = totalBets || 0;
  const yesCount = yesBets || 0;
  const noCount = noBets || 0;

  // Salva in cache
  betsDataCache.set(prediction.id, {
    total,
    yesCount,
    noCount,
    totalBnbAmount,
    timestamp: now
  });

  // Pulisci cache vecchia (ogni 100 chiamate per performance)
  if (betsDataCache.size > 100) {
    for (const [key, value] of betsDataCache.entries()) {
      if (now - value.timestamp > BETS_CACHE_DURATION) {
        betsDataCache.delete(key);
      }
    }
  }

  return { total, yesCount, noCount, totalBnbAmount };
}

interface Prediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta';
  image_url?: string;
  pool_address?: string;
  yes_percentage: number;
  no_percentage: number;
  total_bets: number;
  total_predictions?: number;
}

interface PredictionListProps {
  selectedCategory: string;
  searchQuery: string;
}

export default function PredictionList({ selectedCategory, searchQuery }: PredictionListProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]); // Tutte le predictions per paginazione
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 8;
  const isMobile = useIsMobile();
  
  // Refs per gestione swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50; // Distanza minima per considerare uno swipe

  useEffect(() => {
    loadPredictions();
    setCurrentPage(0); // Reset pagina quando cambia categoria o ricerca
  }, [selectedCategory, searchQuery]);

  // Salva posizione scroll prima del cambio pagina e ripristinala dopo
  useEffect(() => {
    if (!isMobile) return;
    
    // Salva la posizione corrente dello scroll
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    
    // Ripristina la posizione dopo che il DOM si è aggiornato
    const timer = setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant' as ScrollBehavior
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [currentPage, isMobile]);

  // Handler per swipe su mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    if (!touchStartRef.current || !touchEndRef.current) return;

    const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
    const shouldShowPagination = allPredictions.length > itemsPerPageForCategory;
    if (!shouldShowPagination) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Ignora swipe verticali (per permettere scroll normale)
    if (isVerticalSwipe) return;

    if (isLeftSwipe) {
      // Swipe sinistra: vai alla pagina successiva
      const hasMorePages = allPredictions.length > (currentPage + 1) * itemsPerPageForCategory;
      if (hasMorePages) {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        setCurrentPage(prev => prev + 1);
      }
    } else if (isRightSwipe) {
      // Swipe destra: vai alla pagina precedente
      if (currentPage > 0) {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        setCurrentPage(prev => prev - 1);
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      let predictionsData: any[] = [];
      let limit = 15; // Default per "Novità"

      // Se c'è una query di ricerca, filtra per titolo
      const hasSearchQuery = searchQuery.trim().length > 0;

      if (selectedCategory === 'trending') {
        // Trending: carica più predictions per supportare paginazione
        limit = 50;
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa']);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Ottieni totalBets e volumi dal database (con cache)
            const { total, yesCount, noCount, totalBnbAmount } = await getTotalBetsFromContractOrDb(prediction);
            
            // Calcola le percentuali con un solo decimale
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte e in pausa dal contratto anche se hanno status diverso nel DB
        const filteredTrending = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            // Escludi sempre quelle con status 'in_pausa'
            if (prediction.status === 'in_pausa') {
              return null;
            }
            
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        
        // Ordina per total_predictions (trending) e filtra solo quelle con puntate
        const allTrending = filteredTrending
          .filter((p: any) => p !== null && p.total_predictions > 0) // Solo prediction con puntate e non risolte
          .sort((a, b) => b.total_predictions - a.total_predictions);
        // Salva tutte le predictions per la paginazione
        setAllPredictions(allTrending);
        // Mostra solo le prime 8
        predictionsData = allTrending.slice(0, itemsPerPage);

      } else if (selectedCategory === 'all') {
        // Novità: carica fino a 50 prediction per permettere paginazione (6 pagine da 8)
        limit = 50;
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa', 'in_pausa'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Ottieni totalBets e volumi dal database (con cache)
            const { total, yesCount, noCount, totalBnbAmount } = await getTotalBetsFromContractOrDb(prediction);
            
            // Calcola le percentuali con un solo decimale
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte dal contratto anche se hanno status diverso nel DB
        const filteredPredictions = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        const allFiltered = filteredPredictions.filter((p: any) => p !== null);
        // Salva tutte le predictions per la paginazione
        setAllPredictions(allFiltered);
        // Mostra solo le prime 8
        predictionsData = allFiltered.slice(0, itemsPerPage);

      } else if (selectedCategory === 'closing_soon') {
        // In scadenza: tutte le prediction ATTIVE ordinate per data di chiusura (DB)
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .eq('status', 'attiva')
          .order('closing_date', { ascending: true });

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Ottieni totalBets e volumi dal database (con cache)
            const { total, yesCount, noCount, totalBnbAmount } = await getTotalBetsFromContractOrDb(prediction);
            
            // Calcola le percentuali con un solo decimale
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte dal contratto anche se hanno status diverso nel DB
        const filteredClosing = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        const allClosing = filteredClosing.filter((p: any) => p !== null);
        // Salva tutte le predictions per la paginazione
        setAllPredictions(allClosing);
        // Mostra solo le prime 8
        predictionsData = allClosing.slice(0, itemsPerPage);

      } else {
        // Categoria specifica: tutte le prediction di quella categoria
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          // Per le categorie NON includiamo le risolte (hanno sezione dedicata)
          .in('status', ['attiva', 'in_attesa', 'in_pausa'])
          .eq('category', selectedCategory);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Ottieni totalBets e volumi dal database (con cache)
            const { total, yesCount, noCount, totalBnbAmount } = await getTotalBetsFromContractOrDb(prediction);
            
            // Calcola le percentuali con un solo decimale
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte - hanno sezione dedicata
        const filteredCategory = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        
        // ORDINA PER PREDICTIONS TOTALI (numero di bet)
        const allCategory = filteredCategory
          .filter((p: any) => p !== null)
          .sort((a, b) => b.total_predictions - a.total_predictions);
        // Salva tutte le predictions per la paginazione
        setAllPredictions(allCategory);
        // Mostra solo le prime 8
        predictionsData = allCategory.slice(0, itemsPerPage);
      }

      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error loading predictions:', error);
      setError('Errore nel caricamento delle prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatClosingDate = (dateString: string, status?: string) => {
    return getClosingDateText(dateString, status);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Caricamento...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={loadPredictions}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    const getEmptyMessage = () => {
      // Se c'è una ricerca attiva
      if (searchQuery.trim()) {
        return {
          title: '🔍 Nessun risultato trovato',
          description: `Non ci sono prediction che contengono "${searchQuery.trim()}"`
        };
      }
      
      if (selectedCategory === 'trending') {
        return {
          title: null, // Nessun titolo per Trending
          description: 'Non ci sono ancora Predicitons con scommesse. Sii il primo a scommettere!'
        };
      } else if (selectedCategory === 'all') {
        return {
          title: null, // Nessun titolo per Novità
          description: 'Non ci sono Predicitons attive al momento'
        };
      } else if (selectedCategory === 'closing_soon') {
        return {
          title: null,
          description: 'Nessuna prediction in scadenza'
        };
      } else {
        return {
          title: null, // Nessun titolo per le categorie
          description: `Non ci sono Predicitons attive nella categoria ${selectedCategory}`
        };
      }
    };

    const emptyMessage = getEmptyMessage();

    return (
      <div className="space-y-6">
        <div className="text-center">
          {emptyMessage.title && (
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {emptyMessage.title}
            </h2>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            {emptyMessage.description}
          </p>
        </div>
      </div>
    );
  }

  const getSectionTitle = () => {
    // Nessun titolo per tutte le categorie
    return null;
  };

  const getSectionDescription = () => {
    switch (selectedCategory) {
      case 'all':
        return 'Prediction in corso';
      case 'trending':
        return 'Le Predicitons più popolari con il maggior numero di scommesse';
      case 'closing_soon':
        return 'Predictions in scadenza';
      default:
        return `Tutte le Predicitons della categoria ${selectedCategory}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        {getSectionTitle() && (
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getSectionTitle()}
          </h2>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          {getSectionDescription()}
        </p>
      </div>

      <div className="relative">
        {/* Freccia sinistra (per tutte le sezioni con paginazione) */}
        {(() => {
          // Su mobile, mostra le frecce se ci sono più di 2 prediction per tutte le categorie
          const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
          const shouldShowPagination = allPredictions.length > itemsPerPageForCategory;
          
          return shouldShowPagination && currentPage > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isMobile) {
                  scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                }
                setCurrentPage(prev => prev - 1);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Pagina precedente"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          );
        })()}

        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(() => {
            // Determina il limite per pagina: 2 su mobile per tutte le categorie, altrimenti itemsPerPage
            const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
            
            // Prepara l'array delle prediction da mostrare
            let predictionsToShow = (allPredictions.length > 0 && allPredictions.length > itemsPerPageForCategory) 
              ? allPredictions.slice(currentPage * itemsPerPageForCategory, (currentPage + 1) * itemsPerPageForCategory)
              : (allPredictions.length > 0 ? allPredictions : predictions);
            
            return predictionsToShow.map((prediction) => (
              <LazyPredictionCard
                key={prediction.id}
                id={prediction.slug}
                title={prediction.title}
                closingDate={formatClosingDate(prediction.closing_date, prediction.status)}
                yesPercentage={prediction.yes_percentage}
                noPercentage={prediction.no_percentage}
                category={prediction.category}
                status={prediction.status}
                totalBets={prediction.total_bets || 0}
                imageUrl={prediction.image_url}
                poolAddress={prediction.pool_address}
                totalPredictions={prediction.total_predictions || 0}
              />
            ));
          })()}
        </div>

        {/* Freccia destra (per tutte le sezioni con paginazione) */}
        {(() => {
          // Su mobile, mostra le frecce se ci sono più di 2 prediction per tutte le categorie
          const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
          const shouldShowPagination = allPredictions.length > itemsPerPageForCategory;
          const hasMorePages = allPredictions.length > (currentPage + 1) * itemsPerPageForCategory;
          
          return shouldShowPagination && hasMorePages && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isMobile) {
                  scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                }
                setCurrentPage(prev => prev + 1);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Pagina successiva"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })()}
      </div>
    </div>
  );
}
