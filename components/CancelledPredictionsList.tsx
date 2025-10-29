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
  total_predictions?: number;
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
          Prediction cancellate
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
            totalPredictions={prediction.total_predictions || 0}
          />
        ))}
      </div>
    </div>
  );
}

