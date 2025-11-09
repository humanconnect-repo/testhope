import type { Metadata } from 'next'
import '../lib/consoleFilter' // Filtra warning server-side e client-side
import './globals.css'
import '../styles/animations.css'
import Web3Provider from '../components/Web3Provider'
import Header from '../components/Header'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'Bella Napoli - Scommetti sul futuro, con stile degen italiano',
  description: 'https://bellanapoli.io',
  openGraph: {
    title: 'Bella Napoli - Scommetti sul futuro, con stile degen italiano',
    description: 'https://bellanapoli.io',
    url: 'https://bellanapoli.io/',
    siteName: 'Bella Napoli',
    type: 'website',
    images: [
      {
        url: 'https://bellanapoli.io/media/image/BellaNapoli1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Bella Napoli',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bella Napoli - Scommetti sul futuro, con stile degen italiano',
    description: 'https://bellanapoli.io',
    images: ['https://bellanapoli.io/media/image/BellaNapoli1200x630.png'],
  },
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
                
                // Filtra errori Coinbase Analytics, Web3Modal/WalletConnect, estensioni wallet (Vultisig) e RPC
                const originalError = console.error;
                console.error = (...args) => {
                  const message = args[0]?.toString() || '';
                  const url = args.length > 1 && typeof args[1] === 'string' ? args[1] : '';
                  const fullMessage = message + (url ? ' ' + url : '');
                  
                  // Controlla anche gli argomenti per URL di RPC
                  const hasRpcError = args.some(arg => {
                    const str = String(arg);
                    return str.includes('bsc-testnet.publicnode.com') ||
                           str.includes('ERR_CONNECTION_CLOSED') ||
                           str.includes('JsonRpcProvider failed to detect network') ||
                           str.includes('retry in');
                  });
                  
                  if (
                    message.includes('cca-lite.coinbase.com') ||
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('Analytics SDK') ||
                    message.includes('Failed to fetch') ||
                    fullMessage.includes('api.web3modal.org') ||
                    fullMessage.includes('appkit/v1/config') ||
                    (fullMessage.includes('403') && fullMessage.includes('web3modal')) ||
                    (fullMessage.includes('Forbidden') && fullMessage.includes('web3modal')) ||
                    message.includes('Cannot redefine property: ethereum') ||
                    (message.includes('Cannot redefine property') && message.includes('ethereum')) ||
                    hasRpcError ||
                    fullMessage.includes('ERR_CONNECTION_CLOSED') ||
                    fullMessage.includes('bsc-testnet.publicnode.com') ||
                    message.includes('JsonRpcProvider failed to detect network') ||
                    message.includes('cannot start up; retry')
                  ) {
                    return; // Non mostrare questi errori
                  }
                  originalError(...args);
                };

                // Gestisce errori di ridefinizione window.ethereum da estensioni (Vultisig) e errori RPC
                window.addEventListener('error', (event) => {
                  const message = event.message || '';
                  const source = event.filename || '';
                  
                  if (
                    message.includes('Cannot redefine property: ethereum') ||
                    message.includes('ERR_CONNECTION_CLOSED') ||
                    (source.includes('bsc-testnet.publicnode.com') && message.includes('network')) ||
                    message.includes('JsonRpcProvider failed to detect network')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);

                // Gestisce promise rejection non gestite per errori ethereum e RPC
                window.addEventListener('unhandledrejection', (event) => {
                  const message = event.reason?.message || event.reason?.toString() || '';
                  
                  if (
                    message.includes('Cannot redefine property: ethereum') ||
                    (message.includes('Cannot redefine property') && message.includes('ethereum')) ||
                    message.includes('ERR_CONNECTION_CLOSED') ||
                    message.includes('JsonRpcProvider failed to detect network') ||
                    message.includes('cannot start up; retry')
                  ) {
                    event.preventDefault();
                    return false;
                  }
                });

                // Blocca richieste di analytics verso domini noti (es. Coinbase/WalletConnect) per evitare errori in console
                try {
                  const blockedHosts = ['cca-lite.coinbase.com', 'pulse.walletconnect.org'];
                  const shouldBlock = (u) => {
                    try {
                      const s = typeof u === 'string' ? u : (u?.url || '');
                      return blockedHosts.some((h) => s.includes(h));
                    } catch { return false; }
                  };

                  // fetch()
                  if (typeof window.fetch === 'function') {
                    const originalFetch = window.fetch.bind(window);
                    window.fetch = (...args) => {
                      const url = args[0];
                      if (shouldBlock(url)) {
                        // Risposta valida senza body per status 204
                        return Promise.resolve(new Response(null, { status: 204 }));
                      }
                      return originalFetch(...args);
                    };
                  }

                  // XMLHttpRequest
                  if (typeof XMLHttpRequest !== 'undefined') {
                    const origOpen = XMLHttpRequest.prototype.open;
                    const origSend = XMLHttpRequest.prototype.send;
                    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                      try { this.__blocked = shouldBlock(url); } catch { this.__blocked = false; }
                      return origOpen.call(this, method, url, ...rest);
                    };
                    XMLHttpRequest.prototype.send = function(body) {
                      if (this.__blocked) { try { this.abort(); } catch {} return; }
                      return origSend.call(this, body);
                    };
                  }

                  // sendBeacon
                  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                    const origBeacon = navigator.sendBeacon.bind(navigator);
                    navigator.sendBeacon = (url, data) => {
                      if (shouldBlock(url)) return true;
                      return origBeacon(url, data);
                    };
                  }
                } catch {}
                
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
          <Header />
          {children}
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}
