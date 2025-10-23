"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit'
import UserMenu from './UserMenu'
import { useWeb3Auth } from '@/hooks/useWeb3Auth'
import { useState, useEffect } from 'react'

export default function Web3Login() {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useWeb3Auth()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    )
  }

  // Se l'utente è connesso (con o senza autenticazione), mostra il menu utente
  if (isConnected) {
    return <UserMenu />
  }

  // Se non è connesso, mostra il pulsante di connessione
  return <ConnectButton />
}
