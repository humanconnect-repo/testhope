import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { 
  isBettingCurrentlyOpen,
  canClaimRefund,
  isPoolCancelled
} from '../lib/contracts';

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
}

export const usePoolState = (poolAddress: string, poolData: any) => {
  const { user } = useWeb3Auth();
  const [poolState, setPoolState] = useState<PoolState>({
    canBet: false,
    canClaimRewards: false,
    canClaimRefund: false,
    isActive: false,
    isPaused: false,
    isCancelled: false,
    isResolved: false,
    statusText: 'ATTIVA',
    statusColor: 'text-green-600',
    statusIcon: '🟢'
  });

  // Cache per dati che cambiano raramente
  const [cancelledCache, setCancelledCache] = useState<{ [key: string]: { value: boolean; timestamp: number } }>({});
  const CACHE_DURATION = 60000; // 1 minuto

  useEffect(() => {
    const updatePoolState = async () => {
      if (!poolAddress || !poolData) return;

      try {
        // Controlla se il pool è cancellato (con cache)
        let cancelled = false;
        const now = Date.now();
        const cacheKey = poolAddress;
        
        if (cancelledCache[cacheKey] && (now - cancelledCache[cacheKey].timestamp) < CACHE_DURATION) {
          cancelled = cancelledCache[cacheKey].value;
        } else {
          cancelled = await isPoolCancelled(poolAddress);
          setCancelledCache(prev => ({
            ...prev,
            [cacheKey]: { value: cancelled, timestamp: now }
          }));
        }
        
        // Controlla se le scommesse sono aperte (LEGGE DAL CONTRATTO)
        const bettingOpen = await isBettingCurrentlyOpen(poolAddress);
        
        // Controlla se l'utente può richiedere rimborsi (disabilitato su BSC per problemi ENS)
        const canRefund = false; // Disabilitato su BSC Testnet per evitare errori ENS

        // Determina lo stato del pool
        let state: PoolState;

        if (cancelled) {
          // Pool cancellato
          state = {
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
        } else if (poolData.winnerSet) {
          // Pool risolto
          const hasWon = user && poolData.userBet && 
                        poolData.userBet.choice === poolData.winner;
          
          state = {
            canBet: false,
            canClaimRewards: hasWon && !poolData.userBet.claimed,
            canClaimRefund: false,
            isActive: false,
            isPaused: false,
            isCancelled: false,
            isResolved: true,
            statusText: 'RISOLTA',
            statusColor: 'text-blue-600',
            statusIcon: '🏆'
          };
        } else if (!bettingOpen && poolData.emergencyStop) {
          // Pool in pausa
          state = {
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
        } else {
          // Pool attivo
          const hasBet = user && poolData.userBet && poolData.userBet.amount > 0;
          
          state = {
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

        setPoolState(state);
      } catch (error) {
        console.error('Errore aggiornamento stato pool:', error);
      }
    };

    updatePoolState();
    
    // Polling ogni 5 minuti per aggiornamenti real-time (ridotto per meno refresh)
    const interval = setInterval(updatePoolState, 300000); // 5 minuti
    
    return () => clearInterval(interval);
  }, [poolAddress, poolData, user, cancelledCache]);

  return poolState;
};
