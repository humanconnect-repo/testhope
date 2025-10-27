import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CancelledPrediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  amount_bnb: number;
  position: string;
  created_at: string;
}

export function useUserCancelledPredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<CancelledPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const fetchCancelledPredictions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni le scommesse dell'utente con le prediction cancellate
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select(`
            prediction_id,
            amount_bnb,
            position,
            created_at,
            predictions!inner(
              id,
              title,
              slug,
              category,
              closing_date,
              status
            )
          `)
          .eq('user_id', userId)
          .eq('predictions.status', 'cancellata')
          .order('created_at', { ascending: false });

        if (betsError) {
          throw betsError;
        }

        if (!bets || bets.length === 0) {
          setPredictions([]);
        } else {
          // Trasforma i dati per la UI
          const cancelledPredictions: CancelledPrediction[] = bets.map((bet: any) => ({
            id: bet.predictions.id,
            title: bet.predictions.title,
            slug: bet.predictions.slug,
            category: bet.predictions.category,
            closing_date: bet.predictions.closing_date,
            amount_bnb: bet.amount_bnb,
            position: bet.position,
            created_at: bet.created_at
          }));
          
          setPredictions(cancelledPredictions);
        }

      } catch (error) {
        console.error('Errore nel caricamento delle prediction cancellate:', error);
        setError('Errore nel caricamento delle prediction');
      } finally {
        setLoading(false);
      }
    };

    fetchCancelledPredictions();
  }, [userId]);

  return { predictions, loading, error };
}

