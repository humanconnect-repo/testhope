import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUserTotalBnb(userId: string | null) {
  const [totalBnb, setTotalBnb] = useState<number>(0);
  const [totalBets, setTotalBets] = useState<number>(0);
  const [bnbGained, setBnbGained] = useState<number>(0);
  const [bnbLost, setBnbLost] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [totalWins, setTotalWins] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTotalBnb(0);
      setTotalBets(0);
      setBnbGained(0);
      setBnbLost(0);
      setNetBalance(0);
      setTotalWins(0);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Leggi direttamente da profiles (molto più veloce!)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('total_bnb_bets, total_bnb_earned, total_bets, total_wins')
          .eq('id', userId)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          setTotalBnb(0);
          setTotalBets(0);
          setBnbGained(0);
          setBnbLost(0);
          setNetBalance(0);
          setTotalWins(0);
        } else {
          // Volumi effettuati totali da profiles
          const totalBnbBets = Number(profile.total_bnb_bets) || 0;
          setTotalBnb(totalBnbBets);
          
          // Numero totale di scommesse da profiles
          setTotalBets(Number(profile.total_bets) || 0);

          // BNB guadagnati da profiles
          const totalBnbEarned = Number(profile.total_bnb_earned) || 0;
          setBnbGained(totalBnbEarned);

          // BNB persi = volumi effettuati - guadagnati (quando guadagnati < volumi)
          // Questo rappresenta le scommesse perse (volumi totali - vincite = perdite)
          const lost = totalBnbBets > totalBnbEarned ? totalBnbBets - totalBnbEarned : 0;
          setBnbLost(lost);

          // Bilancio netto = guadagnati - volumi effettuati
          // (positivo se in guadagno, negativo se in perdita)
          // Equivale a: guadagnati - (guadagnati + persi) = -persi quando in perdita
          // Oppure: guadagnati - volumi quando guadagnati > volumi (impossibile, ma per sicurezza)
          const balance = totalBnbEarned - totalBnbBets;
          setNetBalance(balance);

          // Prediction vinte da profiles
          setTotalWins(Number(profile.total_wins) || 0);
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

  return { totalBnb, totalBets, bnbGained, bnbLost, netBalance, totalWins, loading, error };
}
