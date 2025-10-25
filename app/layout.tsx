import type { Metadata } from 'next'
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
                // Filtra warning Lit, WalletConnect e Webpack
                const originalWarn = console.warn;
                console.warn = (...args) => {
                  if (typeof args[0] === "string" && (
                    args[0].includes("Lit is in dev mode") ||
                    args[0].includes("Multiple versions of Lit loaded") ||
                    args[0].includes("WalletConnect Core is already initialized") ||
                    args[0].includes("webpack.cache.PackFileCacheStrategy") ||
                    args[0].includes("Caching failed for pack")
                  )) return;
                  originalWarn(...args);
                };
                
                // Filtra errori Coinbase Analytics
                const originalError = console.error;
                console.error = (...args) => {
                  const message = args[0]?.toString() || '';
                  if (
                    message.includes('cca-lite.coinbase.com') ||
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('Analytics SDK') ||
                    message.includes('Failed to fetch')
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
