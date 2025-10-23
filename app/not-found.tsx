"use client";
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image 
            src="/media/logos/BellaNapolilogo.png" 
            alt="Bella Napoli" 
            width={200}
            height={80}
            className="mx-auto"
          />
        </div>

        {/* 404 Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Oops! Pagina non trovata
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              La pagina che stai cercando non esiste o è stata spostata.
            </p>
          </div>

          {/* Action Button */}
          <div>
            <Link 
              href="/"
              className="inline-block w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
