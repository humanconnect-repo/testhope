"use client";
import { useState, useEffect } from 'react';

interface PolymarketMarket {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  endDate?: string;
  endDateTimestamp?: string;
  yesPrice?: number | null;
  noPrice?: number | null;
  yesPercentage?: number | null;
  noPercentage?: number | null;
  volume?: number | null;
  liquidity?: number | null;
  image?: string;
  active: boolean;
  closed: boolean;
}

export default function PolymarketMarkets() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const marketsPerPage = 6;

  // Carica i mercati solo quando si apre il menu
  useEffect(() => {
    // Se il menu è chiuso o i mercati sono già stati caricati, non fare nulla
    if (!isExpanded || markets.length > 0) {
      return;
    }

    fetchMarkets();
  }, [isExpanded]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/polymarket/markets');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Errore API Polymarket:', errorData);
        throw new Error(errorData.error || `Errore nel recupero dei mercati: ${response.status}`);
      }
      
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (err) {
      console.error('❌ Errore fetch mercati Polymarket:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per formattare la data
  const formatDate = (dateString?: string, timestamp?: string): string => {
    try {
      let date: Date;
      
      if (timestamp) {
        date = new Date(parseInt(timestamp) * 1000);
      } else if (dateString) {
        date = new Date(dateString);
      } else {
        return 'Data non disponibile';
      }
      
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome',
      };
      return date.toLocaleString('it-IT', options);
    } catch (err) {
      return 'Data non valida';
    }
  };

  // Calcola i mercati per la pagina corrente
  const totalPages = Math.ceil(markets.length / marketsPerPage);
  const startIndex = (currentPage - 1) * marketsPerPage;
  const endIndex = startIndex + marketsPerPage;
  const currentMarkets = markets.slice(startIndex, endIndex);

  // Reset alla prima pagina quando si espande/collassa o cambiano i mercati
  useEffect(() => {
    setCurrentPage(1);
  }, [isExpanded, markets.length]);

  return (
    <div>
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Importa da Polymarket {isExpanded && markets.length > 0 && `(${markets.length} mercati)`}
          </h2>
        </div>
      </div>
      
      {/* Contenuto espandibile */}
      {isExpanded && (
        <div>
          {loading ? (
            <div className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento mercati da Polymarket...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">❌ Errore: {error}</p>
                <button
                  onClick={fetchMarkets}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Riprova
                </button>
              </div>
            </div>
          ) : markets.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nessun mercato disponibile da Polymarket
            </div>
          ) : (
            <>
              {/* Grid di cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMarkets.map((market) => (
                    <div 
                      key={market.id} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                    >
                      {/* Header card con categoria e ID */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                          {market.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ID: {market.id.slice(0, 8)}...
                        </span>
                      </div>
                      
                      {/* Immagine se disponibile */}
                      {market.image && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={market.image} 
                            alt={market.title}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Titolo */}
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                        {market.title}
                      </h3>
                      
                      {/* Descrizione se disponibile */}
                      {market.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {market.description}
                        </p>
                      )}
                      
                      {/* Data di scadenza */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Scadenza: {formatDate(market.endDate, market.endDateTimestamp)}</span>
                        </div>
                      </div>
                      
                      {/* Probabilità YES/NO */}
                      {(market.yesPercentage !== null || market.noPercentage !== null) && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              YES: {market.yesPercentage !== null ? `${market.yesPercentage}%` : 'N/A'}
                            </span>
                            <span className="text-gray-400 dark:text-gray-600">|</span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              NO: {market.noPercentage !== null ? `${market.noPercentage}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Prezzi se disponibili */}
                      {(market.yesPrice !== null && market.yesPrice !== undefined || market.noPrice !== null && market.noPrice !== undefined) && (
                        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-between">
                            <span>Prezzo YES: {market.yesPrice !== null && market.yesPrice !== undefined ? `$${market.yesPrice.toFixed(4)}` : 'N/A'}</span>
                            <span>Prezzo NO: {market.noPrice !== null && market.noPrice !== undefined ? `$${market.noPrice.toFixed(4)}` : 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Volume e Liquidity se disponibili */}
                      {(market.volume !== null && market.volume !== undefined || market.liquidity !== null && market.liquidity !== undefined) && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          {market.volume !== null && market.volume !== undefined && (
                            <div>Volume: ${market.volume.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</div>
                          )}
                          {market.liquidity !== null && market.liquidity !== undefined && (
                            <div>Liquidity: ${market.liquidity.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</div>
                          )}
                        </div>
                      )}
                      
                      {/* Stato */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${market.active && !market.closed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {market.active && !market.closed ? 'Attivo' : market.closed ? 'Chiuso' : 'Inattivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Paginazione */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pagina {currentPage} di {totalPages} ({markets.length} mercati totali)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Indietro
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Avanti
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

