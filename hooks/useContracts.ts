import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { supabase } from '../lib/supabase';
import { 
  isFactoryOwner as checkIsFactoryOwner, 
  listPools, 
  getPoolSummary, 
  createPool, 
  closePool,
  reopenPool,
  resolvePool,
  setEmergencyStop,
  emergencyResolve,
  isBettingCurrentlyOpen,
  getEmergencyStopStatus,
  cancelPool,
  recoverCancelledPoolFunds,
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
  const { isConnected, user, address } = useWeb3Auth();
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
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const poolAddresses = await listPools();
      
      // Carica le predictions dal database per popolare i dati
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .in('status', ['attiva', 'in_pausa', 'risolta', 'cancellata']);
      
      if (predictionsError) {
        console.error('❌ Errore caricamento predictions:', predictionsError);
        setError('Errore caricamento predictions');
        return;
      }

      // Calcola il numero di bet per ogni prediction
      const predictionsWithBetCount = await Promise.all(
        (predictions || []).map(async (prediction: any) => {
          const { count: betCount } = await supabase
            .from('bets')
            .select('*', { count: 'exact', head: true })
            .eq('prediction_id', prediction.id);
          
          return {
            ...prediction,
            bettorCount: betCount || 0
          };
        })
      );
      
      
      // Crea le pool summary usando i dati del database
      const poolSummaries = poolAddresses.map(address => {
        // Trova la prediction corrispondente
        const prediction = predictionsWithBetCount?.find((p: any) => p.pool_address === address);
        
        if (!prediction) {
          return null;
        }
        
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
          bettorCount: prediction.bettorCount || 0, // Usa il valore calcolato dal database
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

  // Riapre una pool chiusa
  const handleReopenPool = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await reopenPool(poolAddress);
      
      // Ricarica i pool dopo la riapertura
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore riapertura pool:', err);
      setError('Errore riapertura pool');
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
      
      // Recupera la prediction dal database e aggiorna lo status
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        // Salva il log della transazione admin usando RPC function con verifica admin
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'set_winner',
          tx_hash_param: txHash,
          admin_address_param: address || '',
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: { winner: winnerYes }
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "Risolta"
        const { data: rpcData, error: updateError } = await supabase
          .rpc('update_prediction_status', {
            prediction_id_param: predictionData.id,
            new_status: 'risolta'
          });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "Risolta"', rpcData);
        }
      }
      
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

  // Recover remaining funds from cancelled or resolved pool
  const recoverPoolFunds = async (poolAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await recoverCancelledPoolFunds(poolAddress);
      
      // Ricarica i pool dopo il recupero
      await loadPools();
      
      return txHash;
    } catch (err) {
      console.error('Errore recupero fondi:', err);
      setError('Errore recupero fondi');
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
    handleReopenPool,
    resolvePrediction,
    stopBetting,
    resumeBetting,
    emergencyResolvePrediction,
    cancelPoolPrediction,
    recoverPoolFunds,
    claimRefundForPool,
    loadPools,
    formatItalianTime,
    isBettingOpen,
    isPredictionEnded
  };
};
