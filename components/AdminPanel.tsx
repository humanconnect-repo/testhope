"use client";
import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useContracts } from '../hooks/useContracts';
import { supabase } from '../lib/supabase';
import { isBettingCurrentlyOpen, getEmergencyStopStatus, isPoolCancelled, isPoolClosed } from '../lib/contracts';
import Link from 'next/link';
import TransactionProgressModal, { TransactionStep } from './TransactionProgressModal';
import AdminProgressModal, { AdminStep } from './AdminProgressModal';
import ImageUpload from './ImageUpload';

interface Prediction {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta';
  rules: string;
  image_url?: string;
  pool_address?: string; // Indirizzo del contratto smart contract
  notes?: string;
  created_at: string;
  updated_at: string;
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

export default function AdminPanel() {
  const { isAdmin, loading, error, userAddress } = useAdmin();
  const { 
    isFactoryOwner, 
    pools, 
    loading: contractsLoading, 
    error: contractsError,
    createNewPool,
    handleClosePool,
    handleReopenPool,
    resolvePrediction,
    stopBetting,
    resumeBetting,
    emergencyResolvePrediction,
    cancelPoolPrediction,
    recoverPoolFunds,
    claimRefundForPool,
    formatItalianTime,
    isBettingOpen,
    isPredictionEnded
  } = useContracts();

  // Stato per le percentuali basate sul numero di scommesse
  const [betCountPercentages, setBetCountPercentages] = useState<Record<string, {yes: number, no: number}>>({});
  
  // Funzione per recuperare le percentuali basate sul numero di scommesse
  const loadBetCountPercentages = async () => {
    if (pools.length === 0) return;
    
    try {
      const percentages: Record<string, {yes: number, no: number}> = {};
      
      // Trova solo le pool che hanno prediction nel database
      const poolAddresses = pools.map(pool => pool.address);
      const { data: predictions } = await supabase
        .from('predictions')
        .select('id, pool_address')
        .in('pool_address', poolAddresses);
      
      if (predictions && predictions.length > 0) {
        // Crea una mappa delle pool con prediction
        const poolToPrediction = new Map();
        predictions.forEach((prediction: any) => {
          poolToPrediction.set(prediction.pool_address, prediction.id);
        });
        
        // Processa solo le pool che hanno prediction nel database
        for (const pool of pools) {
          const predictionId = poolToPrediction.get(pool.address);
          if (predictionId) {
            // Recupera le scommesse per questa prediction
            const { data: bets } = await supabase
              .from('bets')
              .select('position')
              .eq('prediction_id', predictionId);
            
            if (bets && bets.length > 0) {
              const yesCount = bets.filter((bet: any) => bet.position === 'yes').length;
              const noCount = bets.filter((bet: any) => bet.position === 'no').length;
              const totalCount = yesCount + noCount;
              
              if (totalCount > 0) {
                percentages[pool.address] = {
                  yes: (yesCount / totalCount) * 100,
                  no: (noCount / totalCount) * 100
                };
              }
            }
          }
        }
      }
      
      setBetCountPercentages(percentages);
    } catch (error) {
      console.error('Errore caricamento percentuali bet count:', error);
    }
  };

  // Carica le percentuali quando le pool cambiano
  useEffect(() => {
    if (pools.length > 0) {
      loadBetCountPercentages();
    }
  }, [pools]);

  // Funzione per capitalizzare la prima lettera e formattare per frontend
  const capitalizeFirst = (str: string) => {
    if (str === 'in_attesa') return 'In attesa';
    if (str === 'in_pausa') return 'In pausa';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Inizializza i passi della transazione
  const initializeTransactionSteps = (): TransactionStep[] => [
    {
      id: 'prepare',
      title: 'Preparazione Transazione',
      description: 'Conversione date e preparazione parametri...',
      status: 'pending'
    },
    {
      id: 'wallet',
      title: 'Invio al Wallet',
      description: 'Invio transazione al wallet per firma...',
      status: 'pending'
    },
    {
      id: 'blockchain',
      title: 'Conferma Blockchain',
      description: 'Attesa conferma sulla BSC Testnet...',
      status: 'pending'
    },
    {
      id: 'database',
      title: 'Aggiornamento Database',
      description: 'Salvataggio indirizzo contratto...',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Completato',
      description: 'Contract attivato con successo!',
      status: 'pending'
    }
  ];

  // Aggiorna lo stato di un passo
  const updateStepStatus = (stepId: string, status: TransactionStep['status'], error?: string) => {
    setTransactionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, error }
        : step
    ));
  };

  // Protezione aggiuntiva: se non è admin, non mostra nulla
  // Aggiungi un delay per evitare controlli prematuri durante il refresh
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
  if (!loading && !isAdmin) {
        setShowAccessDenied(true);
      }
    }, 3000); // 3 secondi di delay per dare tempo all'autenticazione
    
    return () => clearTimeout(timeoutId);
  }, [loading, isAdmin]);
  
  if (showAccessDenied) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Accesso Negato
          </h2>
          <p className="text-red-600 dark:text-red-300">
            Non hai i permessi per accedere a questa sezione.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Debug: loading={loading.toString()}, isAdmin={isAdmin.toString()}
          </p>
        </div>
      </div>
    );
  }
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [contractStates, setContractStates] = useState<Record<string, { isOpen: boolean; emergencyStop: boolean; cancelled: boolean; isClosed: boolean }>>({});
  const [formData, setFormData] = useState<PredictionFormData>({
    title: '',
    description: '',
    category: '',
    closing_date: '',
    closing_bid: '',
    status: 'in_attesa',
    rules: '',
    image_url: ''
  });

  // Stati per il modal di transazione
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionSteps, setTransactionSteps] = useState<TransactionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [transactionError, setTransactionError] = useState<string>('');
  const [showBSCScanModal, setShowBSCScanModal] = useState<boolean>(false);
  const [generatedContractCode, setGeneratedContractCode] = useState<string>('');
  const [expandedPools, setExpandedPools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visiblePoolsCount, setVisiblePoolsCount] = useState(5);
  const [predictionsSearchQuery, setPredictionsSearchQuery] = useState<string>('');
  const [visiblePredictionsCount, setVisiblePredictionsCount] = useState(5);

  // Chiudi menu a tendina quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setExpandedPools(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset contatore quando cambia la ricerca
  useEffect(() => {
    setVisiblePoolsCount(5);
  }, [searchQuery]);

  // Reset contatore predictions quando cambia la ricerca
  useEffect(() => {
    setVisiblePredictionsCount(5);
  }, [predictionsSearchQuery]);

  // Filtra le predictions per titolo
  const filteredPredictions = predictions.filter(prediction => {
    // Escludi quelle nascoste dal DB
    if (prediction.status === 'nascosta') return false;
    if (!predictionsSearchQuery.trim()) return true;
    return prediction.title.toLowerCase().includes(predictionsSearchQuery.toLowerCase());
  });

  // Mostra solo le prime N predictions
  const visiblePredictions = filteredPredictions.slice(0, visiblePredictionsCount);
  const hasMorePredictions = filteredPredictions.length > visiblePredictionsCount;

  // Funzione per caricare altre predictions
  const loadMorePredictions = () => {
    setVisiblePredictionsCount(prev => prev + 5);
  };

  // Stati per il modal admin (Stop/Resume Betting)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSteps, setAdminSteps] = useState<AdminStep[]>([]);
  const [adminCurrentStep, setAdminCurrentStep] = useState(0);
  const [adminTransactionHash, setAdminTransactionHash] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [adminOperationType, setAdminOperationType] = useState<'stop' | 'resume' | 'cancel' | 'close' | 'resolve_yes' | 'resolve_no' | 'reopen' | 'recover'>('stop');
  const [adminPoolAddress, setAdminPoolAddress] = useState<string>('');

  // Stato per i log delle funzioni admin
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminLogsLoading, setAdminLogsLoading] = useState(false);
  const [adminLogsOffset, setAdminLogsOffset] = useState(0);
  const [adminLogsHasMore, setAdminLogsHasMore] = useState(false);
  const [adminLogsTotalCount, setAdminLogsTotalCount] = useState(0);
  const LOGS_PER_PAGE = 5;

  // Stato per le predictions espanse nell'accordion
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set());

  // Carica le prediction esistenti
  useEffect(() => {
    if (isAdmin) {
      loadPredictions();
      loadAdminLogs(true);
    }
  }, [isAdmin]);

  // Carica gli stati dei contratti per le predictions con pool_address
  useEffect(() => {
    const loadContractStates = async () => {
      const predictionsWithPool = predictions.filter(p => p.pool_address);
      
      for (const prediction of predictionsWithPool) {
        try {
          const [isOpen, emergencyStop, cancelled, isClosed] = await Promise.all([
            isBettingCurrentlyOpen(prediction.pool_address!),
            getEmergencyStopStatus(prediction.pool_address!),
            isPoolCancelled(prediction.pool_address!),
            isPoolClosed(prediction.pool_address!)
          ]);
          
          setContractStates(prev => ({
            ...prev,
            [prediction.pool_address!]: { isOpen, emergencyStop, cancelled, isClosed }
          }));
        } catch (error) {
          console.warn(`Errore caricamento stato contratto ${prediction.pool_address}:`, error);
        }
      }
    };

    if (predictions.length > 0) {
      loadContractStates();
      
      // Polling ogni 30 secondi
      const interval = setInterval(loadContractStates, 30000);
      return () => clearInterval(interval);
    }
  }, [predictions]);

  // Funzione helper per determinare lo status del container betting
  // Funzione helper per ottenere lo stato del badge basato su contratto + database
  const getPredictionBadgeStatus = (prediction: Prediction): { text: string; emoji: string; bgColor: string } => {
    // Prima controlla se la prediction è nascosta nel database (priorità massima)
    if (prediction.status === 'nascosta') {
      return {
        text: 'NASCOSTA',
        emoji: '🔘',
        bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      };
    }
    
    // Controlla se la prediction è risolta nel database
    if (prediction.status === 'risolta') {
      return {
        text: 'RISOLTA',
        emoji: '🏆',
        bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      };
    }
    
    // Se abbiamo dati del contratto, usa quelli come priorità
    if (prediction.pool_address && contractStates[prediction.pool_address]) {
      const contractState = contractStates[prediction.pool_address];
      
      // Prima controlla se la pool è cancellata
      if (contractState.cancelled) {
        return {
          text: 'CANCELLATA',
          emoji: '🔴',
          bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };
      } else if (contractState.isClosed) {
        return {
          text: 'CHIUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      } else if (contractState.emergencyStop) {
        return {
          text: 'CHIUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      } else if (contractState.isOpen) {
        return {
          text: 'ATTIVA',
          emoji: '🟢',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
      } else {
        // Contratto chiuso ma non in emergency stop -> CHIUSA
        const now = Math.floor(Date.now() / 1000);
        const closingBid = Math.floor(new Date(prediction.closing_bid).getTime() / 1000);
        
        if (now < closingBid) {
          return {
            text: 'CHIUSA',
            emoji: '🟡',
            bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        } else {
          return {
            text: 'RISOLTA',
            emoji: '🏆',
            bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          };
        }
      }
    }

    // Fallback al database
    const status = prediction.status as 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata';
    switch (status) {
      case 'in_attesa':
        return {
          text: 'IN ATTESA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      case 'attiva':
        return {
          text: 'ATTIVA',
          emoji: '🟢',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
      case 'in_pausa':
        return {
          text: 'IN PAUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      case 'risolta':
        return {
          text: 'RISOLTA',
          emoji: '🏆',
          bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        };
      case 'cancellata':
        return {
          text: 'CANCELLATA',
          emoji: '🔴',
          bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };
      default:
        return {
          text: 'ATTIVA',
          emoji: '🟢',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
    }
  };

  // Funzione helper per ottenere lo stato della pool basato sul contratto
  const getPoolBadgeStatus = (pool: any) => {
    // Prima controlla se c'è una prediction corrispondente nel database per vedere se è risolta
    const correspondingPrediction = predictions.find(prediction => 
      prediction.pool_address === pool.address
    );
    
    if (correspondingPrediction && correspondingPrediction.status === 'risolta') {
      return {
        text: 'RISOLTA',
        emoji: '🏆',
        bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      };
    }
    
    // Se abbiamo dati del contratto per questa pool, usa quelli
    if (contractStates[pool.address]) {
      const contractState = contractStates[pool.address];
      
      // Prima controlla se la pool è cancellata
      if (contractState.cancelled) {
        return {
          text: 'CANCELLATA',
          emoji: '🔴',
          bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };
      } else if (contractState.isClosed) {
        return {
          text: 'CHIUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      } else if (contractState.emergencyStop) {
        return {
          text: 'CHIUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      } else if (contractState.isOpen) {
        return {
          text: 'ATTIVA',
          emoji: '🟢',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
      } else {
        // Contratto chiuso ma non in emergency stop -> CHIUSA
        const now = Math.floor(Date.now() / 1000);
        
        if (now < pool.closingBid) {
          return {
            text: 'CHIUSA',
            emoji: '🟡',
            bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        } else {
          return {
            text: 'RISOLTA',
            emoji: '🏆',
            bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          };
        }
      }
    }

    // Fallback: usa la correspondingPrediction già trovata all'inizio
    if (correspondingPrediction) {
      if (correspondingPrediction.status === 'cancellata') {
        return {
          text: 'CANCELLATA',
          emoji: '🔴',
          bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };
      } else if (correspondingPrediction.status === 'attiva') {
        return {
          text: 'ATTIVA',
          emoji: '🟢',
          bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
      } else if (correspondingPrediction.status === 'in_pausa') {
        return {
          text: 'IN PAUSA',
          emoji: '🟡',
          bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        };
      }
    }
    
    return {
      text: 'ORFANA',
      emoji: '🔴',
      bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
  };

  const getBettingContainerStatus = (pool: any, prediction: any) => {
    const now = Math.floor(Date.now() / 1000);
    const closingDate = pool.closingDate;
    const closingBid = pool.closingBid;
    
    // Prima controlla il status del database
    switch (prediction?.status) {
      case 'in_pausa':
        return {
          type: 'closed_waiting',
          message: 'Pool chiusa - In attesa risultati',
          status: 'Predictions chiuse - In attesa risultati'
        };
      
      case 'risolta':
        return {
          type: 'resolved',
          message: 'Pool finita - Risultati disponibili',
          status: 'Prediction risolta'
        };
      
      case 'cancellata':
        return {
          type: 'cancelled',
          message: 'Prediction cancellata - Attendi info in questa pagina',
          status: 'Prediction cancellata'
        };
      
      case 'attiva':
        // Se status è attiva, controlla il range temporale
        if (now < closingDate) {
          return {
            type: 'open',
            message: 'Fai la tua prediction',
            status: 'Predictions aperte'
          };
        } else if (now >= closingDate && now < closingBid) {
          return {
            type: 'closed_waiting',
            message: 'Non puoi più scommettere, attendi la scadenza della prediction',
            status: 'Predictions chiuse - In attesa risultati'
          };
        } else {
          return {
            type: 'ended',
            message: 'In attesa dei risultati',
            status: 'Prediction terminata'
          };
        }
      
      default:
        return {
          type: 'unknown',
          message: 'Status sconosciuto',
          status: 'Status sconosciuto'
        };
    }
  };

  // Filtra i pool per mostrare solo quelli attivi/pausa/risolte/cancellate e applica la ricerca
  const filteredPools = pools.filter(pool => {
    // Mostra pool che hanno una prediction attiva, in pausa, risolta o cancellata
    const hasActivePrediction = predictions.some(prediction => 
      prediction.pool_address === pool.address && 
      (prediction.status === 'attiva' || prediction.status === 'in_pausa' || prediction.status === 'risolta' || prediction.status === 'cancellata')
    );
    
    if (!hasActivePrediction) return false;
    
    // Applica la ricerca se c'è una query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const prediction = predictions.find(p => p.pool_address === pool.address);
      
      if (!prediction) return false;
      
      return prediction.title.toLowerCase().includes(query);
    }
    
    return true;
  }).sort((a, b) => {
    // Ordina per closing_date crescente (le più vicine alla scadenza prima)
    const dateA = new Date(a.closingDate);
    const dateB = new Date(b.closingDate);
    return dateA.getTime() - dateB.getTime();
  });

  // Mostra solo le prime N pool
  const visiblePools = filteredPools.slice(0, visiblePoolsCount);
  const hasMorePools = filteredPools.length > visiblePoolsCount;

  // Funzione per caricare altre pool
  const loadMorePools = () => {
    setVisiblePoolsCount(prev => prev + 5);
  };
  

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('id, title, description, slug, category, closing_date, closing_bid, status, rules, image_url, pool_address, notes, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const loadAdminLogs = async (reset: boolean = false) => {
    setAdminLogsLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('logadminfunction')
        .select('*', { count: 'exact', head: true });

      const totalCount = count || 0;
      setAdminLogsTotalCount(totalCount);

      // Reset offset if this is a reset call
      if (reset) {
        setAdminLogsOffset(0);
      }
      
      // Calculate how many logs to fetch
      const logsToFetch = LOGS_PER_PAGE;
      
      // Fetch logs from 0 to logsToFetch - 1 (always start from the beginning)
      const { data, error } = await supabase
        .from('logadminfunction')
        .select('id, action_type, tx_hash, pool_address, prediction_id, admin_address, created_at, additional_data')
        .order('created_at', { ascending: false })
        .range(0, logsToFetch - 1);

      if (error) throw error;
      
      setAdminLogs(data || []);
      setAdminLogsOffset(logsToFetch);
      
      // Check if there are more logs to load
      setAdminLogsHasMore(logsToFetch < totalCount);
    } catch (error) {
      console.error('Error loading admin logs:', error);
    } finally {
      setAdminLogsLoading(false);
    }
  };

  const loadMoreAdminLogs = async () => {
    setAdminLogsLoading(true);
    try {
      const { count } = await supabase
        .from('logadminfunction')
        .select('*', { count: 'exact', head: true });

      const totalCount = count || 0;
      
      // Calculate how many more logs to load
      const currentCount = adminLogs.length;
      const logsToFetch = currentCount + LOGS_PER_PAGE;
      
      const { data, error } = await supabase
        .from('logadminfunction')
        .select('id, action_type, tx_hash, pool_address, prediction_id, admin_address, created_at, additional_data')
        .order('created_at', { ascending: false })
        .range(0, logsToFetch - 1);

      if (error) throw error;
      
      setAdminLogs(data || []);
      setAdminLogsOffset(logsToFetch);
      setAdminLogsHasMore(logsToFetch < totalCount);
    } catch (error) {
      console.error('Error loading more admin logs:', error);
    } finally {
      setAdminLogsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validazione dei dati
      if (!formData.title.trim()) {
        alert('Il titolo è obbligatorio');
        return;
      }
      if (!formData.category.trim()) {
        alert('La categoria è obbligatoria');
        return;
      }
      if (!formData.closing_date) {
        alert('La data di chiusura prediction è obbligatoria');
        return;
      }
      if (!formData.closing_bid) {
        alert('La data di chiusura scommesse è obbligatoria');
        return;
      }

      const predictionData = {
        ...formData,
        closing_date: new Date(formData.closing_date).toISOString(),
        closing_bid: new Date(formData.closing_bid).toISOString()
      };

        if (editingPrediction) {
        
        // Prima verifichiamo che la prediction esista
        const { data: existingPrediction, error: checkError } = await supabase
          .from('predictions')
          .select('id, title')
          .eq('id', editingPrediction.id);

        if (checkError) {
          throw checkError;
        }

        if (!existingPrediction || existingPrediction.length === 0) {
          throw new Error('Prediction non trovata nel database');
        }
        
        // Usa direttamente RPC function (UPDATE diretto bloccato da RLS)
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_prediction_admin', {
            prediction_id: editingPrediction.id,
            title: predictionData.title,
            description: predictionData.description,
            category: predictionData.category,
            closing_date: predictionData.closing_date,
            closing_bid: predictionData.closing_bid,
            status: predictionData.status,
            rules: predictionData.rules,
            image_url: predictionData.image_url,
            notes: predictionData.notes
          });

        if (rpcError) {
          throw rpcError;
        }

        if (!rpcData) {
          throw new Error('La prediction non è stata trovata o non è stata aggiornata');
        }

        alert('Prediction aggiornata con successo!');
      } else {
        // Validazione userAddress
        if (!userAddress) {
          throw new Error('Wallet address non disponibile. Assicurati di essere connesso.');
        }

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
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        closing_date: '',
        closing_bid: '',
        status: 'attiva',
        rules: '',
        image_url: ''
      });
      setShowForm(false);
      setEditingPrediction(null);
      loadPredictions();
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Errore nel salvataggio della prediction');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (prediction: Prediction) => {
    setEditingPrediction(prediction);
    setFormData({
      title: prediction.title,
      description: prediction.description || '',
      category: prediction.category,
      closing_date: new Date(prediction.closing_date).toISOString().slice(0, 16),
      closing_bid: prediction.closing_bid ? new Date(prediction.closing_bid).toISOString().slice(0, 16) : '',
      status: prediction.status,
      rules: prediction.rules || '',
      image_url: prediction.image_url || '',
      notes: prediction.notes || ''
    });
    // Non aprire il form generale, solo quello inline
  };

  const togglePredictionExpansion = (predictionId: string) => {
    setExpandedPredictions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(predictionId)) {
        newSet.delete(predictionId);
      } else {
        newSet.add(predictionId);
      }
      return newSet;
    });
  };

  const togglePoolExpansion = (poolAddress: string) => {
    setExpandedPools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poolAddress)) {
        newSet.delete(poolAddress);
      } else {
        newSet.add(poolAddress);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa prediction?')) return;

    try {
      // Usa la funzione RPC per eliminare (solo admin)
      const { data, error } = await supabase.rpc('delete_prediction_admin', {
        prediction_id: id,
        admin_wallet_address: userAddress
      });

      if (error) {
        console.error('❌ Errore RPC:', error);
        throw error;
      }

      if (!data) {
        throw new Error('La prediction non è stata trovata o non è stata eliminata');
      }

      alert('Prediction eliminata con successo!');
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Errore nell\'eliminazione della prediction: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  // Funzione per gestire Stop Betting con modal
  const handleStopBetting = async (poolAddress: string) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType('stop');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per fermare le scommesse...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Stop betting completato con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 100));
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'loading' } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Passo 1: Completato, Passo 2: Chiamata alla funzione stopBetting
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'completed' } :
        step.id === 'sign' ? { ...step, status: 'loading' } : step
      ));
      
      const txHash = await stopBetting(poolAddress);
      
      // Passo 2: Completato, Passo 3: Transazione confermata
      setAdminTransactionHash(txHash);
      setAdminSteps(prev => prev.map(step => 
        step.id === 'sign' ? { ...step, status: 'completed' } : 
        step.id === 'confirm' ? { ...step, status: 'loading' } : step
      ));
      
      // Simula attesa conferma (in realtà stopBetting già aspetta la conferma)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passo 3: Completato, Passo 4: Completato
      setAdminSteps(prev => prev.map(step => 
        step.id === 'confirm' ? { ...step, status: 'completed' } :
        step.id === 'complete' ? { ...step, status: 'completed' } : step
      ));
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'stop_betting', txHash, poolAddress, adminAddress: userAddress });
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'stop_betting',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: {}
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "In Pausa"
        const { data: rpcData, error: updateError } = await supabase
          .rpc('update_prediction_status', {
            prediction_id_param: predictionData.id,
            new_status: 'in_pausa'
          });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "In Pausa"', rpcData);
        }
      } else {
        console.warn('Nessuna prediction trovata per pool_address:', poolAddress);
      }
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
    } catch (error: any) {
      console.error('Errore stop betting:', error);
      setAdminError(error.message || 'Errore durante lo stop betting');
      
      // Marca solo il passo corrente come errore (senza aggiungere il messaggio di errore nello step)
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Cancel Pool con modal
  const handleCancelPool = async (poolAddress: string) => {
    const reason = 'Cancelled by admin'; // Motivo fisso, senza prompt
    
    try {
      // Imposta i dati per il modal
      setAdminOperationType('cancel'); // Usa il tipo cancel
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi (senza salvataggio note)
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per cancellare il pool...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Pool cancellato con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminSteps(prev => prev.map(step => step.id === 'prepare' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(1);
      
      // Passo 2: Chiama la funzione cancel pool
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'loading' } : step));
      
      // Restituisce txHash (string), non oggetto transazione
      const txHash = await cancelPoolPrediction(poolAddress, reason);
      
      setAdminSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(2);
      setAdminTransactionHash(txHash);
      
      // Passo 3: Attendi conferma
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAdminSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'loading' } : step));
      
      // Non serve aspettare tx.wait() perché resolvePrediction già fa il wait
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdminSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(3);
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'cancel_pool', txHash, poolAddress, adminAddress: userAddress });
        
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'cancel_pool',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: { reason: reason }
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "Cancellata"
        const { data: rpcData, error: updateError } = await supabase
          .rpc('update_prediction_status', {
            prediction_id_param: predictionData.id,
            new_status: 'cancellata'
          });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "Cancellata"', rpcData);
        }
      } else {
        console.warn('Nessuna prediction trovata per pool_address:', poolAddress);
      }
      
      // Passo 4: Completato
      setAdminSteps(prev => prev.map(step => step.id === 'complete' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(steps.length);
      
    } catch (error: any) {
      console.error('Errore cancellazione pool:', error);
      setAdminError(`Log funzione Cancel Pool: ${error.message || 'Errore durante la cancellazione del pool'}`);
      
      // Marca solo il passo corrente come errore
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Recover Funds per pool risolte/cancellate
  const handleRecoverFunds = async (poolAddress: string) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType('recover');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione del recupero dei fondi residui...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Fondi recuperati con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminSteps(prev => prev.map(step => step.id === 'prepare' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(1);
      
      // Passo 2: Chiama la funzione recoverPoolFunds
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'loading' } : step));
      
      const txHash = await recoverPoolFunds(poolAddress);
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'recover_funds', txHash, poolAddress, adminAddress: userAddress });
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'recover_funds',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: {}
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
      }
      
      setAdminSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(2);
      setAdminTransactionHash(txHash);
      
      // Passo 3: Attendi conferma
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAdminSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(3);
      
      // Passo 4: Completato
      setAdminSteps(prev => prev.map(step => step.id === 'complete' ? { ...step, status: 'completed' } : step));
      setAdminCurrentStep(steps.length);
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
    } catch (error: any) {
      console.error('Errore recupero fondi:', error);
      setAdminError(error.message || 'Errore durante il recupero fondi');
      
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Resume Betting con modal
  const handleResumeBetting = async (poolAddress: string) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType('resume');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per riprendere le scommesse...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Resume betting completato con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 100));
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'loading' } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Passo 1: Completato, Passo 2: Chiamata alla funzione resumeBetting
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'completed' } :
        step.id === 'sign' ? { ...step, status: 'loading' } : step
      ));
      
      const txHash = await resumeBetting(poolAddress);
      
      // Passo 2: Completato, Passo 3: Transazione confermata
      setAdminTransactionHash(txHash);
      setAdminSteps(prev => prev.map(step => 
        step.id === 'sign' ? { ...step, status: 'completed' } : 
        step.id === 'confirm' ? { ...step, status: 'loading' } : step
      ));
      
      // Simula attesa conferma (in realtà resumeBetting già aspetta la conferma)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passo 3: Completato, Passo 4: Completato
      setAdminSteps(prev => prev.map(step => 
        step.id === 'confirm' ? { ...step, status: 'completed' } :
        step.id === 'complete' ? { ...step, status: 'completed' } : step
      ));
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'resume_betting', txHash, poolAddress, adminAddress: userAddress });
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'resume_betting',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: {}
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "Attiva"
        const { data: rpcData, error: updateError } = await supabase
          .rpc('update_prediction_status', {
            prediction_id_param: predictionData.id,
            new_status: 'attiva'
          });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "Attiva"', rpcData);
        }
      } else {
        console.warn('Nessuna prediction trovata per pool_address:', poolAddress);
      }
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
    } catch (error: any) {
      console.error('Errore resume betting:', error);
      setAdminError(error.message || 'Errore durante il resume betting');
      
      // Marca solo il passo corrente come errore (senza aggiungere il messaggio di errore nello step)
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Resolve Prediction con modal
  const handleResolvePrediction = async (poolAddress: string, winnerYes: boolean) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType(winnerYes ? 'resolve_yes' : 'resolve_no');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per risolvere la prediction...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'database',
          title: 'Aggiornamento database',
          description: 'Aggiornamento dello status nel database...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Prediction risolta con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 100));
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'loading' } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Passo 1: Completato, Passo 2: Chiamata alla funzione resolvePrediction
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'completed' } :
        step.id === 'sign' ? { ...step, status: 'loading' } : step
      ));
      
      const txHash = await resolvePrediction(poolAddress, winnerYes);
      
      // Passo 2: Completato, Passo 3: Transazione confermata
      setAdminTransactionHash(txHash);
      setAdminSteps(prev => prev.map(step => 
        step.id === 'sign' ? { ...step, status: 'completed' } : 
        step.id === 'confirm' ? { ...step, status: 'loading' } : step
      ));
      
      // Simula attesa conferma (in realtà resolvePrediction già aspetta la conferma)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passo 3: Completato, Passo 4: Database
      setAdminSteps(prev => prev.map(step => 
        step.id === 'confirm' ? { ...step, status: 'completed' } :
        step.id === 'database' ? { ...step, status: 'loading' } : step
      ));
      
      // Lo status viene aggiornato già dalla funzione resolvePrediction, aspettiamo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Salva il log dell'azione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { 
          action: winnerYes ? 'resolve_yes' : 'resolve_no', 
          txHash, 
          poolAddress, 
          adminAddress: userAddress 
        });
        
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: winnerYes ? 'resolve_yes' : 'resolve_no',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: { winner: winnerYes }
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
      } else {
        console.warn('Nessuna prediction trovata per pool_address:', poolAddress);
      }
      
      // Passo 4: Database completato, Passo 5: Completato
      setAdminSteps(prev => prev.map(step => 
        step.id === 'database' ? { ...step, status: 'completed' } :
        step.id === 'complete' ? { ...step, status: 'completed' } : step
      ));
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
    } catch (error) {
      console.error('Errore nella risoluzione della prediction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setAdminError(errorMessage);
      
      // Marca solo il passo corrente come errore
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Reopen Pool con modal
  const executeReopenPool = async (poolAddress: string) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType('reopen');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per riaprire il pool...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Pool riaperto con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 100));
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'loading' } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Passo 1: Completato, Passo 2: Chiamata alla funzione reopenPool
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'completed' } :
        step.id === 'sign' ? { ...step, status: 'loading' } : step
      ));
      
      const txHash = await handleReopenPool(poolAddress);
      
      // Passo 2: Completato, Passo 3: Transazione confermata
      setAdminTransactionHash(txHash);
      setAdminSteps(prev => prev.map(step => 
        step.id === 'sign' ? { ...step, status: 'completed' } : 
        step.id === 'confirm' ? { ...step, status: 'loading' } : step
      ));
      
      // Simula attesa conferma
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passo 3: Completato, Passo 4: Completato
      setAdminSteps(prev => prev.map(step => 
        step.id === 'confirm' ? { ...step, status: 'completed' } :
        step.id === 'complete' ? { ...step, status: 'completed' } : step
      ));
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'reopen_pool', txHash, poolAddress, adminAddress: userAddress });
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'reopen_pool',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: {}
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "Attiva"
        const { data: rpcData, error: updateError } = await supabase.rpc('update_prediction_status', {
          prediction_id_param: predictionData.id,
          new_status: 'attiva'
        });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "Attiva"', rpcData);
        }
      }
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
    } catch (error: any) {
      console.error('Errore riapertura pool:', error);
      setAdminError(error.message || 'Errore durante la riapertura del pool');
      
      // Marca solo il passo corrente come errore
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Funzione per gestire Close Pool con modal
  const executeClosePool = async (poolAddress: string) => {
    try {
      // Imposta i dati per il modal
      setAdminOperationType('close');
      setAdminPoolAddress(poolAddress);
      setAdminError('');
      setAdminTransactionHash('');
      
      // Inizializza i passi
      const steps: AdminStep[] = [
        {
          id: 'prepare',
          title: 'Preparazione transazione',
          description: 'Preparazione della transazione per chiudere il pool...',
          status: 'pending'
        },
        {
          id: 'sign',
          title: 'Firma transazione',
          description: 'Firma della transazione nel wallet...',
          status: 'pending'
        },
        {
          id: 'confirm',
          title: 'Conferma transazione',
          description: 'Attesa conferma della transazione sulla blockchain...',
          status: 'pending'
        },
        {
          id: 'complete',
          title: 'Operazione completata',
          description: 'Pool chiuso con successo!',
          status: 'pending'
        }
      ];
      
      setAdminSteps(steps);
      setAdminCurrentStep(0);
      setShowAdminModal(true);
      
      // Passo 1: Preparazione
      await new Promise(resolve => setTimeout(resolve, 100));
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'loading' } : step
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Passo 1: Completato, Passo 2: Chiamata alla funzione closePool
      setAdminSteps(prev => prev.map(step => 
        step.id === 'prepare' ? { ...step, status: 'completed' } :
        step.id === 'sign' ? { ...step, status: 'loading' } : step
      ));
      
      const txHash = await handleClosePool(poolAddress);
      
      // Passo 2: Completato, Passo 3: Transazione confermata
      setAdminTransactionHash(txHash);
      setAdminSteps(prev => prev.map(step => 
        step.id === 'sign' ? { ...step, status: 'completed' } : 
        step.id === 'confirm' ? { ...step, status: 'loading' } : step
      ));
      
      // Simula attesa conferma
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passo 3: Completato, Passo 4: Completato
      setAdminSteps(prev => prev.map(step => 
        step.id === 'confirm' ? { ...step, status: 'completed' } :
        step.id === 'complete' ? { ...step, status: 'completed' } : step
      ));
      
      // Salva il log della transazione admin
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('id')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionError) {
        console.error('Errore nel recupero della prediction:', predictionError);
      } else if (predictionData) {
        console.log('Salvataggio log admin:', { action: 'close_pool', txHash, poolAddress, adminAddress: userAddress });
        const { data: logId, error: insertError } = await supabase.rpc('insert_admin_log', {
          action_type_param: 'close_pool',
          tx_hash_param: txHash,
          admin_address_param: userAddress,
          pool_address_param: poolAddress,
          prediction_id_param: predictionData.id,
          additional_data_param: {}
        });
        
        if (insertError) {
          console.error('Errore nel salvataggio del log admin:', insertError);
        } else {
          console.log('Log admin salvato con successo, ID:', logId);
        }
        
        // Aggiorna lo status della prediction a "In Pausa"
        const { data: rpcData, error: updateError } = await supabase
          .rpc('update_prediction_status', {
            prediction_id_param: predictionData.id,
            new_status: 'in_pausa'
          });
        
        if (updateError) {
          console.error('Errore nell\'aggiornamento dello status della prediction:', updateError);
        } else {
          console.log('Status della prediction aggiornato a "In Pausa"', rpcData);
        }
      } else {
        console.warn('Nessuna prediction trovata per pool_address:', poolAddress);
      }
      
      // Imposta il currentStep a steps.length per mostrare il pulsante "Completato"
      setAdminCurrentStep(steps.length);
      
      // Ricarica lo stato del contratto per aggiornare i badge e i pulsanti
      const { data: predictionsWithPool } = await supabase
        .from('predictions')
        .select('id, pool_address')
        .eq('pool_address', poolAddress)
        .maybeSingle();
      
      if (predictionsWithPool) {
        const [isOpen, emergencyStop, cancelled, isClosedContract] = await Promise.all([
          isBettingCurrentlyOpen(poolAddress),
          getEmergencyStopStatus(poolAddress),
          isPoolCancelled(poolAddress),
          isPoolClosed(poolAddress)
        ]);
        
        setContractStates(prev => ({
          ...prev,
          [poolAddress]: { isOpen, emergencyStop, cancelled, isClosed: isClosedContract }
        }));
      }
      
    } catch (error: any) {
      console.error('Errore chiusura pool:', error);
      setAdminError(error.message || 'Errore durante la chiusura del pool');
      
      // Marca solo il passo corrente come errore (senza aggiungere il messaggio di errore nello step)
      setAdminSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'loading' ? 'error' : step.status
      })));
    }
  };

  // Genera il codice del contratto per BSCScan
  const generateContractCode = (prediction: any) => {
    const closingDateTimestamp = Math.floor(new Date(prediction.closing_date).getTime() / 1000);
    const closingBidTimestamp = Math.floor(new Date(prediction.closing_bid).getTime() / 1000);
    
    // Funzione helper per pulire le stringhe per Solidity
    const cleanString = (str: string) => {
      return str
        .replace(/"/g, '\\"')  // Escape delle virgolette
        .replace(/[^\x20-\x7E]/g, '')  // Rimuove caratteri non ASCII (accenti, simboli, etc.)
        .trim();
    };
    
    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ============ OPENZEPPELIN CONTRACTS ============

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * \`onlyOwner\`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() virtual {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * \`onlyOwner\` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from \`ReentrancyGuard\` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single \`nonReentrant\` guard, functions marked as
 * \`nonReentrant\` may not call one another. This can be worked around by making
 * those functions \`private\`, and then adding \`external\` \`nonReentrant\` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a \`nonReentrant\` function from another \`nonReentrant\`
     * function is not supported. It is possible to prevent this from happening
     * by making the \`nonReentrant\` function external, and making it call a
     * \`private\` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * \`nonReentrant\` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

// ============ PREDICTION POOL CONTRACT ============

contract PredictionPool is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    /// @dev Pool metadata
    string public title;
    string public description;
    string public category;
    uint256 public closingDate;    // When betting closes
    uint256 public closingBid;     // When the prediction event ends
    address payable public factory;        // Factory contract address
    
    /// @dev Pool state
    bool public isClosed = false;
    bool public winnerSet = false;
    bool public winner;            // true = Yes, false = No
    bool public emergencyStop = false;  // Emergency stop for betting
    bool public cancelled = false;      // Pool cancelled - refunds available
    
    /// @dev Betting totals
    uint256 public totalYes;
    uint256 public totalNo;
    uint256 public totalBets;
    
    /// @dev User betting data
    mapping(address => Bet) public userBets;
    address[] public bettors;
    
    /// @dev Claiming data
    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;
    
    /// @dev Fee configuration
    address public constant FEE_WALLET = 0x8E49800F0AA47e68ba9e46D97481679D03379294;
    uint256 public constant FEE_PERCENTAGE = 150; // 1.5%
    
    // ============ STRUCTS ============
    
    struct Bet {
        bool choice;        // true = Yes, false = No
        uint256 amount;     // Amount bet
        uint256 timestamp;  // When bet was placed
        bool claimed;       // Whether rewards have been claimed
    }
    
    // ============ EVENTS ============
    
    event BetPlaced(address indexed user, bool choice, uint256 amount, string predictionTitle, string userChoice);
    event PoolClosed();
    event WinnerSet(bool winner);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyStop();
    event PoolCancelled();
    
    // ============ MODIFIERS ============
    
    modifier bettingOpen() {
        require(!isClosed, "Betting is closed");
        require(!emergencyStop, "Emergency stop activated");
        require(!cancelled, "Pool has been cancelled");
        require(block.timestamp <= closingDate, "Betting period has ended");
        _;
    }
    
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid,
        address _factory
    ) {
        title = _title;
        description = _description;
        category = _category;
        closingDate = _closingDate;
        closingBid = _closingBid;
        factory = payable(_factory);
    }
    
    // ============ BETTING FUNCTIONS ============
    
    /**
     * @dev Place a bet on the prediction
     * @param _choice true for Yes, false for No
     */
    function placeBet(bool _choice) external payable bettingOpen nonReentrant {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(userBets[msg.sender].amount == 0, "User has already placed a bet");
        
        // Record the bet
        userBets[msg.sender] = Bet({
            choice: _choice,
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false
        });
        
        // Add to bettors list if first bet
        if (userBets[msg.sender].amount == msg.value) {
            bettors.push(msg.sender);
        }
        
        // Update totals
        if (_choice) {
            totalYes += msg.value;
        } else {
            totalNo += msg.value;
        }
        totalBets += 1;
        
        emit BetPlaced(msg.sender, _choice, msg.value, title, _choice ? "YES" : "NO");
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Close betting (only owner)
     */
    function closeBetting() external onlyOwner {
        require(!isClosed, "Betting is already closed");
        isClosed = true;
        emit PoolClosed();
    }
    
    /**
     * @dev Set the winner (only owner)
     * @param _winner true for Yes, false for No
     */
    function setWinner(bool _winner) external onlyOwner {
        require(isClosed, "Betting must be closed first");
        require(!winnerSet, "Winner has already been set");
        
        winner = _winner;
        winnerSet = true;
        emit WinnerSet(_winner);
    }
    
    /**
     * @dev Emergency stop betting (only owner)
     */
    function emergencyStopBetting() external onlyOwner {
        emergencyStop = true;
        emit EmergencyStop();
    }
    
    /**
     * @dev Cancel pool and enable refunds (only owner)
     */
    function cancelPool() external onlyOwner {
        require(!cancelled, "Pool is already cancelled");
        cancelled = true;
        emit PoolCancelled();
    }
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @dev Get bet description for wallet display
     */
    function getBetDescription() external view returns (string memory) {
        return string(abi.encodePacked("Bet on: ", title));
    }
    
    /**
     * @dev Get betting status for wallet display
     */
    function getBettingStatus() external view returns (string memory) {
        if (cancelled) return "Pool Cancelled";
        if (emergencyStop) return "Emergency Stop";
        if (isClosed) return "Betting Closed";
        if (block.timestamp > closingDate) return "Betting Period Ended";
        return "Betting Open";
    }
    
    /**
     * @dev Check if user can bet
     */
    function canUserBet(address _user) external view returns (bool canBet, string memory reason) {
        if (cancelled) return (false, "Pool has been cancelled");
        if (emergencyStop) return (false, "Emergency stop activated");
        if (isClosed) return (false, "Betting is closed");
        if (block.timestamp > closingDate) return (false, "Betting period has ended");
        if (userBets[_user].amount > 0) return (false, "User has already placed a bet");
        return (true, "User can place a bet");
    }
    
    /**
     * @dev Check if betting is currently open
     */
    function isBettingOpen() external view returns (bool) {
        return !isClosed && !emergencyStop && !cancelled && block.timestamp <= closingDate;
    }
    
    // ============ CLAIM FUNCTIONS ============
    
    /**
     * @dev Claim rewards for winners
     */
    function claimRewards() external nonReentrant {
        require(winnerSet, "Winner has not been set yet");
        require(!cancelled, "Pool has been cancelled - use claimRefund instead");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Rewards already claimed");
        require(userBets[msg.sender].choice == winner, "Not a winner");
        
        // Calculate reward
        uint256 betAmount = userBets[msg.sender].amount;
        uint256 totalWinningBets = winner ? totalYes : totalNo;
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        
        uint256 feeAmount = (totalLosingBets * FEE_PERCENTAGE) / 10000;
        uint256 rewardPool = totalLosingBets - feeAmount;
        uint256 userReward = (betAmount * rewardPool) / totalWinningBets;
        
        userBets[msg.sender].claimed = true;
        totalClaimed += userReward;
        
        payable(msg.sender).transfer(userReward);
        emit RewardsClaimed(msg.sender, userReward);
    }
    
    /**
     * @dev Claim refund for cancelled pool
     */
    function claimRefund() external nonReentrant {
        require(cancelled, "Pool has not been cancelled");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Refund already claimed");
        
        uint256 refundAmount = userBets[msg.sender].amount;
        userBets[msg.sender].claimed = true;
        
        payable(msg.sender).transfer(refundAmount);
        emit RewardsClaimed(msg.sender, refundAmount);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalYes,
        uint256 _totalNo,
        uint256 _totalBets,
        bool _isClosed,
        bool _winnerSet,
        bool _winner
    ) {
        return (totalYes, totalNo, totalBets, isClosed, winnerSet, winner);
    }
    
    /**
     * @dev Get user bet information
     */
    function getUserBet(address _user) external view returns (
        bool choice,
        uint256 amount,
        uint256 timestamp,
        bool claimed
    ) {
        Bet memory bet = userBets[_user];
        return (bet.choice, bet.amount, bet.timestamp, bet.claimed);
    }
    
    /**
     * @dev Get all bettors
     */
    function getAllBettors() external view returns (address[] memory) {
        return bettors;
    }
    
    // ============ FEE FUNCTIONS ============
    
    /**
     * @dev Withdraw fees to fee wallet (only owner)
     */
    function withdrawFees() external onlyOwner {
        require(winnerSet, "Winner must be set first");
        require(!cancelled, "Cannot withdraw fees from cancelled pool");
        
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        uint256 feeAmount = (totalLosingBets * FEE_PERCENTAGE) / 10000;
        
        if (feeAmount > 0) {
            payable(FEE_WALLET).transfer(feeAmount);
        }
    }
    
    // ============ FALLBACK ============
    
    receive() external payable {
        // Accept ETH transfers
    }
}`;

    return contractCode;
  };

  // Apre il modal per generare il codice BSCScan
  const handleGenerateBSCScanCode = (prediction: any) => {
    const code = generateContractCode(prediction);
    setGeneratedContractCode(code);
    setShowBSCScanModal(true);
  };

  const handleActivateContract = async (prediction: any) => {
    if (!userAddress) return;

    // Inizializza il modal di transazione
    setTransactionSteps(initializeTransactionSteps());
    setCurrentStep(0);
    setTransactionHash('');
    setContractAddress('');
    setTransactionError('');
    setShowTransactionModal(true);

    try {
      // Step 1: Preparazione
      updateStepStatus('prepare', 'loading');
      setCurrentStep(1);
      
      
      // Importa le funzioni di contratto
      const { createPool } = await import('../lib/contracts');
      
      // Converti le date a timestamp UTC
      const closingDateUtc = Math.floor(new Date(prediction.closing_date).getTime() / 1000);
      const closingBidUtc = Math.floor(new Date(prediction.closing_bid).getTime() / 1000);
      
      
      updateStepStatus('prepare', 'completed');
      
      // Step 2: Invio al wallet
      updateStepStatus('wallet', 'loading');
      setCurrentStep(2);
      
      // Crea il pool sulla blockchain
      const result = await createPool({
        title: prediction.title,
        description: prediction.description,
        category: prediction.category,
        closingDateUtc,
        closingBidUtc
      });
      
      
      setContractAddress(result.address);
      setTransactionHash(result.hash);
      updateStepStatus('wallet', 'completed');
      
      // Step 3: Conferma blockchain
      updateStepStatus('blockchain', 'loading');
      setCurrentStep(3);
      
      // Simula attesa conferma (in realtà createPool già aspetta)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateStepStatus('blockchain', 'completed');
      
      // Step 4: Aggiornamento database
      updateStepStatus('database', 'loading');
      setCurrentStep(4);
      
      const { data, error } = await supabase.rpc('activate_prediction_contract', {
        p_prediction_id: prediction.id,
        p_contract_address: result.address,
        p_caller_wallet: userAddress
      });
      
      if (error) {
        console.error('❌ Errore RPC:', error);
        updateStepStatus('database', 'error', error.message);
        setTransactionError(`Contract creato ma errore aggiornamento database: ${error.message}`);
        return;
      }
      
      // Controlla il risultato JSON della funzione RPC
      if (data && !data.success) {
        console.error('❌ Errore attivazione contract:', data.message);
        updateStepStatus('database', 'error', data.message);
        setTransactionError(`Contract creato ma errore attivazione: ${data.message}`);
        return;
      }
      
      updateStepStatus('database', 'completed');
      
      // Step 5: Completato
      updateStepStatus('complete', 'completed');
      setCurrentStep(5);
      
      
      // Ricarica le prediction
      await loadPredictions();
      
    } catch (error) {
      console.error('❌ Errore durante attivazione contract:', error);
      
      // Determina in quale step si è verificato l'errore
      const errorMessage = (error as Error).message;
      let errorStep = 'wallet';
      
      if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
        errorStep = 'wallet';
      } else if (errorMessage.includes('insufficient funds')) {
        errorStep = 'wallet';
      } else if (errorMessage.includes('factory') || errorMessage.includes('contract')) {
        errorStep = 'blockchain';
      }
      
      updateStepStatus(errorStep, 'error', errorMessage);
      setTransactionError(errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      closing_date: '',
      closing_bid: '',
      status: 'in_attesa',
      rules: '',
      image_url: ''
    });
    setShowForm(false);
    setEditingPrediction(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Verifica accesso admin...
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Controllo permessi in corso
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">Errore: {error}</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Accesso Negato
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Non hai i permessi per accedere a questa sezione.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Wallet: {userAddress || 'Non connesso'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="mb-2">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200 mb-6 mt-8"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            HOME
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            OP Panel
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Pannello operativo per la gestione del Prediction Market!
        </p>
      </div>

      {/* Loading state per le prediction */}
      {predictions.length === 0 && !formLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            Caricamento prediction...
          </p>
        </div>
      )}
      
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
        >
          {showForm ? 'Annulla' : 'Crea nuova Prediction'}
        </button>
      </div>

      {showForm && !editingPrediction && (
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Nuova Prediction
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <input
                  type="datetime-local"
                  value={formData.closing_date}
                  onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Fino a quando si può scommettere
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Chiusura Prediction *
                </label>
                <input
                  type="datetime-local"
                  value={formData.closing_bid}
                  onChange={(e) => setFormData({...formData, closing_bid: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
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
                {formLoading ? 'Salvataggio...' : (editingPrediction ? 'Aggiorna' : 'Crea') + ' Prediction'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={formLoading}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista delle prediction esistenti */}
      <div className="bg-transparent rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Prediction Esistenti ({filteredPredictions.length})
            </h2>
            
            {/* Search bar per le predictions */}
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cerca per titolo..."
                value={predictionsSearchQuery}
                onChange={(e) => setPredictionsSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {predictionsSearchQuery && (
                <button
                  onClick={() => setPredictionsSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {visiblePredictions.map((prediction) => {
            const isExpanded = expandedPredictions.has(prediction.id);
            return (
            <div key={prediction.id}>
              <div className="p-6">
                {/* Layout mobile: badge, titolo, descrizione, dati, pulsanti uno per riga */}
                <div className="block sm:hidden">
                  {/* Riga compatta - sempre visibile */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Status */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPredictionBadgeStatus(prediction).bgColor}`}>
                        {getPredictionBadgeStatus(prediction).emoji} {getPredictionBadgeStatus(prediction).text}
                      </span>
                      
                      {/* Categoria */}
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                        {prediction.category}
                      </span>
                      
                      {/* Titolo */}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex-1 min-w-0 truncate">
                        {prediction.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => togglePredictionExpansion(prediction.id)}
                      className="flex-shrink-0 ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenuto espandibile */}
                  {isExpanded && (
                    <div className="p-6">
                  {/* Badge status e categoria */}
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPredictionBadgeStatus(prediction).bgColor}`}>
                      {getPredictionBadgeStatus(prediction).emoji} {getPredictionBadgeStatus(prediction).text}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
                      {prediction.category}
                    </span>
                  </div>
                  
                  {/* Titolo */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {prediction.title}
                  </h3>
                  
                  {/* Descrizione */}
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {prediction.description}
                  </p>
                  
                  {/* Dati */}
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span>Scadenza: {new Date(prediction.closing_date).toLocaleDateString('it-IT')}</span>
                        <span className="mx-2">•</span>
                        <span>Creata: {new Date(prediction.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                      {prediction.pool_address && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contract:</span>
                          <a
                            href={`https://testnet.bscscan.com/address/${prediction.pool_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <span className="font-mono">
                              {prediction.pool_address.slice(0, 6)}...{prediction.pool_address.slice(-4)}
                            </span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pulsanti uno per riga centrati */}
                  <div className="space-y-2">
                    {prediction.status === 'in_attesa' && (
                      <button
                        onClick={() => handleActivateContract(prediction)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Attiva Contract
                      </button>
                    )}
                    {(prediction.status === 'attiva' || prediction.status === 'in_pausa' || prediction.status === 'risolta' || prediction.status === 'cancellata' || prediction.status === 'nascosta') && (
                      <button
                        onClick={() => handleActivateContract(prediction)}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Redeploy Contract
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(prediction)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(prediction.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Elimina
                    </button>
                    <button
                      onClick={() => handleGenerateBSCScanCode(prediction)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Codice BSCScan
                    </button>
                  </div>
                    </div>
                  )}
                </div>
                
                {/* Layout desktop: accordion */}
                <div className="hidden sm:block">
                  {/* Riga compatta - sempre visibile */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Status con pallino */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPredictionBadgeStatus(prediction).bgColor}`}>
                          {getPredictionBadgeStatus(prediction).emoji} {getPredictionBadgeStatus(prediction).text}
                        </span>
                      </div>
                      
                      {/* Categoria */}
                      <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                        {prediction.category}
                      </span>
                      
                      {/* Titolo */}
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1 min-w-0 truncate">
                        {prediction.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => togglePredictionExpansion(prediction.id)}
                      className="flex-shrink-0 ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenuto espandibile */}
                  {isExpanded && (
                    <div className="p-6 pt-0">
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 text-sm leading-tight">
                    {prediction.description.length > 120 
                      ? prediction.description.substring(0, 120) + '...' 
                      : prediction.description}
                  </p>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span>Scadenza: {new Date(prediction.closing_date).toLocaleDateString('it-IT')}</span>
                        <span className="mx-2">•</span>
                        <span>Creata: {new Date(prediction.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                      {prediction.pool_address && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contract:</span>
                          <a
                            href={`https://testnet.bscscan.com/address/${prediction.pool_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <span className="font-mono">
                              {prediction.pool_address.slice(0, 6)}...{prediction.pool_address.slice(-4)}
                            </span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pulsanti centrati */}
                  <div className="flex justify-center gap-3">
                    {prediction.status === 'in_attesa' && (
                      <button
                        onClick={() => handleActivateContract(prediction)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Attiva Contract
                      </button>
                    )}
                    {(prediction.status === 'attiva' || prediction.status === 'in_pausa' || prediction.status === 'risolta' || prediction.status === 'cancellata' || prediction.status === 'nascosta') && (
                      <button
                        onClick={() => handleActivateContract(prediction)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Redeploy Contract
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(prediction)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(prediction.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Elimina
                    </button>
                    <button
                      onClick={() => handleGenerateBSCScanCode(prediction)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Codice BSCScan
                    </button>
                  </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form di modifica sotto la prediction */}
              {editingPrediction && editingPrediction.id === prediction.id && (
                <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Modifica Prediction
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Titolo *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Descrivi la prediction in dettaglio..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Chiusura Scommesse *
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.closing_date}
                            onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Fino a quando si può scommettere
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Chiusura Prediction *
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.closing_bid}
                            onChange={(e) => setFormData({...formData, closing_bid: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Quando finisce l'evento della prediction
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Stato
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta'})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
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
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={2}
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
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows={2}
                          placeholder="Inserisci note e aggiornamenti per questa prediction..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2"
                        >
                          {formLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          {formLoading ? 'Salvataggio...' : 'Aggiorna Prediction'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={formLoading}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Annulla
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
            );
          })}
          
          {predictions.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nessuna prediction trovata
            </div>
          )}
          
          {/* Scritta Carica altri per predictions */}
          {hasMorePredictions && (
            <div className="flex justify-center mt-6">
              <span
                onClick={loadMorePredictions}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer font-medium"
              >
                Carica altri... ({filteredPredictions.length - visiblePredictionsCount} rimanenti)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sezione Smart Contracts */}
      {isFactoryOwner && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Smart Contracts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gestione pool di Predictions on-chain!
            </p>
          </div>

          {/* Stato connessione */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Connesso come Owner della Factory
                </span>
              </div>
              <a
                href={`https://testnet.bscscan.com/address/${process.env.NEXT_PUBLIC_FACTORY_ADDRESS || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:underline font-mono text-sm"
              >
                {process.env.NEXT_PUBLIC_FACTORY_ADDRESS || 'Not configured'}
              </a>
            </div>
          </div>

          {/* Lista Pool On-Chain */}
          <div className="bg-transparent rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pool di Predictions On-Chain
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {filteredPools.length} Pools trovate
                  </p>
                </div>
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cerca prediction..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {contractsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento pool...</span>
                </div>
              ) : contractsError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 dark:text-red-400 mb-2">Errore caricamento pool</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">{contractsError}</div>
                </div>
              ) : pools.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nessuna pool on-chain trovata
                </div>
              ) : (
                <div className="space-y-4">
                  {visiblePools.map((pool) => (
                    <div key={pool.address} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      {/* Layout mobile: badge, titolo, descrizione, dati, pulsanti uno per riga */}
                      <div className="block sm:hidden p-4">
                        {/* Header con badge status e pulsante Funzioni CONTRACT */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2">
                            {(() => {
                              const poolStatus = getPoolBadgeStatus(pool);
                              return (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${poolStatus.bgColor}`}>
                                  {poolStatus.emoji} {poolStatus.text}
                                </span>
                              );
                            })()}
                            {pool.winnerSet ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                pool.winner 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                Risultato: {pool.winner ? 'YES' : 'NO'}
                              </span>
                            ) : (() => {
                              // Trova la prediction corrispondente per controllare se è risolta
                              const correspondingPrediction = predictions.find(p => p.pool_address === pool.address);
                              // Mostra "In Attesa Risoluzione" solo se non è risolta
                              if (isPredictionEnded(pool.closingBid) && (!correspondingPrediction || correspondingPrediction.status !== 'risolta')) {
                                return (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                    In Attesa Risoluzione
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          {/* Menu a tendina Funzioni CONTRACT */}
                          <div className="relative dropdown-menu">
                            <button
                              onClick={() => togglePoolExpansion(pool.address)}
                              className={`px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-t-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm ${expandedPools.has(pool.address) ? 'rounded-b-none' : 'rounded-md'}`}
                            >
                              <span className="font-medium text-gray-900 dark:text-white">🔧 Funzioni CONTRACT</span>
                            </button>
                            
                            {/* Menu a tendina */}
                            {expandedPools.has(pool.address) && (
                              <div className="absolute top-full right-0 bg-blue-800 dark:bg-blue-900 border border-gray-300 dark:border-gray-600 rounded-b-lg shadow-lg z-10 min-w-48">
                                <div className="py-2">
                                  {/* Close Pool */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        executeClosePool(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      🔒 Close Pool
                                    </button>
                                  )}
                                  
                                  {/* Reopen Pool */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        executeReopenPool(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      🔓 Open Pool
                                    </button>
                                  )}
                                  
                                  {/* Stop Betting */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        handleStopBetting(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      🟡 Stop Betting
                                    </button>
                                  )}
                                  
                                  {/* Resume Betting */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        handleResumeBetting(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      ▶️ Resume Betting
                                    </button>
                                  )}
                                  
                                  {/* Resolve YES */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        handleResolvePrediction(pool.address, true);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      ✅ Resolve YES
                                    </button>
                                  )}
                                  
                                  {/* Resolve NO */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        handleResolvePrediction(pool.address, false);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      🚩 Resolve NO
                                    </button>
                                  )}
                                  
                                  {/* Cancel Pool */}
                                  {!pool.winnerSet && (
                                    <button
                                      onClick={() => {
                                        handleCancelPool(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      ❌ Cancel Pool
                                    </button>
                                  )}
                                  
                                  {/* Recover Funds */}
                                  <button
                                    onClick={() => {
                                      handleRecoverFunds(pool.address);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    💰 Recover Funds
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Titolo */}
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {pool.title}
                        </h4>
                        
                        {/* Dati su una riga */}
                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500 mb-1">
                          <span>Categoria: {pool.category}</span>
                          <span>Chiusura: {formatItalianTime(pool.closingDate)}</span>
                          <span>Scadenza: {formatItalianTime(pool.closingBid)}</span>
                        </div>
                        
                        {/* Indirizzo Pool */}
                        <div className="mb-1">
                          <a
                            href={`https://testnet.bscscan.com/address/${pool.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer inline-block"
                            title="Clicca per aprire su BSCScan"
                          >
                            {pool.address}
                          </a>
                        </div>
                        
                        {/* Dati rimanenti */}
                        <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                          <div className="flex items-center space-x-2">
                            <span>{pool.bettorCount} Predictions</span>
                            <span className="text-xs">
                              {(() => {
                                // Usa le percentuali basate sul numero di scommesse se disponibili
                                const betCountData = betCountPercentages[pool.address];
                                
                                if (betCountData) {
                                  return (
                                    <span>
                                      <span className="text-green-600 dark:text-green-400">YES: {betCountData.yes.toFixed(1)}%</span>
                                      <span className="text-gray-400 dark:text-gray-600"> | </span>
                                      <span className="text-red-600 dark:text-red-400">NO: {betCountData.no.toFixed(1)}%</span>
                                    </span>
                                  );
                                } else {
                                  // Fallback ai dati del contratto
                                  const totalYes = Number(pool.totalYes) / 1e18;
                                  const totalNo = Number(pool.totalNo) / 1e18;
                                  const total = totalYes + totalNo;
                                  
                                  if (total === 0) {
                                    return (
                                      <span>
                                        <span className="text-green-600 dark:text-green-400">YES: 0%</span>
                                        <span className="text-gray-400 dark:text-gray-600"> | </span>
                                        <span className="text-red-600 dark:text-red-400">NO: 0%</span>
                                      </span>
                                    );
                                  }
                                  const yesPercent = ((totalYes / total) * 100).toFixed(1);
                                  const noPercent = ((totalNo / total) * 100).toFixed(1);
                                  return (
                                    <span>
                                      <span className="text-green-600 dark:text-green-400">YES: {yesPercent}%</span>
                                      <span className="text-gray-400 dark:text-gray-600"> | </span>
                                      <span className="text-red-600 dark:text-red-400">NO: {noPercent}%</span>
                                    </span>
                                  );
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Menu a tendina Funzioni CONTRACT */}
                        <div className="mb-3 relative dropdown-menu">
                          {/* Pulsante principale */}
                          <button
                            onClick={() => togglePoolExpansion(pool.address)}
                            className={`w-full flex items-center justify-center px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-t-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm ${expandedPools.has(pool.address) ? 'rounded-b-none' : 'rounded-md'}`}
                          >
                            <span className="font-medium text-gray-900 dark:text-white">🔧 Funzioni CONTRACT</span>
                          </button>
                          
                          {/* Menu a tendina */}
                          {expandedPools.has(pool.address) && (
                            <div className="absolute top-full left-0 right-0 bg-blue-800 dark:bg-blue-900 border border-gray-300 dark:border-gray-600 rounded-b-lg shadow-lg z-10">
                              <div className="py-2">
                                {/* Close Pool */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      executeClosePool(pool.address);
                                      togglePoolExpansion(pool.address); // Chiude il menu dopo l'azione
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    🔒 Close Pool
                                  </button>
                                )}
                                
                                {/* Reopen Pool */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      executeReopenPool(pool.address);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    🔓 Open Pool
                                  </button>
                                )}
                                
                                {/* Stop Betting */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      handleStopBetting(pool.address);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    🟡 Stop Betting
                                  </button>
                                )}
                                
                                {/* Resume Betting */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      handleResumeBetting(pool.address);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    ▶️ Resume Betting
                                  </button>
                                )}
                                
                                {/* Resolve YES */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      handleResolvePrediction(pool.address, true);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    ✅ Resolve YES
                                  </button>
                                )}
                                
                                {/* Resolve NO */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      handleResolvePrediction(pool.address, false);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    🚩 Resolve NO
                                  </button>
                                )}
                                
                                {/* Cancel Pool */}
                                {!pool.winnerSet && (
                                  <button
                                    onClick={() => {
                                      handleCancelPool(pool.address);
                                      togglePoolExpansion(pool.address);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    ❌ Cancel Pool
                                  </button>
                                )}
                                
                                {/* Recover Funds */}
                                <button
                                  onClick={() => {
                                    handleRecoverFunds(pool.address);
                                    togglePoolExpansion(pool.address);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  💰 Recover Funds
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Layout desktop: originale */}
                      <div className="hidden sm:block p-4">
                        <div className="mb-3">
                          {/* Indirizzo Pool */}
                          {/* Titolo con pulsante Funzioni CONTRACT */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {pool.title}
                              </h4>
                              {(() => {
                                const poolStatus = getPoolBadgeStatus(pool);
                                return (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${poolStatus.bgColor}`}>
                                    {poolStatus.emoji} {poolStatus.text}
                                  </span>
                                );
                              })()}
                            </div>
                            
                            {/* Menu a tendina Funzioni CONTRACT */}
                            <div className="relative dropdown-menu">
                              <button
                                onClick={() => togglePoolExpansion(pool.address)}
                                className={`px-3 py-1.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-t-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm ${expandedPools.has(pool.address) ? 'rounded-b-none' : 'rounded-md'}`}
                              >
                                <span className="font-medium text-gray-900 dark:text-white">🔧 Funzioni CONTRACT</span>
                              </button>
                              
                              {/* Menu a tendina */}
                              {expandedPools.has(pool.address) && (
                                <div className="absolute top-full right-0 bg-blue-800 dark:bg-blue-900 border border-gray-300 dark:border-gray-600 rounded-b-lg shadow-lg z-10 min-w-48">
                                  <div className="py-2">
                                    {/* Close Pool */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          executeClosePool(pool.address);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        🔒 Close Pool
                                      </button>
                                    )}
                                    
                                    {/* Reopen Pool */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          executeReopenPool(pool.address);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        🔓 Open Pool
                                      </button>
                                    )}
                                    
                                    {/* Stop Betting */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          handleStopBetting(pool.address);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        🟡 Stop Betting
                                      </button>
                                    )}
                                    
                                    {/* Resume Betting */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          handleResumeBetting(pool.address);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        ▶️ Resume Betting
                                      </button>
                                    )}
                                    
                                    {/* Resolve YES */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          handleResolvePrediction(pool.address, true);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        ✅ Resolve YES
                                      </button>
                                    )}
                                    
                                    {/* Resolve NO */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          handleResolvePrediction(pool.address, false);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        🚩 Resolve NO
                                      </button>
                                    )}
                                    
                                    {/* Cancel Pool */}
                                    {!pool.winnerSet && (
                                      <button
                                        onClick={() => {
                                          handleCancelPool(pool.address);
                                          togglePoolExpansion(pool.address);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                      >
                                        ❌ Cancel Pool
                                      </button>
                                    )}
                                    
                                    {/* Recover Funds */}
                                    <button
                                      onClick={() => {
                                        handleRecoverFunds(pool.address);
                                        togglePoolExpansion(pool.address);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      💰 Recover Funds
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Dati su una riga */}
                          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500 mb-1">
                            <span>Categoria: {pool.category}</span>
                            <span>Chiusura: {formatItalianTime(pool.closingDate)}</span>
                            <span>Scadenza: {formatItalianTime(pool.closingBid)}</span>
                          </div>
                          
                          {/* Indirizzo Pool */}
                          <div className="mb-1">
                            <a
                              href={`https://testnet.bscscan.com/address/${pool.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer inline-block"
                              title="Clicca per aprire su BSCScan"
                            >
                              {pool.address}
                            </a>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                            <div className="flex items-center space-x-2">
                              <span>{pool.bettorCount} Predictions</span>
                              <span className="text-xs">
                                {(() => {
                                  // Usa le percentuali basate sul numero di scommesse se disponibili
                                  const betCountData = betCountPercentages[pool.address];
                                  
                                  if (betCountData) {
                                    return (
                                      <span>
                                        <span className="text-green-600 dark:text-green-400">YES: {betCountData.yes.toFixed(1)}%</span>
                                        <span className="text-gray-400 dark:text-gray-600"> | </span>
                                        <span className="text-red-600 dark:text-red-400">NO: {betCountData.no.toFixed(1)}%</span>
                                      </span>
                                    );
                                  } else {
                                    // Fallback ai dati del contratto
                                    const totalYes = Number(pool.totalYes) / 1e18;
                                    const totalNo = Number(pool.totalNo) / 1e18;
                                    const total = totalYes + totalNo;
                                    
                                    if (total === 0) {
                                      return (
                                        <span>
                                          <span className="text-green-600 dark:text-green-400">YES: 0%</span>
                                          <span className="text-gray-400 dark:text-gray-600"> | </span>
                                          <span className="text-red-600 dark:text-red-400">NO: 0%</span>
                                        </span>
                                      );
                                    }
                                    const yesPercent = ((totalYes / total) * 100).toFixed(1);
                                    const noPercent = ((totalNo / total) * 100).toFixed(1);
                                    return (
                                      <span>
                                        <span className="text-green-600 dark:text-green-400">YES: {yesPercent}%</span>
                                        <span className="text-gray-400 dark:text-gray-600"> | </span>
                                        <span className="text-red-600 dark:text-red-400">NO: {noPercent}%</span>
                                      </span>
                                    );
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                          
                      </div>

                      {/* Stato e azioni */}
                      <div className="flex justify-between items-center pt-3">
                        <div className="flex items-center space-x-4">
                          
                          {pool.winnerSet ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pool.winner 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              Risultato: {pool.winner ? 'YES' : 'NO'}
                            </span>
                          ) : (() => {
                            // Trova la prediction corrispondente per controllare se è risolta
                            const correspondingPrediction = predictions.find(p => p.pool_address === pool.address);
                            // Mostra "In Attesa Risoluzione" solo se non è risolta
                            if (isPredictionEnded(pool.closingBid) && (!correspondingPrediction || correspondingPrediction.status !== 'risolta')) {
                              return (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                  In Attesa Risoluzione
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Scritta Carica altri */}
                  {hasMorePools && (
                    <div className="flex justify-center mt-6">
                      <span
                        onClick={loadMorePools}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer font-medium"
                      >
                        Carica altri... ({filteredPools.length - visiblePoolsCount} rimanenti)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sezione Log Admin Functions */}
          <div className="mt-8 bg-transparent rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Log delle funzioni del Contract
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {adminLogs.length} azioni registrate - Factory:{' '}
                    <a
                      href={`https://testnet.bscscan.com/address/${process.env.NEXT_PUBLIC_FACTORY_ADDRESS || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-mono"
                    >
                      {process.env.NEXT_PUBLIC_FACTORY_ADDRESS || 'Not configured'}
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => loadAdminLogs(true)}
                  disabled={adminLogsLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminLogsLoading ? 'Ricarica...' : 'Ricarica'}
                </button>
              </div>
            </div>

            <div className="p-6">
              {adminLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento log...</span>
                </div>
              ) : adminLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nessun log disponibile
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data/Ora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Azione
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Admin
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pool Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          TX Hash
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
                      {adminLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {new Date(log.created_at).toLocaleString('it-IT')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.action_type === 'stop_betting' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : log.action_type === 'resume_betting'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : log.action_type === 'close_pool'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {log.action_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            <button
                              onClick={() => navigator.clipboard.writeText(log.admin_address)}
                              className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              title="Clicca per copiare"
                            >
                              {log.admin_address.slice(0, 10)}...
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {log.pool_address ? (
                              <button
                                onClick={() => navigator.clipboard.writeText(log.pool_address)}
                                className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                title="Clicca per copiare"
                              >
                                {log.pool_address.slice(0, 10)}...
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`https://testnet.bscscan.com/tx/${log.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {log.tx_hash.slice(0, 15)}...
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  
                  {/* Load More Button */}
                  {adminLogsHasMore && (
                    <div className="mt-4 text-center">
                      <span
                        onClick={loadMoreAdminLogs}
                        className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer font-medium ${adminLogsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {adminLogsLoading ? (
                          <span className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300"></div>
                            <span>Caricamento...</span>
                          </span>
                        ) : (
                          `Carica altri... (${Math.min(LOGS_PER_PAGE, adminLogsTotalCount - adminLogs.length)} rimanenti)`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal di Progresso Transazione */}
      <TransactionProgressModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        steps={transactionSteps}
        currentStep={currentStep}
        transactionHash={transactionHash}
        contractAddress={contractAddress}
        error={transactionError}
      />

      {/* Modal di Progresso Admin (Stop/Resume Betting) */}
      <AdminProgressModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        steps={adminSteps}
        currentStep={adminCurrentStep}
        transactionHash={adminTransactionHash}
        error={adminError}
        operationType={adminOperationType}
        poolAddress={adminPoolAddress}
      />

      {/* Modal BSCScan Code */}
      {showBSCScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 mx-4 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Codice Contratto per BSCScan
              </h3>
              <button
                onClick={() => setShowBSCScanModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📋 Istruzioni per BSCScan
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Vai su <a href="https://testnet.bscscan.com/verifyContract" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">BSCScan Verify Contract</a></li>
                  <li>Incolla l'indirizzo del contratto deployato</li>
                  <li>Seleziona "Solidity (Single file)"</li>
                  <li>Copia e incolla il codice qui sotto</li>
                  <li>Compilatore: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">v0.8.19+commit.7dd6d404</code></li>
                  <li>Ottimizzazione: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">200 runs</code></li>
                </ol>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Codice Solidity Completo:
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContractCode);
                    alert('Codice copiato negli appunti!');
                  }}
                  className="px-3 py-1 border-2 border-blue-500 bg-transparent text-white text-sm rounded hover:bg-blue-500/10 transition-colors"
                >
                  📋 Copia
                </button>
              </div>
              <textarea
                value={generatedContractCode}
                readOnly
                className="w-full h-96 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100 resize-none"
                style={{ fontSize: '12px', lineHeight: '1.4' }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBSCScanModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Chiudi
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedContractCode);
                  alert('Codice copiato negli appunti!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copia Codice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
