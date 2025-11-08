"use client";
import { useState, useEffect } from 'react';
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
  winnerSet?: boolean; // Indica se è risolta dal contratto
}

export default function ResolvedPredictionsList() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]); // Tutte le predictions per paginazione
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Stato per categoria selezionata
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 8;
  const isMobile = useIsMobile();

  // Categorie disponibili
  const categories = [
    { name: "Tutte", value: "all" },
    { name: "Crypto", value: "Crypto" },
    { name: "Politica", value: "Politica" },
    { name: "Degen", value: "Degen" },
    { name: "Sport", value: "Sport" },
  ];

  useEffect(() => {
    loadPredictions();
  }, []);

  // Reset pagina quando cambia categoria
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prima carica dal DB le prediction con status 'risolta' come fallback
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
        .eq('status', 'risolta')
        .order('created_at', { ascending: false })
        .limit(100); // Limite più alto per supportare più pagine

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      // Verifica dal contratto se winnerSet è true per ogni prediction
      const predictionsWithContractCheck = await Promise.all(
        (data || []).map(async (prediction: any) => {
          let winnerSet = false;

          // Se c'è un pool_address, verifica dal contratto
          if (prediction.pool_address) {
            try {
              const winnerInfo = await getPoolWinner(prediction.pool_address);
              if (winnerInfo && winnerInfo.winnerSet) {
                winnerSet = true;
              }
              // Se winnerSet è false nel contratto, non usare fallback DB
              // (la prediction potrebbe essere nel DB come risolta ma non ancora risolta nel contratto)
            } catch (error) {
              // Se errore nel leggere dal contratto, usa fallback DB
              console.warn(`Errore lettura contratto per ${prediction.pool_address}:`, error);
              // Usa fallback DB: se status è 'risolta', considera risolta
              winnerSet = true;
            }
          } else {
            // Senza pool_address, usa solo fallback DB
            // Se lo status è 'risolta' nel DB, considerala risolta
            winnerSet = true;
          }

          return {
            ...prediction,
            winnerSet
          };
        })
      );

      // Filtra solo quelle che hanno winnerSet true (verificato dal contratto o fallback DB)
      const resolvedPredictions = predictionsWithContractCheck.filter(
        (prediction) => prediction.winnerSet === true
      );

      // Calcola le percentuali e il volume BNB per ogni prediction risolta
      const predictionsWithPercentages = await Promise.all(
        resolvedPredictions.map(async (prediction: any) => {
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
            total_predictions: total // Totale numero di predictions (bets)
          };
        })
      );

      // Salva tutte le predictions per la paginazione
      setAllPredictions(predictionsWithPercentages);
      setPredictions(predictionsWithPercentages.slice(0, itemsPerPage));
      setCurrentPage(0); // Reset alla prima pagina
    } catch (error) {
      console.error('Error loading resolved predictions:', error);
      setError('Errore nel caricamento delle predictions risolte');
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
    return null; // Non mostra la sezione se non ci sono prediction risolte
  }

  // Filtra le predictions in base alla categoria selezionata
  const filteredPredictions = selectedCategory === 'all' 
    ? allPredictions 
    : allPredictions.filter(p => p.category === selectedCategory);

  // Ottieni il nome della categoria selezionata
  const selectedCategoryName = categories.find(c => c.value === selectedCategory)?.name || selectedCategory;

  // Determina il limite per pagina: 2 su mobile, altrimenti itemsPerPage
  const itemsPerPageForCategory = isMobile ? 2 : itemsPerPage;
  const visiblePredictions = filteredPredictions.slice(currentPage * itemsPerPageForCategory, (currentPage + 1) * itemsPerPageForCategory);
  const hasMorePages = filteredPredictions.length > (currentPage + 1) * itemsPerPageForCategory;

  return (
    <div className="space-y-6 mt-12">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Prediction risolte
        </p>
      </div>

      {/* Barra categorie */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-4 sm:flex sm:space-x-1 sm:bg-gray-100 sm:dark:bg-gray-800 sm:p-1 sm:rounded-lg gap-1">
          {/* Mobile: prima riga con 4 categorie */}
          <div className="col-span-4 sm:hidden grid grid-cols-4 gap-1">
            {categories.slice(0, 4).map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  selectedCategory === category.value
                    ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Mobile: seconda riga per "Sport" */}
          <div className="col-span-4 sm:hidden flex justify-center gap-1 mt-1">
            {categories.slice(4).map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  selectedCategory === category.value
                    ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Desktop: layout orizzontale */}
          <div className="hidden sm:contents">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.value
                    ? "bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messaggio se non ci sono prediction per la categoria selezionata */}
      {filteredPredictions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory === 'all' 
              ? 'Nessuna prediction risolta' 
              : `Nessuna prediction risolta per ${selectedCategoryName}`}
          </p>
        </div>
      ) : (
        <div className="relative">
        {/* Freccia sinistra */}
        {(() => {
          const shouldShowPagination = filteredPredictions.length > itemsPerPageForCategory;
          return shouldShowPagination && currentPage > 0 && (
            <button
              onClick={() => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          const shouldShowPagination = filteredPredictions.length > itemsPerPageForCategory;
          return shouldShowPagination && hasMorePages && (
            <button
              onClick={() => {
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
      )}
    </div>
  );
}

