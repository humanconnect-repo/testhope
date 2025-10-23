"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { useState } from 'react'
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
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: 'Bella Napoli',
            learnMoreUrl: 'https://rainbowkit.com',
          }}
          initialChain={config.chains[0]}
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
