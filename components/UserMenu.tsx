"use client";
import { useState, useRef, useEffect } from 'react';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
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
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    );
  }

  const handleProfileClick = () => {
    setIsOpen(false);
    // Aggiungi un piccolo delay per evitare connessioni multiple
    setTimeout(() => {
      router.push('/profilo');
    }, 200);
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {/* Header con indirizzo wallet, chain e saldo */}
          {isConnected && address && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
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
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                    {chain.name}
                  </span>
                </div>
              )}
              
              {/* Saldo */}
              {balance && (
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
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Profilo</span>
                </button>
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
