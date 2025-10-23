"use client";
import { useState, useEffect } from 'react';
import PredictionCard from './PredictionCard';
import { supabase } from '@/lib/supabase';
import { formatItalianDateShort, getClosingDateText } from '@/lib/dateUtils';

interface Prediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata';
  yes_percentage: number;
  no_percentage: number;
  total_bets: number;
}

interface PredictionListProps {
  selectedCategory: string;
}

export default function PredictionList({ selectedCategory }: PredictionListProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, [selectedCategory]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      let predictionsData: any[] = [];
      let limit = 15; // Default per "Novità"

      if (selectedCategory === 'trending') {
        // Trending: top 5 con maggiori puntate
        limit = 5;
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Calcola le percentuali e ordina per total_bets
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            const { data: betStats } = await supabase
              .rpc('get_prediction_percentages', { prediction_uuid: prediction.id });

            const stats = betStats?.[0] || { yes_percentage: 0, no_percentage: 0, total_bets: 0, total_amount_bnb: 0 };

            return {
              ...prediction,
              yes_percentage: stats.yes_percentage || 0,
              no_percentage: stats.no_percentage || 0,
              total_bets: stats.total_amount_bnb || 0
            };
          })
        );

        // Ordina per total_bets (trending) e filtra solo quelle con puntate
        predictionsData = predictionsWithPercentages
          .filter(prediction => prediction.total_bets > 0) // Solo prediction con puntate
          .sort((a, b) => b.total_bets - a.total_bets)
          .slice(0, limit);

      } else if (selectedCategory === 'all') {
        // Novità: ultime 15 prediction
        limit = 15;
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Calcola le percentuali per ogni prediction
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            const { data: betStats } = await supabase
              .rpc('get_prediction_percentages', { prediction_uuid: prediction.id });

            const stats = betStats?.[0] || { yes_percentage: 0, no_percentage: 0, total_bets: 0, total_amount_bnb: 0 };

            return {
              ...prediction,
              yes_percentage: stats.yes_percentage || 0,
              no_percentage: stats.no_percentage || 0,
              total_bets: stats.total_amount_bnb || 0
            };
          })
        );

        predictionsData = predictionsWithPercentages;

      } else {
        // Categoria specifica: tutte le prediction di quella categoria
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa'])
          .eq('category', selectedCategory)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Calcola le percentuali per ogni prediction
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            const { data: betStats } = await supabase
              .rpc('get_prediction_percentages', { prediction_uuid: prediction.id });

            const stats = betStats?.[0] || { yes_percentage: 0, no_percentage: 0, total_bets: 0, total_amount_bnb: 0 };

            return {
              ...prediction,
              yes_percentage: stats.yes_percentage || 0,
              no_percentage: stats.no_percentage || 0,
              total_bets: stats.total_amount_bnb || 0
            };
          })
        );

        predictionsData = predictionsWithPercentages;
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Predictions in corso...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Caricamento delle prediction...
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Predictions in corso...
          </h2>
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
        return 'Le ultime Predicitons listate';
      case 'trending':
        return 'Le Predicitons più popolari con il maggior numero di scommesse';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {predictions.map((prediction) => (
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
          />
        ))}
      </div>
    </div>
  );
}
