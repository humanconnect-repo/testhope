import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUserTotalBnb(userId: string | null) {
  const [totalBnb, setTotalBnb] = useState<number>(0);
  const [totalBets, setTotalBets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTotalBnb(0);
      setTotalBets(0);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni tutte le scommesse dell'utente
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select('amount_bnb')
          .eq('user_id', userId);

        if (betsError) {
          throw betsError;
        }

        if (!bets || bets.length === 0) {
          setTotalBnb(0);
          setTotalBets(0);
        } else {
          // Somma tutti i BNB scommessi
          const total = bets.reduce((sum, bet) => {
            return sum + (bet.amount_bnb || 0);
          }, 0);
          setTotalBnb(total);
          
          // Conta il numero totale di scommesse (prediction fatte)
          setTotalBets(bets.length);
        }

      } catch (error) {
        console.error('Errore nel caricamento dei dati utente:', error);
        setError('Errore nel caricamento dei volumi');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return { totalBnb, totalBets, loading, error };
}
