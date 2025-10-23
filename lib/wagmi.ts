import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Bella Napoli',
  projectId: '980d4d23a4a0c766d257eb52d6c1dd16',
  chains: [bscTestnet],
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
