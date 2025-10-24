/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router è ora stabile in Next.js 14
  webpack: (config, { isServer }) => {
    // Ignora gli errori di indexedDB durante SSR
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'idb-keyval': 'idb-keyval',
      });
    }
    
    // Risolve il problema del MetaMask SDK con React Native modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
      'react-native-web': false,
      'react-native-get-random-values': false,
    };
    
    // Ignora i moduli React Native durante il build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };
    
    return config;
  },
  // Ignora gli errori di indexedDB durante il build
  onDemandEntries: {
    // Periodo di attesa prima di invalidare le pagine inattive
    maxInactiveAge: 25 * 1000,
    // Numero di pagine che dovrebbero essere mantenute simultaneamente
    pagesBufferLength: 2,
  },
}
export default nextConfig
