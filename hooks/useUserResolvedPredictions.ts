import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ResolvedPrediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  amount_bnb: number;
  position: string;
  created_at: string;
  claim_winning_tx_hash?: string;
  winning_rewards_amount?: number;
}

export function useUserResolvedPredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<ResolvedPrediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const fetchResolvedPredictions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni le scommesse dell'utente con le prediction risolte
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select(`
            prediction_id,
            amount_bnb,
            position,
            created_at,
            claim_winning_tx_hash,
            winning_rewards_amount,
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
          .eq('predictions.status', 'risolta')
          .order('created_at', { ascending: false });

        if (betsError) {
          throw betsError;
        }

        if (!bets || bets.length === 0) {
          setPredictions([]);
        } else {
          // Trasforma i dati per la UI
          const resolvedPredictions: ResolvedPrediction[] = bets.map((bet: any) => ({
            id: bet.predictions.id,
            title: bet.predictions.title,
            slug: bet.predictions.slug,
            category: bet.predictions.category,
            closing_date: bet.predictions.closing_date,
            amount_bnb: bet.amount_bnb,
            position: bet.position,
            created_at: bet.created_at,
            claim_winning_tx_hash: bet.claim_winning_tx_hash,
            winning_rewards_amount: bet.winning_rewards_amount
          }));
          
          setPredictions(resolvedPredictions);
        }

      } catch (error) {
        console.error('Errore nel caricamento delle prediction risolte:', error);
        setError('Errore nel caricamento delle prediction');
      } finally {
        setLoading(false);
      }
    };

    fetchResolvedPredictions();
  }, [userId]);

  return { predictions, loading, error };
}

