import type { Metadata } from 'next'
import '../lib/consoleFilter' // Filtra warning server-side e client-side
import './globals.css'
import '../styles/animations.css'
import Web3Provider from '../components/Web3Provider'

export const metadata: Metadata = {
  title: 'Bella Napoli - Scommetti sul futuro, con stile degen italiano',
  description: 'Prediction market italiano per scommettere sul futuro con stile degen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="font-nunito dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Forza sempre il tema scuro
              document.documentElement.classList.add('dark')
              
              // Polyfill di sicurezza per indexedDB durante SSR
              if (typeof window === 'undefined') {
                global.indexedDB = {};
              }
              
              // Filtri console per errori non bloccanti
              if (typeof window !== 'undefined') {
                // Filtra warning Lit, WalletConnect, Webpack e NPM Audit
                const originalWarn = console.warn;
                console.warn = (...args) => {
                  const message = args[0]?.toString() || '';
                  if (
                    message.includes("Lit is in dev mode") ||
                    message.includes("Multiple versions of Lit loaded") ||
                    message.includes("WalletConnect Core is already initialized") ||
                    message.includes("Init() was called") ||
                    message.includes("AppKit SDK") ||
                    message.includes("AppKit") ||
                    message.includes("is outdated") ||
                    message.includes("webpack.cache.PackFileCacheStrategy") ||
                    message.includes("Caching failed for pack") ||
                    message.includes("npm warn deprecated") ||
                    message.includes("vulnerable") ||
                    message.includes("npm audit") ||
                    message.includes("prototype pollution")
                  ) return;
                  originalWarn(...args);
                };
                
                // Filtra errori Coinbase Analytics e Web3Modal/WalletConnect
                const originalError = console.error;
                console.error = (...args) => {
                  const message = args[0]?.toString() || '';
                  const url = args.length > 1 && typeof args[1] === 'string' ? args[1] : '';
                  const fullMessage = message + (url ? ' ' + url : '');
                  
                  if (
                    message.includes('cca-lite.coinbase.com') ||
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('Analytics SDK') ||
                    message.includes('Failed to fetch') ||
                    fullMessage.includes('api.web3modal.org') ||
                    fullMessage.includes('appkit/v1/config') ||
                    (fullMessage.includes('403') && fullMessage.includes('web3modal')) ||
                    (fullMessage.includes('Forbidden') && fullMessage.includes('web3modal'))
                  ) {
                    return; // Non mostrare questi errori
                  }
                  originalError(...args);
                };
                
                // Disabilita warning Lit e configurazione
                window.litDisableBundleWarning = true;
                if (window.litConfig) {
                  window.litConfig.devMode = false;
                }
                
                // Disabilita dev mode di Lit globalmente
                if (typeof window !== 'undefined') {
                  window.litDisableBundleWarning = true;
                  window.litConfig = { devMode: false };
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-200">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
