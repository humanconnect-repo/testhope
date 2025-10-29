// Filtra warning server-side e client-side per Next.js
// Questo file viene eseguito sia sul server che sul client

if (typeof process !== 'undefined' || typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes("Lit is in dev mode") ||
      message.includes("Multiple versions of Lit loaded") ||
      message.includes("WalletConnect Core is already initialized") ||
      message.includes("Init() was called") ||
      message.includes("AppKit SDK") ||
      message.includes("AppKit") ||
      message.includes("is outdated")
    ) {
      return; // Non mostrare questi warning
    }
    originalWarn(...args);
  };
  
  // Filtra anche errori Web3Modal/WalletConnect 403
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const url = args.length > 1 && typeof args[1] === 'string' ? args[1] : '';
    const fullMessage = message + (url ? ' ' + url : '');
    
    if (
      fullMessage.includes('api.web3modal.org') ||
      fullMessage.includes('appkit/v1/config') ||
      (fullMessage.includes('403') && fullMessage.includes('web3modal')) ||
      (fullMessage.includes('Forbidden') && fullMessage.includes('web3modal'))
    ) {
      return; // Non mostrare questi errori
    }
    originalError(...args);
  };
}

