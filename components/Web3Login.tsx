"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit'
import UserMenu from './UserMenu'
import { useWeb3Auth } from '../hooks/useWeb3Auth'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

export default function Web3Login() {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useWeb3Auth()
  const { isConnected: isWagmiConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    )
  }

  // Se l'account è connesso via wagmi o il nostro hook risulta connesso, mostra il menu utente
  if (isWagmiConnected || isConnected) {
    return <UserMenu />
  }

  // Se non è connesso, mostra il pulsante di connessione personalizzato
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': 'true',
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Evita di mostrare i "pill" chain/account per prevenire flicker
              if (connected) {
                return null;
              }
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm border border-primary/20"
                  >
                    {/* Icona wallet per mobile */}
                    <div className="flex items-center space-x-2">
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
                        />
                      </svg>
                      <span className="hidden sm:inline">Connect Wallet</span>
                    </div>
                  </button>
                );
              }

              return null;
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  )
}
