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
              width={40}
              height={40}
              className="rounded-lg"
              style={{ width: "auto", height: "auto" }}
            />
            <p className="text-lg text-gray-500 dark:text-gray-400 italic">
              Scommetti sul futuro, con stile degen!
            </p>
          </div>

          {/* Web3 Login e OP Panel */}
          <div className="flex items-center space-x-4">
            <Web3Login />
            
            {/* OP Panel Button - Solo per admin */}
            {!loading && isAdmin && (
              <Link 
                href="/0x9dc9ca268dc8370b"
                className="bg-gray-100 dark:bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm border border-gray-200 dark:border-gray-600"
              >
                OP Panel
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
