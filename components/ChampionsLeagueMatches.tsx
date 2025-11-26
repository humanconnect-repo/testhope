"use client";
import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';

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

export default function ChampionsLeagueMatches() {
  const { userAddress } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 9;
  
  // Stati per il form
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
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

  // Carica i match solo quando si apre il menu
  useEffect(() => {
    // Se il menu è chiuso, resetta i match
    if (!isExpanded) {
      setMatches([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Se il menu è aperto e i match sono già stati caricati, non fare nulla
    if (matches.length > 0) {
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Champions League: competition=2001, days=10 (limite API)
        const response = await fetch('/api/football/matches?competition=2001&days=10');
        
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
  }, [isExpanded]);

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

  // Funzione per formattare la data in formato italiano (giorno mese anno)
  const formatDateItalian = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Rome',
      };
      return date.toLocaleDateString('it-IT', options);
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

  // Funzione per convertire UTC date in formato datetime-local (in orario italiano)
  const formatDateTimeLocal = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      
      // Crea una nuova data convertita in orario italiano
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

  // Funzione per aggiungere 3 ore a una data UTC
  const addThreeHours = (utcDate: string): string => {
    try {
      const date = new Date(utcDate);
      // Aggiungi 3 ore in millisecondi
      const threeHoursLater = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      
      // Converti in orario italiano usando lo stesso metodo
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(threeHoursLater);
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

  // Handler per click su card match
  const handleMatchCardClick = (match: Match) => {
    setSelectedMatch(match);
    
    // Pre-compila titolo: (homeTeam) vs (awayTeam) - (data formattata)
    const formattedDate = formatDateItalian(match.utcDate);
    const title = `${match.homeTeam.name} vs ${match.awayTeam.name} - ${formattedDate}`;
    
    // Pre-compila descrizione: La (homeTeam) vincerà questa partita di (Champions League) del (data formattata)?
    const competitionName = getCompetitionName(match.competition.code);
    const description = `La ${match.homeTeam.name} vincerà questa partita di ${competitionName} del ${formattedDate}?`;
    
    // Pre-compila date: closing_date = data partita, closing_bid = data partita + 3 ore
    const closingDate = formatDateTimeLocal(match.utcDate);
    const closingBid = addThreeHours(match.utcDate);
    
    // Pre-compila regolamento con nome squadra
    const rules = `L'esito sarà "Sì" se la ${match.homeTeam.name} risulterà vincitore ufficiale dell'incontro secondo i dati pubblicati dalla UEFA Champions League o altre fonti sportive autorevoli. L'esito sarà "No" in caso di pareggio o sconfitta. In caso di rinvio, sospensione o annullamento dell'incontro la prediction sarà rimborsata.`;
    
    // Imposta i dati del form
    setFormData({
      title,
      description,
      category: 'Sport', // Pre-seleziona Sport
      closing_date: closingDate,
      closing_bid: closingBid,
      status: 'in_attesa',
      rules: rules,
      image_url: '',
      notes: ''
    });
    
    // Apri il form
    setShowMatchForm(true);
    
    // Scroll al form dopo un breve delay per permettere il rendering
    setTimeout(() => {
      const formElement = document.getElementById('champions-match-prediction-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handler per annullare il form
  const handleCancelForm = () => {
    setShowMatchForm(false);
    setSelectedMatch(null);
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
  const handleMatchFormSubmit = async (e: React.FormEvent) => {
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
      console.log('Creating prediction with data:', {
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
      setShowMatchForm(false);
      setSelectedMatch(null);
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
            Crea una Prediction di Champions L. {matches.length > 0 && `(${matches.length} match)`}
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
              Nessun match programmato per i prossimi 10 giorni
            </div>
          ) : (
            <>
              {/* Grid di cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMatches.map((match) => (
                    <div 
                      key={match.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMatchCardClick(match);
                      }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
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

              {/* Form per creare prediction */}
              {showMatchForm && selectedMatch && (
                <div id="champions-match-prediction-form" className="p-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Crea Prediction per {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
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
                    
                    <form onSubmit={handleMatchFormSubmit} className="space-y-6">
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
                            placeholder="Es: Il Napoli vincerà lo scudetto?"
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

