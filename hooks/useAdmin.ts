import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { supabase } from '../lib/supabase';

export const useAdmin = () => {
  const { user, isConnected } = useWeb3Auth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Se non siamo connessi, ferma il loading
      if (!isConnected) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Se siamo connessi ma l'utente non è ancora caricato, mantieni loading
      if (isConnected && !user) {
        setLoading(true);
        return;
      }

      // Il wallet address è in user.user_metadata.wallet_address
      const walletAddress = user?.user_metadata?.wallet_address;
      
      if (!walletAddress) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Usa la funzione che accetta il wallet address come parametro
        const { data: isAdminResult, error: adminError } = await supabase
          .rpc('check_wallet_admin_status', { input_wallet_address: walletAddress });

        if (adminError) {
          console.error('Admin check failed:', adminError);
          setError('Errore nel controllo dei permessi');
          setIsAdmin(false);
        } else {
          // isAdminResult ora è un boolean diretto, non un array
          setIsAdmin(Boolean(isAdminResult));
        }
      } catch (error) {
        console.error('Admin check exception:', error);
        setError('Errore nel controllo dei permessi');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isConnected, user, user?.id, user?.address]);

  // Se siamo connessi ma l'utente non è ancora caricato, mantieni loading
  if (isConnected && !user) {
    return { isAdmin: false, loading: true, error: null, userAddress: null };
  }

  return { 
    isAdmin, 
    loading, 
    error,
    userAddress: user?.user_metadata?.wallet_address 
  };
};
