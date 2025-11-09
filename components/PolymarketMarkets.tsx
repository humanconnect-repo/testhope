"use client";
import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';

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

interface PredictionFormData {
  title: string;
  description: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta';
  rules: string;
  image_url?: string;
  notes?: string;
}

export default function PolymarketMarkets() {
  const { userAddress } = useAdmin();
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const marketsPerPage = 6;
  
  // Stati per il form
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionFormData>({
    title: '',
    description: '',
    category: '',
    closing_date: '',
    closing_bid: '',
    status: 'in_attesa',
    rules: '',
    image_url: '',
    notes: ''
  });

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

  // Funzione per convertire UTC date in formato datetime-local (in orario italiano)
  const formatDateTimeLocal = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      
      // Usa Intl.DateTimeFormat per ottenere i componenti della data in timezone Europe/Rome
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const hour = parts.find(p => p.type === 'hour')?.value || '';
      const minute = parts.find(p => p.type === 'minute')?.value || '';
      
      return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch (err) {
      return '';
    }
  };

  // Handler per click su card Polymarket
  const handleMarketCardClick = (market: PolymarketMarket) => {
    setSelectedMarket(market);
    
    // Converti data di scadenza in formato datetime-local
    const endDate = market.endDate || (market.endDateTimestamp 
      ? new Date(parseInt(market.endDateTimestamp) * 1000).toISOString()
      : null);
    
    const closingDate = endDate ? formatDateTimeLocal(endDate) : '';
    
    // Mappa categoria Polymarket a categoria nostra
    let category = 'Crypto';
    const categoryLower = (market.category || '').toLowerCase();
    if (categoryLower.includes('finance') || categoryLower.includes('economy') || categoryLower.includes('financial')) {
      category = 'Economia';
    } else if (categoryLower.includes('crypto') || categoryLower.includes('bitcoin') || categoryLower.includes('ethereum')) {
      category = 'Crypto';
    }
    
    // Imposta form data con testo originale in inglese
    setFormData({
      title: market.title, // Titolo originale in inglese
      description: '', // Descrizione vuota
      category: category,
      closing_date: closingDate,
      closing_bid: closingDate, // Stessa data per entrambi come richiesto
      status: 'in_attesa',
      rules: market.description || '', // Descrizione originale in inglese va nel regolamento
      image_url: '', // Non caricare immagine
      notes: ''
    });
    
    setShowMarketForm(true);
    
    // Scroll al form dopo un breve delay
    setTimeout(() => {
      const formElement = document.getElementById('polymarket-prediction-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handler per annullare il form
  const handleCancelForm = () => {
    setShowMarketForm(false);
    setSelectedMarket(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      closing_date: '',
      closing_bid: '',
      status: 'in_attesa',
      rules: '',
      image_url: '',
      notes: ''
    });
  };

  // Handler per submit del form
  const handleMarketFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validazione dei dati
      if (!formData.title.trim()) {
        alert('Il titolo è obbligatorio');
        setFormLoading(false);
        return;
      }
      if (!formData.category.trim()) {
        alert('La categoria è obbligatoria');
        setFormLoading(false);
        return;
      }
      if (!formData.closing_date) {
        alert('La data di chiusura prediction è obbligatoria');
        setFormLoading(false);
        return;
      }
      if (!formData.closing_bid) {
        alert('La data di chiusura scommesse è obbligatoria');
        setFormLoading(false);
        return;
      }

      // Validazione userAddress
      if (!userAddress) {
        throw new Error('Wallet address non disponibile. Assicurati di essere connesso.');
      }

      const predictionData = {
        ...formData,
        closing_date: new Date(formData.closing_date).toISOString(),
        closing_bid: new Date(formData.closing_bid).toISOString()
      };

      // Log per debug
      console.log('Creating prediction from Polymarket with data:', {
        title: predictionData.title,
        description: predictionData.description,
        category: predictionData.category,
        closing_date: predictionData.closing_date,
        closing_bid: predictionData.closing_bid,
        status: predictionData.status,
        rules: predictionData.rules,
        admin_wallet_address: userAddress,
        image_url: predictionData.image_url
      });

      // Crea nuova prediction usando RPC
      const { data: newPredictionId, error } = await supabase.rpc('create_prediction_admin', {
        title: predictionData.title,
        description: predictionData.description || '',
        category: predictionData.category,
        closing_date: predictionData.closing_date,
        closing_bid: predictionData.closing_bid,
        status: predictionData.status,
        rules: predictionData.rules || '',
        admin_wallet_address: userAddress,
        image_url: predictionData.image_url || null
      });

      if (error) {
        console.error('RPC Error details:', error);
        throw error;
      }
      
      alert('Prediction creata con successo!');

      // Reset form e chiudi
      setFormData({
        title: '',
        description: '',
        category: '',
        closing_date: '',
        closing_bid: '',
        status: 'in_attesa',
        rules: '',
        image_url: '',
        notes: ''
      });
      setShowMarketForm(false);
      setSelectedMarket(null);
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Errore nel salvataggio della prediction: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setFormLoading(false);
    }
  };

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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarketCardClick(market);
                      }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
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

              {/* Form per creare prediction */}
              {showMarketForm && selectedMarket && (
                <div id="polymarket-prediction-form" className="p-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Crea Prediction da Polymarket
                      </h2>
                      <button
                        onClick={handleCancelForm}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        type="button"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <form onSubmit={handleMarketFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Titolo *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Titolo della prediction"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Categoria *
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          >
                            <option value="">Seleziona categoria</option>
                            <option value="Sport">Sport</option>
                            <option value="Politica">Politica</option>
                            <option value="Degen">Degen</option>
                            <option value="Crypto">Crypto</option>
                            <option value="Intrattenimento">Intrattenimento</option>
                            <option value="Economia">Economia</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descrizione *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={4}
                          placeholder="Descrivi la prediction in dettaglio..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Chiusura Scommesse *
                          </label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={formData.closing_date}
                              onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
                              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              required
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                const input = e.currentTarget.parentElement?.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                                if (input) {
                                  input.showPicker?.();
                                }
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Fino a quando si può scommettere
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Chiusura Prediction *
                          </label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={formData.closing_bid}
                              onChange={(e) => setFormData({...formData, closing_bid: e.target.value})}
                              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                              required
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                const input = e.currentTarget.parentElement?.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                                if (input) {
                                  input.showPicker?.();
                                }
                              }}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Quando finisce l'evento della prediction
                          </p>
                        </div>
                      </div>

                      {/* Upload immagine */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Immagine Prediction
                        </label>
                        <ImageUpload
                          onImageUploaded={(imageUrl) => setFormData({...formData, image_url: imageUrl})}
                          currentImageUrl={formData.image_url}
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Stato
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta'})}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="in_attesa">In Attesa</option>
                            <option value="attiva">Attiva</option>
                            <option value="in_pausa">In Pausa</option>
                            <option value="risolta">Risolta</option>
                            <option value="cancellata">Cancellata</option>
                            <option value="nascosta">Nascosta</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Regolamento
                        </label>
                        <textarea
                          value={formData.rules}
                          onChange={(e) => setFormData({...formData, rules: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Inserisci le regole specifiche per questa prediction..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Note e Aggiornamenti
                        </label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Inserisci note e aggiornamenti per questa prediction..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2"
                        >
                          {formLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          {formLoading ? 'Salvataggio...' : 'Crea Prediction'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleCancelForm}
                          disabled={formLoading}
                          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Annulla
                        </button>
                      </div>
                    </form>
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

