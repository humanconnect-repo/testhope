"use client";
import { useState, useEffect } from 'react';

interface Match {
  id: number;
  utcDate: string;
  status: string;
  competition: {
    id: number;
    name: string;
    code: string;
  };
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
}

export default function FootballMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 9;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/football/matches');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Errore API matches:', errorText);
          throw new Error(`Errore nel recupero dei match: ${response.status}`);
        }
        
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error('❌ Errore fetch match:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Funzione per formattare la data e ora in orario italiano
  const formatDateTime = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      // Converti in orario italiano (UTC+1 o UTC+2 a seconda del DST)
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
      return utcDate;
    }
  };

  // Funzione per ottenere il nome della competizione
  const getCompetitionName = (code: string): string => {
    switch (code) {
      case 'SA':
        return 'Serie A';
      case 'CL':
        return 'Champions League';
      default:
        return code;
    }
  };

  // Calcola i match per la pagina corrente
  const totalPages = Math.ceil(matches.length / matchesPerPage);
  const startIndex = (currentPage - 1) * matchesPerPage;
  const endIndex = startIndex + matchesPerPage;
  const currentMatches = matches.slice(startIndex, endIndex);

  // Reset alla prima pagina quando si espande/collassa o cambiano i match
  useEffect(() => {
    setCurrentPage(1);
  }, [isExpanded, matches.length]);

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
            Crea una Prediction di Serie A/Champions ({loading ? '...' : matches.length} match)
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento match...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">❌ Errore: {error}</p>
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nessun match programmato per questa settimana
            </div>
          ) : (
            <>
              {/* Grid di cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMatches.map((match) => (
                    <div 
                      key={match.id} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                    >
                      {/* Header card con competizione e ID */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                          {getCompetitionName(match.competition.code)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ID: {match.id}
                        </span>
                      </div>
                      
                      {/* Data e ora */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDateTime(match.utcDate)}</span>
                        </div>
                      </div>
                      
                      {/* Squadre */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            {match.homeTeam.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-medium">VS</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            {match.awayTeam.name}
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
                      Pagina {currentPage} di {totalPages} ({matches.length} match totali)
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

