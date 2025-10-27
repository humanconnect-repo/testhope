"use client";
import React, { useState } from 'react';

export interface BettingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface BettingProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: BettingStep[];
  currentStep: number;
  transactionHash?: string;
  error?: string;
  betAmount?: string;
  betChoice?: 'yes' | 'no';
}

export default function BettingProgressModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  transactionHash,
  error,
  betAmount,
  betChoice
}: BettingProgressModalProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemType);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllContent = async () => {
    let allContent = '=== BELLA NAPOLI - LOG PREDICTION ===\n\n';
    
    // Aggiungi i passi
    allContent += 'PASSI TRANSAZIONE:\n';
    steps.forEach((step, index) => {
      const status = step.status === 'completed' ? '✅' : 
                    step.status === 'loading' ? '🔄' : 
                    step.status === 'error' ? '❌' : '⏳';
      allContent += `${index + 1}. ${status} ${step.title}\n`;
      allContent += `   ${step.description}\n`;
      if (step.error) {
        allContent += `   ERRORE: ${step.error}\n`;
      }
      allContent += '\n';
    });

    // Aggiungi dettagli scommessa
    if (betAmount && betChoice) {
      allContent += 'DETTAGLI PREDICTION:\n';
      allContent += `Importo: ${betAmount} BNB\n`;
      allContent += `Scelta: ${betChoice === 'yes' ? 'SÌ' : 'NO'}\n`;
      allContent += '\n';
    }

    // Aggiungi dettagli transazione
    if (transactionHash) {
      allContent += 'DETTAGLI TRANSAZIONE:\n';
      allContent += `Hash: ${transactionHash}\n`;
      allContent += `BSCScan: https://testnet.bscscan.com/tx/${transactionHash}\n`;
      allContent += '\n';
    }

    // Aggiungi errori principali
    if (error) {
      allContent += 'ERRORE PRINCIPALE:\n';
      allContent += `${error}\n\n`;
    }

    allContent += '=== FINE LOG ===';
    
    await copyToClipboard(allContent, 'all');
  };

  if (!isOpen) return null;

  const getStepIcon = (step: BettingStep, index: number) => {
    if (step.status === 'completed') {
      return (
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (step.status === 'loading') {
      return (
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      );
    } else if (step.status === 'error') {
      return (
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{index + 1}</span>
        </div>
      );
    }
  };

  const getStepTextColor = (step: BettingStep) => {
    if (step.status === 'error') return 'text-red-600 dark:text-red-400';
    if (step.status === 'completed') return 'text-green-600 dark:text-green-400';
    if (step.status === 'loading') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 mx-4 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🎯 Prediction in Corso
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyAllContent}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Copia tutto il contenuto del log"
            >
              {copiedItem === 'all' ? (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-green-600">Copiato!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">Copia Tutto</span>
                </div>
              )}
            </button>
            {!error && currentStep < steps.length && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              {getStepIcon(step, index)}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${getStepTextColor(step)}`}>
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
                {step.error && (
                  <div className="mt-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-red-600 dark:text-red-400 break-words flex-1">
                        {step.error}
                      </p>
                      <button
                        onClick={() => copyToClipboard(step.error!, `step-${step.id}`)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors p-1 ml-2 flex-shrink-0"
                        title="Copia messaggio di errore"
                      >
                        {copiedItem === `step-${step.id}` ? (
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Betting Details */}
        {betAmount && betChoice && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              💰 Dettagli Prediction
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Importo:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{betAmount} BNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Scelta:</span>
                <span className={`text-sm font-medium ${betChoice === 'yes' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {betChoice === 'yes' ? 'SÌ' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Info */}
        {transactionHash && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              📋 Dettagli Transazione
            </h4>
            
            {/* Avviso sui BNB inviati */}
            {betAmount && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Avviso: in questa transazione vedi quanti BNB hai inviato al contract!
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Hai inviato: <span className="font-bold">{betAmount} BNB</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Avviso aggiuntivo solo quando completata */}
            {betAmount && currentStep === 5 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      ✅ Transazione completata! Controlla l'hash per verificare l'invio dei BNB
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Importo confermato: <span className="font-bold">{betAmount} BNB</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Hash:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all flex-1">
                    {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(transactionHash, 'hash')}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                    title="Copia hash completo"
                  >
                    {copiedItem === 'hash' ? (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <a
                    href={`https://testnet.bscscan.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex-shrink-0"
                  >
                    View on BSCScan
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Errore durante la prediction
                </h4>
              </div>
              <button
                onClick={() => copyToClipboard(error, 'error')}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors p-1"
                title="Copia messaggio di errore"
              >
                {copiedItem === 'error' ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 break-words overflow-y-auto max-h-32">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 flex-shrink-0">
          {error ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Chiudi
            </button>
          ) : currentStep >= steps.length ? (
            <button
              onClick={() => {
                onClose();
                // Non serve più il refresh, i dati si aggiornano automaticamente
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Completato
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Annulla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
