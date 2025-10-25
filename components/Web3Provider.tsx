"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../lib/wagmi'
import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

// Lazy import di RainbowKit per evitare errori indexedDB durante SSR
const RainbowKitProvider = dynamic(
  () => import("@rainbow-me/rainbowkit").then(mod => mod.RainbowKitProvider),
  { 
    ssr: false,
    loading: () => <div>Loading wallet...</div>
  }
)

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  // Memoizza il QueryClient per evitare re-creazioni
  const queryClient = useMemo(() => new QueryClient(), [])
  
  // Memoizza la configurazione per evitare re-inizializzazioni
  const memoizedConfig = useMemo(() => config, [])

  return (
    <WagmiProvider config={memoizedConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: 'Bella Napoli',
            learnMoreUrl: 'https://rainbowkit.com',
          }}
          initialChain={memoizedConfig.chains[0]}
          showRecentTransactions={false}
          modalSize="compact"
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
