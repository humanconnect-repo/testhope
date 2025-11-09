"use client";
import React, { useState, useEffect } from 'react';

interface AdminLoadingModalProps {
  isOpen: boolean;
}

export default function AdminLoadingModal({ isOpen }: AdminLoadingModalProps) {
  const [progress, setProgress] = useState(0);
  const maxDuration = 3000; // 3 secondi in millisecondi

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    // Reset progress quando si apre
    setProgress(0);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / maxDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 16); // Aggiorna ogni ~16ms per animazione fluida (60fps)

    return () => clearInterval(interval);
  }, [isOpen, maxDuration]);

  if (!isOpen) return null;

  // Calcola il valore per il cerchio SVG (0-100 diventa 0-251.2 per la circonferenza)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop sfuocato */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      
      {/* Modal popup centrato */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 transform transition-all">
        <div className="flex flex-col items-center justify-center">
          {/* Progress bar circolare */}
          <div className="relative mb-6">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Cerchio grigio di sfondo */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Cerchio azzurro che si riempie progressivamente */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-primary transition-all duration-100 ease-linear"
              />
            </svg>
            {/* Percentuale al centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Testo principale */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Verifica permessi admin...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Attendere prego, stiamo verificando i tuoi permessi di accesso al pannello operativo.
          </p>
        </div>
      </div>
    </div>
  );
}

