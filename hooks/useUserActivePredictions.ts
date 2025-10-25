import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ActivePrediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  amount_bnb: number;
  position: string;
  created_at: string;
}

export function useUserActivePredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<ActivePrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const fetchActivePredictions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni le scommesse dell'utente con le prediction attive
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
          .eq('predictions.status', 'attiva')
          .order('created_at', { ascending: false });

        if (betsError) {
          throw betsError;
        }

        if (!bets || bets.length === 0) {
          setPredictions([]);
        } else {
          // Trasforma i dati per la UI
          const activePredictions: ActivePrediction[] = bets.map((bet: any) => ({
            id: bet.predictions.id,
            title: bet.predictions.title,
            slug: bet.predictions.slug,
            category: bet.predictions.category,
            closing_date: bet.predictions.closing_date,
            amount_bnb: bet.amount_bnb,
            position: bet.position,
            created_at: bet.created_at
          }));
          
          setPredictions(activePredictions);
        }

      } catch (error) {
        console.error('Errore nel caricamento delle prediction attive:', error);
        setError('Errore nel caricamento delle prediction');
      } finally {
        setLoading(false);
      }
    };

    fetchActivePredictions();
  }, [userId]);

  return { predictions, loading, error };
}
