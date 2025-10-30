import { useState, useEffect } from 'react';

// --- Cache a livello di modulo ---
let cachedPrice: number | null = null;
let cachedAt: number | null = null;
const CACHE_DURATION = 300_000; // 5 minuti in ms

export const useBNBPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        // Se abbiamo il prezzo fresco in cache, restituiamo subito
        const now = Date.now();
        if (cachedPrice !== null && cachedAt !== null && now - cachedAt < CACHE_DURATION) {
          setPrice(cachedPrice);
          setLoading(false);
          setError(null);
          return;
        }
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=eur'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch BNB price');
        }
        
        const data = await response.json();
        cachedPrice = data.binancecoin.eur;
        cachedAt = now;
        setPrice(cachedPrice);
        setError(null);
      } catch (err) {
        setError('Errore nel caricamento del prezzo');
        console.error('Error fetching BNB price:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Aggiorna il prezzo ogni 5 minuti (allineato con altri polling)
    const interval = setInterval(fetchPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return { price, loading, error };
};
