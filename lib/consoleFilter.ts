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
}

