"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { 
    signInWithWallet, 
    signOut, 
    address, 
    isConnected, 
    isLoading, 
    isAuthenticated,
    user 
  } = useWeb3Auth();

  // Hook per ottenere chain e saldo
  const { chain } = useAccount();
  const { data: balance } = useBalance({
    address: address as `0x${string}`,
  });

  // Verifica se è connesso a BSC Testnet (chain ID 97)
  const isConnectedToBscTestnet = chain?.id === 97;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ottieni l'avatar dell'utente o usa quello di default
  const userAvatar = user?.user_metadata?.profile?.avatar_url;
  const userNickname = user?.user_metadata?.profile?.username;
  const fallbackText = userNickname?.[0] || address?.slice(2, 4) || 'U';
  
  // Mostra la pizza solo se l'utente è caricato ma non ha avatar personalizzato
  // Durante il caricamento, mostra l'avatar se disponibile
  const shouldShowPizza = user && (!userAvatar || userAvatar.trim() === '');

  // Reset image state when avatar changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [userAvatar]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
    );
  }

  const handleProfileClick = () => {
    setIsOpen(false);
  };

  const handleSignInClick = () => {
    setIsOpen(false);
    signInWithWallet();
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    signOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Container con check e avatar */}
      <div className="flex items-center space-x-2">
        {/* Check verde per BSC Testnet */}
        {isConnected && isConnectedToBscTestnet && (
          <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-dark-bg shadow-sm" title="Connesso a BSC Testnet">
            <svg 
              className="w-3 h-3 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        )}
        
        {/* Avviso se non è su BSC Testnet */}
        {isConnected && !isConnectedToBscTestnet && chain && (
          <div 
            className="flex items-center justify-center w-5 h-5 bg-yellow-500 rounded-full border-2 border-white dark:border-dark-bg shadow-sm cursor-help" 
            title="Collegati alla BSC Testnet dal tuo wallet!"
          >
            <svg 
              className="w-3 h-3 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        )}
        
        {/* Avviso se è connesso ma la chain è undefined */}
        {isConnected && !chain && (
          <div 
            className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-dark-bg shadow-sm cursor-help" 
            title="Collegati alla BSC Testnet dal tuo wallet!"
          >
            <svg 
              className="w-3 h-3 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        )}
        
        {/* Avatar utente o icona Pizza */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 border-2 border-gray-300 dark:border-gray-600 hover:border-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Menu utente"
        >
          {shouldShowPizza ? (
            <img 
              src="/media/image/pizzacolorsmall.png" 
              alt="Menu utente" 
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {imageLoading && (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              )}
              <img 
                src={userAvatar} 
                alt="Avatar utente" 
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0 absolute' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {imageError && (
                <img 
                  src="/media/image/pizzacolorsmall.png" 
                  alt="Avatar fallback" 
                  className="w-full h-full object-cover"
                />
              )}
            </>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-blue-800 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-700 dark:border-blue-800 py-1 z-50">
          {/* Header con indirizzo wallet, chain e saldo */}
          {isConnected && address && (
            <div className="px-4 py-3 border-b border-blue-700 dark:border-blue-800 space-y-2">
              {/* Indirizzo wallet */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              
              {/* Chain */}
              {chain && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnectedToBscTestnet ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                    {chain.id === 97 ? 'BSC Testnet' : chain.name}
                  </span>
                </div>
              )}
              
              {/* Avviso se non è su BSC Testnet */}
              {isConnected && !isConnectedToBscTestnet && (
                <div className="px-2 py-1.5 bg-yellow-500/20 dark:bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Collegati alla BSC Testnet dal tuo wallet!
                </div>
              )}
              
              {/* Saldo - mostrato solo se su BSC Testnet */}
              {balance && isConnectedToBscTestnet && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Opzioni menu */}
          <div className="py-1">
            {isAuthenticated ? (
              // Autenticato - Profilo e Disconnetti
              <>
                <a
                  href="https://www.bnbchain.org/en/testnet-faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-4 py-2 text-sm text-black bg-yellow-500 hover:bg-yellow-600 transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.32 0L12 2.69z"/>
                  </svg>
                  <span className="font-semibold">BNB Faucet</span>
                </a>
                <Link
                  href="/profilo"
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Profilo</span>
                </Link>
                <button
                  onClick={handleSignOutClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>🚪</span>
                  <span>Disconnetti</span>
                </button>
              </>
            ) : (
              // Connesso ma non autenticato - Firma per accedere
              <button
                onClick={handleSignInClick}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>✍️</span>
                <span>{isLoading ? 'Connessione...' : 'Firma per accedere'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
