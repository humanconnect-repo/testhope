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
  total_predictions?: number;
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

      // Calcola le percentuali e il volume BNB per ogni prediction risolta
      const predictionsWithPercentages = await Promise.all(
        resolvedPredictions.map(async (prediction: any) => {
          // Conta le bets per Sì e No
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

          // Calcola le percentuali con un solo decimale
          const total = totalBets || 0;
          const yesCount = yesBets || 0;
          const noCount = noBets || 0;
          
          const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
          const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

          // Calcola il totale degli importi BNB per i volumi (come in PredictionList)
          const { data: betAmounts } = await supabase
            .from('bets')
            .select('amount_bnb')
            .eq('prediction_id', prediction.id);
          
          const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

          return {
            ...prediction,
            yes_percentage: yesPercentage,
            no_percentage: noPercentage,
            total_bets: totalBnbAmount, // Totale importi BNB per i volumi
            total_predictions: total // Totale numero di predictions (bets)
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
            totalPredictions={prediction.total_predictions || 0}
          />
        ))}
      </div>
    </div>
  );
}

