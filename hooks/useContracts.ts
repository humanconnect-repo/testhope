import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { supabase } from '../lib/supabase';
import { 
  isFactoryOwner as checkIsFactoryOwner, 
  listPools, 
  getPoolSummary, 
  createPool, 
  closePool,
  resolvePool,
  setEmergencyStop,
  emergencyResolve,
  isBettingCurrentlyOpen,
  getEmergencyStopStatus,
  cancelPool,
  claimRefund,
  canClaimRefund,
  isPoolCancelled,
  italianToUtcTimestamp,
  formatItalianTime,
  isBettingOpen,
  isPredictionEnded
} from '../lib/contracts';

export interface PoolSummary {
  address: string;
  title: string;
  description: string;
  category: string;
  closingDate: number;
  closingBid: number;
  totalYes: string;
  totalNo: string;
  totalBets: string;
  bettorCount: number;
  isClosed: boolean;
  winnerSet: boolean;
  winner: boolean;
  feeWallet: string;
  feeBps: number;
  feeCalc: string;
  feeSent: boolean;
  winningPot: string;
  losingPot: string;
  feeAmount: string;
  netLosingPot: string;
  totalRedistribution: string;
}

export const useContracts = () => {
  const { isConnected, user } = useWeb3Auth();
  const [isFactoryOwner, setIsFactoryOwner] = useState(false);
  const [pools, setPools] = useState<PoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se l'utente è owner della factory
  const checkFactoryOwnership = async () => {
    if (!isConnected || !user) {
      setIsFactoryOwner(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const isOwner = await checkIsFactoryOwner();
      setIsFactoryOwner(isOwner);
    } catch (err) {
      console.error('Errore verifica ownership:', err);
      setError('Errore verifica ownership factory');
      setIsFactoryOwner(false);
    } finally {
      setLoading(false);
    }
  };

  // Carica tutti i pool
  const loadPools = async () => {
    if (!isFactoryOwner) {
      console.log('❌ Non sei owner della factory, skip caricamento pool');
      return;
    }

    try {
      console.log('🚀 Inizio caricamento pool...');
      setLoading(true);
      setError(null);
      const poolAddresses = await listPools();
      console.log('📋 Indirizzi pool ricevuti:', poolAddresses);
      
      // Carica le predictions dal database per popolare i dati
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .in('status', ['attiva', 'in_pausa']);
      
      if (predictionsError) {
        console.error('❌ Errore caricamento predictions:', predictionsError);
        setError('Errore caricamento predictions');
        return;
      }
      
      console.log('📊 Predictions caricate dal DB:', predictions);
      
      // Crea le pool summary usando i dati del database
      const poolSummaries = poolAddresses.map(address => {
        // Trova la prediction corrispondente
        const prediction = predictions?.find((p: any) => p.pool_address === address);
        
        if (!prediction) {
          console.log('⚠️ Nessuna prediction trovata per pool:', address);
          return null;
        }
        
        console.log('✅ Prediction trovata per pool:', address, prediction.title);
        
        // Crea il pool summary con i dati del database
        return {
          address,
          title: prediction.title,
          description: prediction.description,
          category: prediction.category,
          closingDate: new Date(prediction.closing_date).getTime() / 1000, // Converti in timestamp
          closingBid: new Date(prediction.closing_bid).getTime() / 1000, // Converti in timestamp
          totalYes: "0", // Dal contratto se necessario
          totalNo: "0", // Dal contratto se necessario
          totalBets: "0", // Dal contratto se necessario
          bettorCount: 0,
          isClosed: false,
          winnerSet: false,
          winner: false,
          feeWallet: '',
          feeBps: 0,
          feeCalc: "0",
          feeSent: false,
          winningPot: "0",
          losingPot: "0",
          feeAmount: "0",
          netLosingPot: "0",
          totalRedistribution: "0"
        };
      });
      
      const validPools = poolSummaries.filter(Boolean) as PoolSummary[];
      console.log('✅ Pool caricate con successo:', validPools.length, validPools);
      setPools(validPools);
    } catch (err) {
      console.error('❌ Errore caricamento pools:', err);
      setError('Errore caricamento pools');
    } finally {
      setLoading(false);
    }
  };

  // Crea un nuovo pool
  const createNewPool = async (input: {
    title: string;
    description: string;
    category: string;
    closingDateItalian: string; // formato: '2025-11-15T21:59:00+01:00'
    closingBidItalian: string;  // formato: '2025-12-31T21:59:00+01:00'
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const closingDateUtc = italianToUtcTimestamp(input.closingDateItalian);
      const closingBidUtc = italianToUtcTimestamp(input.closingBidItalian);
      
      const poolAddress = await createPool({
        title: input.title,
        description: input.description,
        category: input.category,
        closingDateUtc,
        closingBidUtc
      });
      
      // Ricarica i pool dopo la creazione
      await loadPools();
      
      return poolAddress;
    } catch (err) {
      console.error('Errore creazione pool:', err);
      setError('Errore creazione pool');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Chiude una pool
  const handleClosePool = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await closePool(poolAddress);
      
      // Ricarica i pool dopo la chiusura
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore chiusura pool:', err);
      setError('Errore chiusura pool');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Risolve una prediction
  const resolvePrediction = async (poolAddress: string, winnerYes: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await resolvePool(poolAddress, winnerYes);
      
      // Ricarica i pool dopo la risoluzione
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore risoluzione prediction:', err);
      setError('Errore risoluzione prediction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Emergency stop betting
  const stopBetting = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await setEmergencyStop(poolAddress, true);
      
      // Ricarica i pool dopo l'operazione
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore stop betting:', err);
      setError('Errore stop betting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resume betting
  const resumeBetting = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await setEmergencyStop(poolAddress, false);
      
      // Ricarica i pool dopo l'operazione
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore resume betting:', err);
      setError('Errore resume betting');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Emergency resolve prediction
  const emergencyResolvePrediction = async (poolAddress: string, winnerYes: boolean, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await emergencyResolve(poolAddress, winnerYes, reason);
      
      // Ricarica i pool dopo la risoluzione
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore emergency resolve:', err);
      setError('Errore emergency resolve');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel pool and allow refunds
  const cancelPoolPrediction = async (poolAddress: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await cancelPool(poolAddress, reason);
      
      // Ricarica i pool dopo la cancellazione
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore cancellazione pool:', err);
      setError('Errore cancellazione pool');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Claim refund for cancelled pool
  const claimRefundForPool = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await claimRefund(poolAddress);
      
      return txHash;
    } catch (err) {
      console.error('Errore claim refund:', err);
      setError('Errore claim refund');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Effetti
  useEffect(() => {
    if (isConnected && user) {
      checkFactoryOwnership();
    } else {
      setIsFactoryOwner(false);
      setPools([]);
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (isFactoryOwner) {
      loadPools();
    }
  }, [isFactoryOwner]);

  return {
    isFactoryOwner,
    pools,
    loading,
    error,
    createNewPool,
    handleClosePool,
    resolvePrediction,
    stopBetting,
    resumeBetting,
    emergencyResolvePrediction,
    cancelPoolPrediction,
    claimRefundForPool,
    loadPools,
    formatItalianTime,
    isBettingOpen,
    isPredictionEnded
  };
};
