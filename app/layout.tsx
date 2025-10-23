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
