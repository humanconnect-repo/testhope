"use client";
import { useState, useEffect } from 'react';
import PredictionCard from './PredictionCard';
import { supabase } from '../lib/supabase';
import { getPoolWinner } from '../lib/contracts';
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
  winnerSet?: boolean; // Indica se è risolta dal contratto
}

export default function ResolvedPredictionsList() {
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
        .limit(50); // Limite più alto per verificare tutte le risolte

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

      // Calcola le percentuali per ogni prediction risolta
      const predictionsWithPercentages = await Promise.all(
        resolvedPredictions.map(async (prediction: any) => {
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

      // Limita a 8 per la visualizzazione
      setPredictions(predictionsWithPercentages.slice(0, 8));
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

  if (predictions.length === 0) {
    return null; // Non mostra la sezione se non ci sono prediction risolte
  }

  return (
    <div className="space-y-6 mt-12">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Prediction risolte
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

