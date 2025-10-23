import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { 
  injected, 
  walletConnect, 
  coinbaseWallet 
} from '@wagmi/connectors'

export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(), // MetaMask, Rabby Wallet e altri wallet iniettati
    walletConnect({
      projectId: '980d4d23a4a0c766d257eb52d6c1dd16'
    }), // WalletConnect per mobile
    coinbaseWallet({
      appName: 'Bella Napoli',
      appLogoUrl: 'https://bellanapoli.vercel.app/media/logos/bnpm.png'
    }) // Coinbase Wallet
  ],
  transports: {
    [bscTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
