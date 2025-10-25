import { useState, useEffect } from 'react';
import { getRecentBetsFromContract, getPoolStatsFromContract } from '../lib/contracts';

export interface ContractBet {
  userAddress: string;
  amount: string;
  choice: boolean;
  timestamp: string;
  claimed: boolean;
}

export interface ContractStats {
  totalYes: string;
  totalNo: string;
  totalBets: string;
  bettorCount: number;
  isClosed: boolean;
  winnerSet: boolean;
  winner: boolean;
}

export const useContractData = (poolAddress: string | null, disablePolling: boolean = false) => {
  const [recentBets, setRecentBets] = useState<ContractBet[]>([]);
  const [poolStats, setPoolStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContractData = async () => {
    if (!poolAddress) return;

    try {
      setLoading(true);
      setError(null);

      // Carica scommesse e statistiche in parallelo
      const [bets, stats] = await Promise.all([
        getRecentBetsFromContract(poolAddress, 5),
        getPoolStatsFromContract(poolAddress)
      ]);

      setRecentBets(bets);
      setPoolStats(stats);
    } catch (err) {
      console.error('Error loading contract data:', err);
      setError('Errore nel caricamento dei dati dal contratto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractData();
    
    // Polling ogni 5 minuti per aggiornamenti real-time (ridotto per meno refresh)
    // Disabilita il polling se richiesto (es. durante interazione utente)
    if (disablePolling) return;
    
    const interval = setInterval(loadContractData, 300000); // 5 minuti
    
    return () => clearInterval(interval);
  }, [poolAddress, disablePolling]);

  return {
    recentBets,
    poolStats,
    loading,
    error,
    refetch: loadContractData
  };
};
