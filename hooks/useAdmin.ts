import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { supabase } from '@/lib/supabase';

export const useAdmin = () => {
  const { user, isConnected } = useWeb3Auth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔍 useAdmin: Starting admin check...');
      console.log('🔍 isConnected:', isConnected);
      console.log('🔍 user:', user);
      console.log('🔍 user.id:', user?.id);
      console.log('🔍 user.address:', user?.address);

      // Se non siamo connessi, ferma il loading
      if (!isConnected) {
        console.log('❌ useAdmin: Not connected');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Se siamo connessi ma l'utente non è ancora caricato, mantieni loading
      if (isConnected && !user) {
        console.log('⏳ useAdmin: Connected but user not loaded yet, keeping loading...');
        setLoading(true);
        return;
      }

      // Il wallet address è in user.user_metadata.wallet_address
      const walletAddress = user?.user_metadata?.wallet_address;
      
      if (!walletAddress) {
        console.log('❌ useAdmin: No wallet address');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 useAdmin: Calling check_wallet_admin_status with:', walletAddress);
        
        // Usa la funzione che accetta il wallet address come parametro
        const { data: isAdminResult, error: adminError } = await supabase
          .rpc('check_wallet_admin_status', { input_wallet_address: walletAddress });

        console.log('🔍 useAdmin: Admin check result:', { isAdminResult, adminError });

        if (adminError) {
          console.error('❌ useAdmin: Admin check failed:', adminError);
          setError('Errore nel controllo dei permessi');
          setIsAdmin(false);
        } else {
          console.log('✅ useAdmin: Admin check success, is_admin:', isAdminResult);
          // isAdminResult ora è un boolean diretto, non un array
          setIsAdmin(Boolean(isAdminResult));
        }
      } catch (error) {
        console.error('❌ useAdmin: Exception:', error);
        setError('Errore nel controllo dei permessi');
        setIsAdmin(false);
      } finally {
        setLoading(false);
        console.log('🔍 useAdmin: Loading finished');
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
