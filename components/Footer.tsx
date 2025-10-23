"use client";
import { useState } from 'react';

export default function Footer() {
  const [showKeetModal, setShowKeetModal] = useState(false);

  const handleKeetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowKeetModal(true);
  };

  const copyKeetLink = () => {
    const keetLink = "pear://keet/yfoscxz5ir9fqq6m6aanhkqdk767wb8jj1kn3a8tszu9fo1eesweai57kgp8p1s8971byrp6gpcpiq6d4dr839txn91qjiygb1ecisyxdcdsrpd8i98j1xopbkfegsssa3xgngqy65kmwue7ep4wmgn3mdy56ye";
    navigator.clipboard.writeText(keetLink);
    alert('Link Keet copiato negli appunti!');
  };

  return (
    <>
      <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © Bella Napoli | Il Prediction Market all'italiana — Seguici su{' '}
              <button 
                onClick={handleKeetClick}
                className="text-primary hover:underline cursor-pointer"
              >
                Keet
              </button> |{' '}
              <a href="#" className="text-primary hover:underline">Telegram</a> |{' '}
              <a href="#" className="text-primary hover:underline">X</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Keet Modal */}
      {showKeetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🚨 Avviso Importante
              </h3>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  ⏰ Il link Keet scade il <strong>6 novembre 2024</strong>
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Link Keet:</p>
                <code className="text-xs text-gray-800 dark:text-gray-200 break-all">
                  pear://keet/yfoscxz5ir9fqq6m6aanhkqdk767wb8jj1kn3a8tszu9fo1eesweai57kgp8p1s8971byrp6gpcpiq6d4dr839txn91qjiygb1ecisyxdcdsrpd8i98j1xopbkfegsssa3xgngqy65kmwue7ep4wmgn3mdy56ye
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
