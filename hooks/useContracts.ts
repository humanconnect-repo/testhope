import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { 
  isFactoryOwner as checkIsFactoryOwner, 
  listPools, 
  getPoolSummary, 
  createPool, 
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
    if (!isFactoryOwner) return;

    try {
      setLoading(true);
      setError(null);
      const poolAddresses = await listPools();
      const poolSummaries = await Promise.all(
        poolAddresses.map(async (address) => {
          try {
            return await getPoolSummary(address);
          } catch (err) {
            console.error(`Errore caricamento pool ${address}:`, err);
            return null;
          }
        })
      );
      
      setPools(poolSummaries.filter(Boolean) as PoolSummary[]);
    } catch (err) {
      console.error('Errore caricamento pools:', err);
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
