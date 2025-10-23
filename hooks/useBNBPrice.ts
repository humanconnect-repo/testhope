import { useState, useEffect } from 'react';

export const useBNBPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=eur'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch BNB price');
        }
        
        const data = await response.json();
        setPrice(data.binancecoin.eur);
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
    const interval = setInterval(fetchPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  return { price, loading, error };
};
