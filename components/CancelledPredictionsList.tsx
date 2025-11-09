"use client";
import { useState, useEffect, useRef } from 'react';
import LazyPredictionCard from './LazyPredictionCard';
import { supabase } from '../lib/supabase';
// Il contratto viene usato solo per lo status della pool, non per i conteggi
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

export default function CancelledPredictionsList() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]); // Tutte le predictions per paginazione
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 4;
  const isMobile = useIsMobile();
  
  // Refs per gestione swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50; // Distanza minima per considerare uno swipe

  useEffect(() => {
    loadPredictions();
  }, []);

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

      const { data, error: queryError } = await supabase
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
        .eq('status', 'cancellata')
        .order('created_at', { ascending: false })
        .limit(20); // Limite più alto per supportare più pagine

      if (queryError) throw queryError;

      // Calcola percentuali, volumi in BNB e numero totale di bets per ogni prediction cancellata
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
            total_bets: totalBnbAmount,
            total_predictions: total
          };
        })
      );

      // Salva tutte le predictions per la paginazione
      setAllPredictions(predictionsWithPercentages);
      setPredictions(predictionsWithPercentages.slice(0, itemsPerPage));
      setCurrentPage(0); // Reset alla prima pagina
    } catch (error) {
      console.error('Error loading cancelled predictions:', error);
      setError('Errore nel caricamento delle predictions cancellate');
    } finally {
      setLoading(false);
    }
  };

  const formatClosingDate = (dateString: string, status?: string) => {
    return getClosingDateText(dateString, status);
  };

  if (loading) {
    return null; // Non mostra niente durante il loading
  }

  if (error) {
    return null; // Non mostra niente in caso di errore
  }

  if (allPredictions.length === 0) {
    return null; // Non mostra la sezione se non ci sono prediction cancellate
  }

  // Determina il limite per pagina: 2 su mobile, altrimenti itemsPerPage
  const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
  const visiblePredictions = allPredictions.slice(currentPage * itemsPerPageForCategory, (currentPage + 1) * itemsPerPageForCategory);
  const hasMorePages = allPredictions.length > (currentPage + 1) * itemsPerPageForCategory;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Prediction cancellate
        </p>
      </div>

      <div className="relative">
        {/* Freccia sinistra */}
        {(() => {
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
          {visiblePredictions.map((prediction) => (
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
          ))}
        </div>

        {/* Freccia destra */}
        {(() => {
          const shouldShowPagination = allPredictions.length > itemsPerPageForCategory;
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

