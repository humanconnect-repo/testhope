import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { isBettingCurrentlyOpen, getEmergencyStopStatus, isPoolCancelled, isPoolClosed } from '../lib/contracts';

export interface PoolState {
  canBet: boolean;
  canClaimRewards: boolean;
  canClaimRefund: boolean;
  isActive: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  isResolved: boolean;
  statusText: string;
  statusColor: string;
  statusIcon: string;
  refreshContractState?: () => Promise<void>;
  lastUpdate?: number;
  contractLoading?: boolean;
  isRefreshing?: boolean;
}

export const usePoolState = (poolAddress: string, poolData: any) => {
  const { user, isConnected } = useWeb3Auth();
  const [contractBettingOpen, setContractBettingOpen] = useState<boolean | null>(null);
  const [emergencyStop, setEmergencyStop] = useState<boolean | null>(null);
  const [contractCancelled, setContractCancelled] = useState<boolean | null>(null);
  const [contractClosed, setContractClosed] = useState<boolean | null>(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Memoizza i dati critici per evitare re-render inutili
  const memoizedPoolData = useMemo(() => {
    if (!poolData) return null;
    return {
      status: poolData.status,
      closingDate: poolData.closingDate,
      closingBid: poolData.closingBid,
      winnerSet: poolData.winnerSet,
      winner: poolData.winner,
      userBet: poolData.userBet,
      emergencyStop: poolData.emergencyStop
    };
  }, [poolData?.status, poolData?.closingDate, poolData?.closingBid, poolData?.winnerSet, poolData?.winner, poolData?.userBet, poolData?.emergencyStop]);

         // Check sul contratto per stato scommesse con polling silenzioso
         useEffect(() => {
           const checkContractBettingStatus = async (isSilent = false) => {
             if (!poolAddress) {
               setContractLoading(false);
               return;
             }
       
             try {
              if (!isSilent) {
                setContractLoading(true);
              }
              const [isOpen, emergencyStopStatus, cancelledStatus, closedStatus] = await Promise.all([
                isBettingCurrentlyOpen(poolAddress),
                getEmergencyStopStatus(poolAddress),
                isPoolCancelled(poolAddress),
                isPoolClosed(poolAddress)
              ]);
              setContractBettingOpen(isOpen);
              setEmergencyStop(emergencyStopStatus);
              setContractCancelled(cancelledStatus);
              setContractClosed(closedStatus);
              setLastUpdate(Date.now());
             } catch (error) {
               console.warn('❌ usePoolState: Errore check contratto scommesse:', error);
               setContractBettingOpen(null); // Fallback a null se errore
               setEmergencyStop(null);
               setContractCancelled(null);
               setContractClosed(null);
             } finally {
               if (!isSilent) {
                 setContractLoading(false);
               }
             }
           };
       
           // Controlla immediatamente
           checkContractBettingStatus();
           
           // Poi controlla ogni 30 secondi per aggiornamenti silenziosi
           const interval = setInterval(() => {
             checkContractBettingStatus(true); // Silent refresh
           }, 30000);
           
           // Cleanup
           return () => clearInterval(interval);
         }, [poolAddress, isConnected]);

  // Calcola lo stato del pool in modo memoizzato
  const poolState = useMemo(() => {
    if (!poolAddress || !memoizedPoolData) {
      return {
        canBet: false,
        canClaimRewards: false,
        canClaimRefund: false,
        isActive: false,
        isPaused: false,
        isCancelled: false,
        isResolved: false,
        statusText: 'CARICAMENTO',
        statusColor: 'text-gray-600',
        statusIcon: '⏳'
      };
    }

    // Se stiamo ancora caricando il contratto
    if (contractLoading) {
      return {
        canBet: false,
        canClaimRewards: false,
        canClaimRefund: false,
        isActive: false,
        isPaused: false,
        isCancelled: false,
        isResolved: false,
        statusText: 'CARICAMENTO CONTRATTO',
        statusColor: 'text-gray-600',
        statusIcon: '⏳'
      };
    }

    try {
      // Usa i dati dal database per i controlli temporali
      const now = Math.floor(Date.now() / 1000);
      const closingDate = memoizedPoolData.closingDate;
      const closingBid = memoizedPoolData.closingBid;
      
      // Controlla se l'utente può richiedere rimborsi (disabilitato su BSC per problemi ENS)
      const canRefund = false; // Disabilitato su BSC Testnet per evitare errori ENS

      // Controlla se il pool è cancellato (da database o contratto)
      const isCancelled = memoizedPoolData.status === 'cancellata' || contractCancelled === true;
      
      if (isCancelled) {
        // Pool cancellato
        return {
          canBet: false,
          canClaimRewards: false,
          canClaimRefund: canRefund,
          isActive: false,
          isPaused: false,
          isCancelled: true,
          isResolved: false,
          statusText: 'CANCELLATA',
          statusColor: 'text-red-600',
          statusIcon: '🔴'
        };
      } else if (memoizedPoolData.winnerSet || memoizedPoolData.status === 'risolta') {
        // Pool risolto
        const hasWon = user && memoizedPoolData.userBet && 
                      memoizedPoolData.userBet.choice === memoizedPoolData.winner;
        
        return {
          canBet: false,
          canClaimRewards: hasWon && !memoizedPoolData.userBet?.claimed,
          canClaimRefund: false,
          isActive: false,
          isPaused: false,
          isCancelled: false,
          isResolved: true,
          statusText: 'RISOLTA',
          statusColor: 'text-blue-600',
          statusIcon: '🏆'
        };
             } else {
               // LOGICA DEI 4 STATI BASATA SUL CONTRATTO
               
               // Stato 1: Pool chiusa (contratto chiuso manualmente)
               if (contractClosed === true) {
                 return {
                   canBet: false,
                   canClaimRewards: false,
                   canClaimRefund: false,
                   isActive: false,
                   isPaused: false,
                   isCancelled: false,
                   isResolved: false,
                   statusText: 'CHIUSA',
                   statusColor: 'text-yellow-600',
                   statusIcon: '🟡'
                 };
               }
               
               // Stato 2: Emergency Stop attivo (contratto in pausa)
               if (emergencyStop === true) {
                 return {
                   canBet: false,
                   canClaimRewards: false,
                   canClaimRefund: false,
                   isActive: false,
                   isPaused: true,
                   isCancelled: false,
                   isResolved: false,
                   statusText: 'IN PAUSA',
                   statusColor: 'text-yellow-600',
                   statusIcon: '🟡'
                 };
               }
               
               // Stato 3: Scommesse aperte (contratto permette di scommettere)
               else if (contractBettingOpen === true) {
                 const hasBet = user && memoizedPoolData.userBet && memoizedPoolData.userBet.amount > 0;
                 
                 return {
                   canBet: !hasBet,
                   canClaimRewards: false,
                   canClaimRefund: false,
                   isActive: true,
                   isPaused: false,
                   isCancelled: false,
                   isResolved: false,
                   statusText: 'ATTIVA',
                   statusColor: 'text-green-600',
                   statusIcon: '🟢'
                 };
               }
               
               // Stato 4: Fine scommesse ma prediction non terminata (contratto non permette scommesse ma siamo prima di closingBid)
               else if (contractBettingOpen === false && now < closingBid) {
                 return {
                   canBet: false,
                   canClaimRewards: false,
                   canClaimRefund: false,
                   isActive: false,
                   isPaused: false,
                   isCancelled: false,
                   isResolved: false,
                   statusText: 'SCOMMESSE CHIUSE',
                   statusColor: 'text-yellow-600',
                   statusIcon: '🟡'
                 };
               }
               
               // Stato 5: Prediction terminata - attesa risultati (contratto non permette scommesse e siamo dopo closingBid)
               else if (contractBettingOpen === false && now >= closingBid) {
                 return {
                   canBet: false,
                   canClaimRewards: false,
                   canClaimRefund: false,
                   isActive: false,
                   isPaused: false,
                   isCancelled: false,
                   isResolved: false,
                   statusText: 'ATTESA RISULTATI',
                   statusColor: 'text-blue-600',
                   statusIcon: '⏰'
                 };
               }
               
               // Fallback: Se contratto non disponibile, usa logica temporale
               else {
                 const bettingOpen = now < closingDate;
                 const hasBet = user && memoizedPoolData.userBet && memoizedPoolData.userBet.amount > 0;
                 
                 if (bettingOpen) {
                   return {
                     canBet: !hasBet,
                     canClaimRewards: false,
                     canClaimRefund: false,
                     isActive: true,
                     isPaused: false,
                     isCancelled: false,
                     isResolved: false,
                     statusText: 'ATTIVA (FALLBACK)',
                     statusColor: 'text-green-600',
                     statusIcon: '🟢'
                   };
                 } else if (now < closingBid) {
                   return {
                     canBet: false,
                     canClaimRewards: false,
                     canClaimRefund: false,
                     isActive: false,
                     isPaused: true,
                     isCancelled: false,
                     isResolved: false,
                     statusText: 'SCOMMESSE CHIUSE (FALLBACK)',
                     statusColor: 'text-yellow-600',
                     statusIcon: '🟡'
                   };
                 } else {
                   return {
                     canBet: false,
                     canClaimRewards: false,
                     canClaimRefund: false,
                     isActive: false,
                     isPaused: false,
                     isCancelled: false,
                     isResolved: false,
                     statusText: 'ATTESA RISULTATI (FALLBACK)',
                     statusColor: 'text-blue-600',
                     statusIcon: '⏰'
                   };
                 }
               }
      }
    } catch (error) {
      console.error('Errore calcolo stato pool:', error);
      return {
        canBet: false,
        canClaimRewards: false,
        canClaimRefund: false,
        isActive: false,
        isPaused: false,
        isCancelled: false,
        isResolved: false,
        statusText: 'ERRORE',
        statusColor: 'text-red-600',
        statusIcon: '❌'
      };
    }
  }, [poolAddress, memoizedPoolData, user, contractBettingOpen, emergencyStop, contractCancelled, contractClosed, contractLoading]);

  // Funzione per forzare il refresh dello stato del contratto
  const refreshContractState = useCallback(async () => {
    if (!poolAddress) return;
    
    try {
      setIsRefreshing(true);
      const [isOpen, emergencyStopStatus, closedStatus] = await Promise.all([
        isBettingCurrentlyOpen(poolAddress),
        getEmergencyStopStatus(poolAddress),
        isPoolClosed(poolAddress)
      ]);
      setContractBettingOpen(isOpen);
      setEmergencyStop(emergencyStopStatus);
      setContractClosed(closedStatus);
      setLastUpdate(Date.now());
    } catch (error) {
      console.warn('❌ usePoolState: Errore refresh contratto:', error);
      setContractBettingOpen(null);
      setEmergencyStop(null);
      setContractClosed(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [poolAddress]);

  return {
    ...poolState,
    refreshContractState,
    lastUpdate,
    contractLoading,
    isRefreshing
  };
};
