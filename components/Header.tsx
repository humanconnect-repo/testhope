"use client";
import React from 'react';
import Web3Login from './Web3Login';
import { useAdmin } from '@/hooks/useAdmin';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const { isAdmin, loading } = useAdmin();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Sottotitolo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/media/logos/bnpm.png"
              alt="Bella Napoli Logo"
              width={32}
              height={32}
              className="rounded-lg w-8 h-8"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              <span className="block sm:inline">Scommetti sul futuro,</span>
              <span className="block sm:inline">con stile degen!</span>
            </p>
          </div>

          {/* Web3 Login e OP Panel */}
          <div className="flex items-center space-x-4">
            <Web3Login />
            
            {/* OP Panel Button - Solo per admin */}
            {!loading && isAdmin && (
              <Link 
                href="/0x9dc9ca268dc8370b"
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600 flex items-center space-x-2"
              >
                {/* Icona admin */}
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                {/* Testo solo su desktop */}
                <span className="hidden sm:inline">OP Panel</span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
