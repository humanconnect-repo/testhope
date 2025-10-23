import type { Metadata } from 'next'
import './globals.css'
import '../styles/animations.css'
import Web3Provider from '@/components/Web3Provider'

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
                global.indexedDB = {} as IDBFactory;
              }
              
              // Disabilita warning Lit in console
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = (...args) => {
                  if (typeof args[0] === "string" && args[0].includes("Lit is in dev mode")) return;
                  originalWarn(...args);
                };
                
                // Disabilita anche altri warning di Lit
                window.litDisableBundleWarning = true;
                if (window.litConfig) {
                  window.litConfig.devMode = false;
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
