"use client";
import React, { useState } from 'react';

export interface AdminStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface AdminProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AdminStep[];
  currentStep: number;
  transactionHash?: string;
  error?: string;
  operationType: 'stop' | 'resume' | 'cancel' | 'close' | 'resolve_yes' | 'resolve_no' | 'reopen' | 'recover';
  poolAddress?: string;
}

export default function AdminProgressModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  transactionHash,
  error,
  operationType,
  poolAddress
}: AdminProgressModalProps) {
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

  const handleClose = () => {
    onClose();
    // Non serve più il refresh, i dati si aggiornano automaticamente
  };

  const copyAllContent = async () => {
    let operationLabel = '';
    if (operationType === 'stop') operationLabel = 'STOP BETTING';
    else if (operationType === 'cancel') operationLabel = 'CANCEL POOL';
    else if (operationType === 'close') operationLabel = 'CLOSE POOL';
    else if (operationType === 'resolve_yes') operationLabel = 'RESOLVE YES';
    else if (operationType === 'resolve_no') operationLabel = 'RESOLVE NO';
    else if (operationType === 'reopen') operationLabel = 'OPEN POOL';
    else if (operationType === 'recover') operationLabel = 'RECOVER FUNDS';
    else operationLabel = 'RESUME BETTING';
    
    let allContent = `=== BELLA NAPOLI - LOG ${operationLabel} ===\n\n`;
    
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

    // Aggiungi dettagli operazione
    if (poolAddress) {
      allContent += 'DETTAGLI OPERAZIONE:\n';
      allContent += `Tipo: ${operationLabel}\n`;
      allContent += `Pool: ${poolAddress}\n`;
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

  const getStepIcon = (step: AdminStep, index: number) => {
    if (step.status === 'completed') {
      return (
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (step.status === 'loading') {
      return (
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }
    
    if (step.status === 'error') {
      return (
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</span>
      </div>
    );
  };

  const getStepTextColor = (step: AdminStep) => {
    if (step.status === 'completed') return 'text-green-600 dark:text-green-400';
    if (step.status === 'loading') return 'text-blue-600 dark:text-blue-400';
    if (step.status === 'error') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getOperationIcon = () => {
    if (operationType === 'stop') return '🟡';
    if (operationType === 'cancel') return '🔴';
    if (operationType === 'close') return '🔒';
    if (operationType === 'resolve_yes') return '✅';
    if (operationType === 'resolve_no') return '🚩';
    if (operationType === 'reopen') return '🔓';
    if (operationType === 'recover') return '💰';
    return '▶️';
  };

  const getOperationTitle = () => {
    if (operationType === 'stop') return 'Stop Betting';
    if (operationType === 'cancel') return 'Cancel Pool';
    if (operationType === 'close') return 'Close Pool';
    if (operationType === 'resolve_yes') return 'Resolve YES';
    if (operationType === 'resolve_no') return 'Resolve NO';
    if (operationType === 'reopen') return 'Open Pool';
    if (operationType === 'recover') return 'Recover';
    return 'Resume Betting';
  };

  const getOperationColor = () => {
    if (operationType === 'stop') return 'yellow';
    if (operationType === 'cancel') return 'red';
    if (operationType === 'close') return 'blue';
    if (operationType === 'resolve_yes') return 'green';
    if (operationType === 'resolve_no') return 'red';
    if (operationType === 'reopen') return 'green';
    if (operationType === 'recover') return 'yellow';
    return 'blue';
  };

  const getOperationColorClass = () => {
    if (operationType === 'stop') return 'text-yellow-600 dark:text-yellow-400';
    if (operationType === 'cancel') return 'text-red-600 dark:text-red-400';
    if (operationType === 'close') return 'text-blue-600 dark:text-blue-400';
    if (operationType === 'resolve_yes') return 'text-green-600 dark:text-green-400';
    if (operationType === 'resolve_no') return 'text-red-600 dark:text-red-400';
    if (operationType === 'reopen') return 'text-green-600 dark:text-green-400';
    if (operationType === 'recover') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getOperationBgClass = () => {
    if (operationType === 'stop') return 'bg-yellow-600 hover:bg-yellow-700';
    if (operationType === 'cancel') return 'bg-red-600 hover:bg-red-700';
    if (operationType === 'close') return 'bg-blue-600 hover:bg-blue-700';
    if (operationType === 'resolve_yes') return 'bg-green-600 hover:bg-green-700';
    if (operationType === 'resolve_no') return 'bg-red-600 hover:bg-red-700';
    if (operationType === 'reopen') return 'bg-green-600 hover:bg-green-700';
    if (operationType === 'recover') return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-blue-600 hover:bg-blue-700';
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
            {getOperationIcon()} {getOperationTitle()}
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
                onClick={handleClose}
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

        {/* Operation Details */}
        {poolAddress && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              🔧 Dettagli Operazione
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                <span className={`text-sm font-medium ${getOperationColorClass()}`}>
                  {getOperationTitle()}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Pool Address:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all flex-1">
                    {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(poolAddress, 'pool')}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                    title="Copia indirizzo pool completo"
                  >
                    {copiedItem === 'pool' ? (
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
                    href={`https://testnet.bscscan.com/address/${poolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex-shrink-0"
                  >
                    View Pool
                  </a>
                </div>
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
                  Log Funzione {getOperationTitle()}
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
              onClick={handleClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Chiudi
            </button>
          ) : currentStep >= steps.length ? (
            <button
              onClick={handleClose}
              className={`px-4 py-2 ${getOperationBgClass()} text-white rounded-lg transition-colors font-medium`}
            >
              Completato
            </button>
          ) : (
            <button
              onClick={handleClose}
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
