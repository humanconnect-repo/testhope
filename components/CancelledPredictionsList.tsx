"use client";
import { useState, useEffect } from 'react';
import PredictionCard from './PredictionCard';
import { supabase } from '../lib/supabase';
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

  useEffect(() => {
    loadPredictions();
  }, []);

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
          // Conta le bets totali, yes e no
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

          const total = totalBets || 0;
          const yesCount = yesBets || 0;
          const noCount = noBets || 0;

          const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
          const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

          // Somma importi BNB per i volumi
          const { data: betAmounts } = await supabase
            .from('bets')
            .select('amount_bnb')
            .eq('prediction_id', prediction.id);

          const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

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
            <PredictionCard
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
    </div>
  );
}

