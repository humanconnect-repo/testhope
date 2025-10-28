"use client";
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { usePoolState } from '../hooks/usePoolState';
import WalletConnectionModal from './WalletConnectionModal';

interface PredictionCardProps {
  id: string;
  title: string;
  closingDate: string;
  yesPercentage: number;
  noPercentage: number;
  category: string;
  status?: string;
  totalBets?: number;
  imageUrl?: string;
  poolAddress?: string;
  totalPredictions?: number;
}

export default function PredictionCard({ 
  id, 
  title, 
  closingDate, 
  yesPercentage, 
  noPercentage, 
  category,
  status,
  totalBets = 0,
  imageUrl,
  poolAddress,
  totalPredictions = 0
}: PredictionCardProps) {
  const { isConnected } = useWeb3Auth();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Hook per stato del pool (legge dal smart contract)
  const poolData = useMemo(() => ({
    status: status,
    closingDate: 0, // Non necessario per i badge
    closingBid: 0, // Non necessario per i badge
    winnerSet: false,
    winner: false,
    userBet: null,
    emergencyStop: status === 'in_pausa'
  }), [status]);

  const poolState = usePoolState(poolAddress || '', poolData);

  // Funzione helper per determinare lo stato basato su contratto + database
  const getCardStatus = useMemo(() => {
    return () => {
      // Prima controlla se la prediction è risolta nel database (priorità massima)
      if (status === 'risolta') {
        return {
          status: 'risolta',
          displayText: 'RISOLTA',
          emoji: '🏆',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      }
      
      // Se abbiamo un pool address e poolState, usa quello come priorità
      if (poolAddress && poolState && poolState.statusText !== 'CARICAMENTO CONTRATTO') {
        // Controlla prima se è cancellata
        if (poolState.isCancelled || status === 'cancellata') {
          return {
            status: 'cancellata',
            displayText: 'CANCELLATA',
            emoji: '🔴',
            textColor: 'text-red-600 dark:text-red-400'
          };
        } else if (poolState.statusText === 'CHIUSA') {
          return {
            status: 'chiusa',
            displayText: 'CHIUSA',
            emoji: '🟡',
            textColor: 'text-yellow-600 dark:text-yellow-400'
          };
        } else if (poolState.isPaused) {
          return {
            status: 'in_pausa',
            displayText: 'IN PAUSA',
            emoji: '🟡',
            textColor: 'text-yellow-600 dark:text-yellow-400'
          };
        } else if (poolState.isActive) {
          return {
            status: 'attiva',
            displayText: 'ATTIVA',
            emoji: '🟢',
            textColor: 'text-green-600 dark:text-green-400'
          };
        } else if (poolState.statusText === 'SCOMMESSE CHIUSE') {
          return {
            status: 'attiva',
            displayText: 'ATTIVA',
            emoji: '🟡',
            textColor: 'text-yellow-600 dark:text-yellow-400'
          };
        } else if (poolState.statusText === 'ATTESA RISULTATI') {
          return {
            status: 'risolta',
            displayText: 'RISOLTA',
            emoji: '🏆',
            textColor: 'text-blue-600 dark:text-blue-400'
          };
        }
      }

      // Se non abbiamo dati del contratto, mostra stato di caricamento
      if (poolAddress && poolState?.statusText === 'CARICAMENTO CONTRATTO') {
        return {
          status: 'loading',
          displayText: 'CARICAMENTO...',
          emoji: '⏳',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
      }

      // Fallback solo se non abbiamo pool address
      if (!poolAddress) {
        switch (status) {
          case 'in_attesa':
            return {
              status: 'in_attesa',
              displayText: 'IN ATTESA',
              emoji: '🟡',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            };
          case 'attiva':
            return {
              status: 'attiva',
              displayText: 'ATTIVA',
              emoji: '🟢',
              textColor: 'text-green-600 dark:text-green-400'
            };
          case 'in_pausa':
            return {
              status: 'in_pausa',
              displayText: 'IN PAUSA',
              emoji: '🟡',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            };
          case 'risolta':
            return {
              status: 'risolta',
              displayText: 'RISOLTA',
              emoji: '🏆',
              textColor: 'text-blue-600 dark:text-blue-400'
            };
          case 'cancellata':
            return {
              status: 'cancellata',
              displayText: 'CANCELLATA',
              emoji: '🔴',
              textColor: 'text-red-600 dark:text-red-400'
            };
          default:
            return {
              status: 'attiva',
              displayText: 'ATTIVA',
              emoji: '🟢',
              textColor: 'text-green-600 dark:text-green-400'
            };
        }
      }

      // Se abbiamo pool address ma nessun dato del contratto, mostra errore
      // Se l'utente non è connesso al wallet, mostra "Status: Connect Wallet"
      if (!isConnected) {
        return {
          status: 'error',
          displayText: 'Status: prima connetti il Wallet',
          emoji: '',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
      }
      
      // FALLBACK: usa lo status dal database se disponibile
      if (status) {
        switch (status) {
          case 'attiva':
            return {
              status: 'attiva',
              displayText: 'ATTIVA',
              emoji: '🟢',
              textColor: 'text-green-600 dark:text-green-400'
            };
          case 'in_pausa':
            return {
              status: 'in_pausa',
              displayText: 'IN PAUSA',
              emoji: '🟡',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            };
          case 'risolta':
            return {
              status: 'risolta',
              displayText: 'RISOLTA',
              emoji: '🏆',
              textColor: 'text-blue-600 dark:text-blue-400'
            };
          case 'cancellata':
            return {
              status: 'cancellata',
              displayText: 'CANCELLATA',
              emoji: '🔴',
              textColor: 'text-red-600 dark:text-red-400'
            };
          case 'in_attesa':
            return {
              status: 'in_attesa',
              displayText: 'IN ATTESA',
              emoji: '🟡',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            };
        }
      }
      
      // Solo se non c'è né contratto né DB, mostra errore
      return {
        status: 'error',
        displayText: 'ERRORE',
        emoji: '❌',
        textColor: 'text-red-600 dark:text-red-400'
      };
    };
  }, [poolAddress, poolState, status, isConnected]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      e.preventDefault();
      setShowWalletModal(true);
      return;
    }
    
    // Se connesso, mostra loading e naviga
    e.preventDefault();
    setIsLoading(true);
    router.push(`/bellanapoli.prediction/${id}`);
  };

  // Reset loading quando il componente si smonta (navigazione completata)
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="relative rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm hover:shadow-md hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200 p-4 hover:-translate-y-0.5 cursor-pointer h-full flex flex-col"
      >
        {/* Header con categoria */}
        <div className="flex items-center justify-start mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
            {category}
          </span>
        </div>

        {/* Titolo */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Layout con immagine a sinistra e info a destra */}
        <div className="mb-3 flex items-start justify-between">
          {/* Immagine a sinistra */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('✅ Immagine caricata:', imageUrl)}
                  onError={() => console.error('❌ Errore caricamento immagine:', imageUrl)}
                />
              </div>
            </div>
          )}
          
          {/* Info completamente a destra */}
          <div className="flex flex-col items-end space-y-1">
            {/* Status */}
            <span className={`text-xs font-medium ${getCardStatus().textColor}`}>
              {getCardStatus().emoji} {getCardStatus().displayText}
            </span>
            
            {/* Volumi */}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Volumi: <span className="font-bold text-primary">{totalBets.toFixed(4)} BNB</span>
            </span>
            
            {/* Predictions totali - solo se ci sono bet */}
            {totalPredictions > 0 && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Predictions totali: <span className="font-bold text-primary">{totalPredictions}</span>
              </span>
            )}
          </div>
        </div>

        {/* Data di chiusura (solo se non attiva/in_attesa) */}
        {status !== 'attiva' && status !== 'in_attesa' && (
          <div className="mb-3">
            <div className="flex items-center">
              <span className="text-xs text-gray-700 dark:text-gray-300">{closingDate}</span>
            </div>
          </div>
        )}

        {/* Percentuali */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-yes-button"></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sì</span>
            </div>
            <span className="text-sm font-bold text-yes-button">{yesPercentage}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-no-button"></div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">No</span>
            </div>
            <span className="text-sm font-bold text-no-button">{noPercentage}%</span>
          </div>
        </div>

        {/* Barra di progresso */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-yes-button h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${yesPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Bottone Vedi dettagli */}
        <div className="mt-4">
          <div className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-1.5 px-3 rounded-md text-sm text-center transition-colors duration-200">
            {isLoading ? 'Caricamento...' : 'Vedi dettagli'}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 rounded-xl flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-64">
              <div className="text-center">
                <span className="text-gray-900 dark:text-white font-medium mb-4 block">Caricamento...</span>
                
                {/* Barra di loading */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-primary h-2 rounded-full animate-loading-bar"></div>
                </div>
                
                {/* Testo sotto la barra */}
                <span className="text-xs text-gray-500 dark:text-gray-400">Apertura dettagli...</span>
              </div>
            </div>
          </div>
        )}
      </div>

    {/* Wallet Connection Modal */}
    <WalletConnectionModal 
      isOpen={showWalletModal}
      onClose={() => setShowWalletModal(false)}
    />
  </>
  );
}
