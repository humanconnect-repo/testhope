import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bscTestnet } from 'wagmi/chains'

// Crea la configurazione solo una volta per evitare inizializzazioni multiple
let configInstance: ReturnType<typeof getDefaultConfig> | null = null

export const config = (() => {
  if (!configInstance) {
    configInstance = getDefaultConfig({
      appName: 'Bella Napoli',
      projectId: '980d4d23a4a0c766d257eb52d6c1dd16',
      chains: [bscTestnet],
      ssr: true,
    })
  }
  return configInstance
})()

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
