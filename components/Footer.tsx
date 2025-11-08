"use client";
import { useState } from 'react';

export default function Footer() {
  const [showKeetModal, setShowKeetModal] = useState(false);

  const handleKeetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowKeetModal(true);
  };

  const copyKeetLink = () => {
    const keetLink = "pear://keet/nfoscxz5ir9fqq6m6aanhkqdk767wb8jj1kn3a8tszu9fo1eesweaiamy1bcbma8y7k4x85c7guba494qb4dezt1rmm6dwtsqyhfo1hb3466m9iqtpmmo7wqed1mrk1uwqzx4awe5g7npu1618oz9oytf9t3hyedrewipc7saq6kc8ywpgiioaadkazhg";
    navigator.clipboard.writeText(keetLink);
    alert('Link Keet copiato negli appunti!');
  };

  return (
    <>
      <footer className="bg-transparent border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: layout centrato con sezioni separate */}
          <div className="flex flex-col items-center space-y-3 sm:hidden">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              © Bella Napoli | Il Prediction Market all'italiana
            </p>
            <div className="text-gray-600 dark:text-gray-400 text-sm text-center">
              Seguici su{' '}
              <button 
                onClick={handleKeetClick}
                className="text-primary hover:underline cursor-pointer"
              >
                Keet
              </button> {' | '} 
              <a 
                href="https://x.com/bellanapoli_io"
                className="text-primary hover:underline"
                target="_blank" rel="noopener noreferrer"
              >
                X
              </a>
            </div>
            <a 
              href="mailto:bellanapoli@tuta.com" 
              className="text-primary hover:underline text-sm text-center"
            >
              Report a bug
            </a>
          </div>

          {/* Desktop: layout originale */}
          <div className="hidden sm:flex sm:justify-between sm:items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © Bella Napoli | Il Prediction Market all'italiana — Seguici su{' '}
              <button 
                onClick={handleKeetClick}
                className="text-primary hover:underline cursor-pointer"
              >
                Keet
              </button> {' | '} 
              <a 
                href="https://x.com/bellanapoli_io"
                className="text-primary hover:underline"
                target="_blank" rel="noopener noreferrer"
              >
                X
              </a>
            </p>
            <a 
              href="mailto:bellanapoli@tuta.com" 
              className="text-primary hover:underline text-sm"
            >
              Report a bug
            </a>
          </div>
        </div>
      </footer>

      {/* Keet Modal */}
      {showKeetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-primary/20 dark:border-primary/30 p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AVVISO
              </h3>
              
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                  ⏰ Il link Keet scade il <strong>21.11.2025 ore 16:30</strong>
                </p>
              </div>

              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Link Keet:</p>
                <code className="text-xs text-gray-800 dark:text-gray-200 break-all">
                  pear://keet/nfoscxz5ir9fqq6m6aanhkqdk767wb8jj1kn3a8tszu9fo1eesweaiamy1bcbma8y7k4x85c7guba494qb4dezt1rmm6dwtsqyhfo1hb3466m9iqtpmmo7wqed1mrk1uwqzx4awe5g7npu1618oz9oytf9t3hyedrewipc7saq6kc8ywpgiioaadkazhg
                </code>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyKeetLink}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📋 Copia Link
                </button>
                <button
                  onClick={() => setShowKeetModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
