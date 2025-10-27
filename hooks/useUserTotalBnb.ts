import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUserTotalBnb(userId: string | null) {
  const [totalBnb, setTotalBnb] = useState<number>(0);
  const [totalBets, setTotalBets] = useState<number>(0);
  const [bnbGained, setBnbGained] = useState<number>(0);
  const [bnbLost, setBnbLost] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTotalBnb(0);
      setTotalBets(0);
      setBnbGained(0);
      setBnbLost(0);
      setNetBalance(0);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ottieni tutte le scommesse dell'utente con i dati delle predictions
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select(`
            amount_bnb,
            winning_rewards_amount,
            prediction:prediction_id (
              id,
              status,
              pool_address
            )
          `)
          .eq('user_id', userId);

        if (betsError) {
          throw betsError;
        }

        if (!bets || bets.length === 0) {
          setTotalBnb(0);
          setTotalBets(0);
          setBnbGained(0);
          setBnbLost(0);
          setNetBalance(0);
        } else {
          // Somma tutti i BNB scommessi
          const total = bets.reduce((sum: number, bet: any) => {
            return sum + (bet.amount_bnb || 0);
          }, 0);
          setTotalBnb(total);
          
          // Conta il numero totale di scommesse
          setTotalBets(bets.length);

          // Calcola BNB guadagnati (somma di winning_rewards_amount dove presente)
          const gained = bets.reduce((sum: number, bet: any) => {
            return sum + (bet.winning_rewards_amount || 0);
          }, 0);
          setBnbGained(gained);

          // Calcola BNB persi: per le pool risolte dove winning_rewards_amount è NULL
          const lost = bets.reduce((sum: number, bet: any) => {
            // Se la prediction è risolta e non ha winning_rewards_amount, significa che ha perso
            if (bet.prediction?.status === 'risolta' && !bet.winning_rewards_amount) {
              return sum + (bet.amount_bnb || 0);
            }
            return sum;
          }, 0);
          setBnbLost(lost);

          // Bilancio netto = guadagnati - persi
          setNetBalance(gained - lost);
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

  return { totalBnb, totalBets, bnbGained, bnbLost, netBalance, loading, error };
}
