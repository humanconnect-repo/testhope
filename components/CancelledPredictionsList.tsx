"use client";
import { useState, useEffect } from 'react';
import PredictionCard from './PredictionCard';
import { supabase } from '../lib/supabase';
import { formatItalianDateShort, getClosingDateText } from '../lib/dateUtils';

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
}

export default function CancelledPredictionsList() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .limit(8);

      if (queryError) throw queryError;

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

      setPredictions(predictionsWithPercentages);
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

  if (predictions.length === 0) {
    return null; // Non mostra la sezione se non ci sono prediction cancellate
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Pool cancellate
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
            imageUrl={prediction.image_url}
            poolAddress={prediction.pool_address}
          />
        ))}
      </div>
    </div>
  );
}

