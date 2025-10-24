"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
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
  imageUrl
}: PredictionCardProps) {
  const { isConnected } = useWeb3Auth();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
            <span className={`text-xs font-medium ${
              status === 'attiva' 
                ? 'text-green-600 dark:text-green-400' 
                : status === 'in_attesa'
                ? 'text-yellow-600 dark:text-yellow-400'
                : status === 'in_pausa'
                ? 'text-orange-600 dark:text-orange-400'
                : status === 'risolta'
                ? 'text-blue-600 dark:text-blue-400'
                : status === 'cancellata'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {status === 'attiva' ? '🟢 ATTIVA' : 
               status === 'in_attesa' ? '🟡 IN ATTESA' :
               status === 'in_pausa' ? '🟠 IN PAUSA' :
               status === 'risolta' ? '🏆 RISOLTA' :
               status === 'cancellata' ? '🔴 CANCELLATA' :
               '🟢 ATTIVA'}
            </span>
            
            {/* Volumi */}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Volumi: <span className="font-bold text-primary">{totalBets.toFixed(4)} BNB</span>
            </span>
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
