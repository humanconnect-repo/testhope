"use client";
import { useState, useEffect } from 'react';
import { useWeb3Auth } from './useWeb3Auth';
import { ethers } from 'ethers';

export const useBNBBalance = () => {
  const { address, isAuthenticated } = useWeb3Auth();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isAuthenticated) {
        setBalance('0');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Connessione a BSC Testnet
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceWei = await provider.getBalance(address);
        const balanceBNB = ethers.formatEther(balanceWei);
        
        setBalance(parseFloat(balanceBNB).toFixed(4));
      } catch (err) {
        console.error('Errore nel recupero saldo BNB:', err);
        setError('Errore nel recupero del saldo');
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address, isAuthenticated]);

  return {
    balance,
    loading,
    error
  };
};
