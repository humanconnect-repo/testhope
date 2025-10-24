"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useContracts } from '@/hooks/useContracts';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import TransactionProgressModal, { TransactionStep } from './TransactionProgressModal';
import ImageUpload from './ImageUpload';

interface Prediction {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata';
  rules: string;
  image_url?: string;
  pool_address?: string; // Indirizzo del contratto smart contract
  created_at: string;
  updated_at: string;
}

interface PredictionFormData {
  title: string;
  description: string;
  category: string;
  closing_date: string;
  closing_bid: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata';
  rules: string;
  image_url?: string;
}

export default function AdminPanel() {
  const { isAdmin, loading, error, userAddress } = useAdmin();
  const { 
    isFactoryOwner, 
    pools, 
    loading: contractsLoading, 
    error: contractsError,
    createNewPool,
    resolvePrediction,
    stopBetting,
    resumeBetting,
    emergencyResolvePrediction,
    cancelPoolPrediction,
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
      console.log('📊 Bet count percentages from database:', percentages);
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
    console.log('🚫 AdminPanel: Accesso negato - loading:', loading, 'isAdmin:', isAdmin);
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
  const [showOrphanPools, setShowOrphanPools] = useState<boolean>(false);

  // Carica le prediction esistenti
  useEffect(() => {
    if (isAdmin) {
      loadPredictions();
    }
  }, [isAdmin]);

  // Filtra i pool per mostrare solo quelli attivi o tutti
  const filteredPools = pools.filter(pool => {
    if (showOrphanPools) {
      return true; // Mostra tutti i pool
    }
    // Mostra solo pool che hanno una prediction attiva corrispondente
    return predictions.some(prediction => 
      prediction.pool_address === pool.address && 
      prediction.status === 'attiva'
    );
  });

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('id, title, description, slug, category, closing_date, closing_bid, status, rules, image_url, pool_address, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
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
            image_url: predictionData.image_url
          });

        if (rpcError) {
          throw rpcError;
        }

        if (!rpcData) {
          throw new Error('La prediction non è stata trovata o non è stata aggiornata');
        }

        alert('Prediction aggiornata con successo!');
      } else {
        // Crea nuova prediction usando RPC
        const { data: newPredictionId, error } = await supabase.rpc('create_prediction_admin', {
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

        if (error) throw error;
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
        rules: ''
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
      image_url: prediction.image_url || ''
    });
    // Non aprire il form generale, solo quello inline
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa prediction?')) return;

    try {
      console.log('🗑️ Eliminando prediction con ID:', id);
      console.log('👤 Admin wallet:', userAddress);

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

      console.log('✅ Prediction eliminata con successo');
      alert('Prediction eliminata con successo!');
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Errore nell\'eliminazione della prediction: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
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
      
      console.log('🚀 Attivando contract per prediction:', prediction.id);
      
      // Importa le funzioni di contratto
      const { createPool } = await import('@/lib/contracts');
      
      // Converti le date a timestamp UTC
      const closingDateUtc = Math.floor(new Date(prediction.closing_date).getTime() / 1000);
      const closingBidUtc = Math.floor(new Date(prediction.closing_bid).getTime() / 1000);
      
      console.log('📅 Date convertite:', {
        closing_date: prediction.closing_date,
        closing_bid: prediction.closing_bid,
        closingDateUtc,
        closingBidUtc
      });
      
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
      
      console.log('✅ Contract creato con indirizzo:', result.address);
      console.log('📋 Hash transazione:', result.hash);
      
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
        console.error('❌ Errore aggiornamento database:', error);
        updateStepStatus('database', 'error', error.message);
        setTransactionError(`Contract creato ma errore aggiornamento database: ${error.message}`);
        return;
      }
      
      updateStepStatus('database', 'completed');
      
      // Step 5: Completato
      updateStepStatus('complete', 'completed');
      setCurrentStep(5);
      
      console.log('✅ Prediction attivata con successo');
      
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
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            OP Panel
          </h1>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            HOME
          </Link>
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
      
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
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
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata'})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="in_attesa">In Attesa</option>
                  <option value="attiva">Attiva</option>
                  <option value="in_pausa">In Pausa</option>
                  <option value="risolta">Risolta</option>
                  <option value="cancellata">Cancellata</option>
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
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Prediction Esistenti ({predictions.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {predictions.map((prediction) => (
            <div key={prediction.id}>
              <div className="p-6">
                {/* Layout mobile: badge, titolo, descrizione, dati, pulsanti uno per riga */}
                <div className="block sm:hidden p-6">
                  {/* Badge status e categoria */}
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      prediction.status === 'attiva' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : prediction.status === 'in_attesa'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : prediction.status === 'in_pausa'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : prediction.status === 'risolta'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : prediction.status === 'cancellata'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {capitalizeFirst(prediction.status)}
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
                    <span>Scadenza: {new Date(prediction.closing_date).toLocaleDateString('it-IT')}</span>
                    <span className="mx-2">•</span>
                    <span>Creata: {new Date(prediction.created_at).toLocaleDateString('it-IT')}</span>
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
                    {prediction.status === 'attiva' && (
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
                  </div>
                </div>
                
                {/* Layout desktop: originale */}
                <div className="hidden sm:flex items-start justify-between p-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {prediction.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        prediction.status === 'attiva' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : prediction.status === 'in_attesa'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : prediction.status === 'in_pausa'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : prediction.status === 'risolta'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : prediction.status === 'cancellata'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {capitalizeFirst(prediction.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
                        {prediction.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {prediction.description}
                    </p>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      <span>Scadenza: {new Date(prediction.closing_date).toLocaleDateString('it-IT')}</span>
                      <span className="mx-2">•</span>
                      <span>Creata: {new Date(prediction.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {prediction.status === 'in_attesa' && (
                      <button
                        onClick={() => handleActivateContract(prediction)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                      >
                        Attiva Contract
                      </button>
                    )}
                    {prediction.status === 'attiva' && (
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
                  </div>
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
                            onChange={(e) => setFormData({...formData, status: e.target.value as 'attiva' | 'in_pausa' | 'risolta' | 'cancellata'})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="attiva">Attiva</option>
                            <option value="in_pausa">In Pausa</option>
                            <option value="risolta">Risolta</option>
                            <option value="cancellata">Cancellata</option>
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
          ))}
          
          {predictions.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nessuna prediction trovata
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
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-800 dark:text-green-200 font-medium">
                Connesso come Owner della Factory
              </span>
            </div>
          </div>

          {/* Lista Pool On-Chain */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pool di Predictions On-Chain
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {filteredPools.length} pool {showOrphanPools ? 'totali' : 'attivi'} trovati
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={showOrphanPools}
                      onChange={(e) => setShowOrphanPools(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span>Mostra pool orfani</span>
                  </label>
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
                  {filteredPools.map((pool) => (
                    <div key={pool.address} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      {/* Layout mobile: badge, titolo, descrizione, dati, pulsanti uno per riga */}
                      <div className="block sm:hidden p-4">
                        {/* Badge status */}
                        <div className="flex gap-2 mb-3">
                          {(() => {
                            const isActive = predictions.some(prediction => 
                              prediction.pool_address === pool.address && 
                              prediction.status === 'attiva'
                            );
                            return isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                🟢 Attiva
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                🔴 Orfana
                              </span>
                            );
                          })()}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isBettingOpen(pool.closingDate) 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {isBettingOpen(pool.closingDate) ? 'Scommesse Aperte' : 'Scommesse Chiuse'}
                          </span>
                          {pool.winnerSet ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pool.winner 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              Risultato: {pool.winner ? 'YES' : 'NO'}
                            </span>
                          ) : isPredictionEnded(pool.closingBid) ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              In Attesa Risoluzione
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Titolo */}
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {pool.title}
                        </h4>
                        
                        {/* Descrizione */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {pool.description}
                        </p>
                        
                        {/* Dati */}
                        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-500 mb-3">
                          <div>Categoria: {pool.category}</div>
                          <div>Chiusura: {formatItalianTime(pool.closingDate)}</div>
                          <div>Scadenza: {formatItalianTime(pool.closingBid)}</div>
                          <div>{pool.bettorCount} Predictions</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {(() => {
                              // Usa le percentuali basate sul numero di scommesse se disponibili
                              const betCountData = betCountPercentages[pool.address];
                              
                              if (betCountData) {
                                return `YES: ${betCountData.yes.toFixed(1)}% | NO: ${betCountData.no.toFixed(1)}%`;
                              } else {
                                // Fallback ai dati del contratto
                                const totalYes = Number(pool.totalYes) / 1e18;
                                const totalNo = Number(pool.totalNo) / 1e18;
                                const total = totalYes + totalNo;
                                
                                if (total === 0) return "YES: 0% | NO: 0%";
                                const yesPercent = ((totalYes / total) * 100).toFixed(1);
                                const noPercent = ((totalNo / total) * 100).toFixed(1);
                                return `YES: ${yesPercent}% | NO: ${noPercent}%`;
                              }
                            })()}
                          </div>
                        </div>
                        
                        {/* Pulsanti uno per riga centrati */}
                        <div className="space-y-2">
                          {/* Controlli Risoluzione */}
                          {!pool.winnerSet && (
                            <>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la risoluzione anticipata:');
                                  if (reason) {
                                    emergencyResolvePrediction(pool.address, true, reason);
                                  }
                                }}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                ✅ Resolve YES
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la risoluzione anticipata:');
                                  if (reason) {
                                    emergencyResolvePrediction(pool.address, false, reason);
                                  }
                                }}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                ❌ Resolve NO
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la cancellazione del pool:');
                                  if (reason) {
                                    cancelPoolPrediction(pool.address, reason);
                                  }
                                }}
                                className="w-full px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                              >
                                ❌ Cancel Pool
                              </button>
                            </>
                          )}
                          
                          {/* Controlli Scommesse */}
                          {!pool.winnerSet && (
                            <>
                              <button
                                onClick={() => stopBetting(pool.address)}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                              >
                                🛑 Stop Betting
                              </button>
                              <button
                                onClick={() => resumeBetting(pool.address)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                ▶️ Resume Betting
                              </button>
                            </>
                          )}
                          
                          {/* Risoluzione Normale */}
                          {!pool.winnerSet && isPredictionEnded(pool.closingBid) && (
                            <>
                              <button
                                onClick={() => resolvePrediction(pool.address, true)}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                Resolve YES
                              </button>
                              <button
                                onClick={() => resolvePrediction(pool.address, false)}
                                className="w-full px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Resolve NO
                              </button>
                            </>
                          )}
                          
                          {/* BSCScan */}
                          <button
                            onClick={() => window.open(`https://testnet.bscscan.com/address/${pool.address}`, '_blank')}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            View on BSCScan
                          </button>
                        </div>
                      </div>
                      
                      {/* Layout desktop: originale */}
                      <div className="hidden sm:block p-4">
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {pool.title}
                            </h4>
                            {(() => {
                              const isActive = predictions.some(prediction => 
                                prediction.pool_address === pool.address && 
                                prediction.status === 'attiva'
                              );
                              return isActive ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  🟢 Attiva
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  🔴 Orfana
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {pool.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500 mb-3">
                            <span>Categoria: {pool.category}</span>
                            <span>Chiusura: {formatItalianTime(pool.closingDate)}</span>
                            <span>Scadenza: {formatItalianTime(pool.closingBid)}</span>
                            <span>{pool.bettorCount} Predictions</span>
                          </div>
                          
                          {/* Percentuali sotto il testo - basate sul numero di scommesse */}
                          <div className="flex justify-center space-x-6 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {(() => {
                                  // Usa le percentuali basate sul numero di scommesse se disponibili
                                  const betCountData = betCountPercentages[pool.address];
                                  
                                  if (betCountData) {
                                    return `${betCountData.yes.toFixed(1)}%`;
                                  } else {
                                    // Fallback ai dati del contratto
                                    const totalYes = Number(pool.totalYes) / 1e18;
                                    const totalNo = Number(pool.totalNo) / 1e18;
                                    const total = totalYes + totalNo;
                                    
                                    if (total === 0) return "0%";
                                    const yesPercent = ((totalYes / total) * 100).toFixed(1);
                                    return `${yesPercent}%`;
                                  }
                                })()}
                        </div>
                              <div className="text-xs text-gray-500">YES</div>
                          </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">
                                {(() => {
                                  // Usa le percentuali basate sul numero di scommesse se disponibili
                                  const betCountData = betCountPercentages[pool.address];
                                  
                                  if (betCountData) {
                                    return `${betCountData.no.toFixed(1)}%`;
                                  } else {
                                    // Fallback ai dati del contratto
                                    const totalYes = Number(pool.totalYes) / 1e18;
                                    const totalNo = Number(pool.totalNo) / 1e18;
                                    const total = totalYes + totalNo;
                                    
                                    if (total === 0) return "0%";
                                    const noPercent = ((totalNo / total) * 100).toFixed(1);
                                    return `${noPercent}%`;
                                  }
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">NO</div>
                          </div>
                        </div>
                      </div>

                      {/* Stato e azioni */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isBettingOpen(pool.closingDate) 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {isBettingOpen(pool.closingDate) ? 'Scommesse Aperte' : 'Scommesse Chiuse'}
                          </span>
                          
                          {pool.winnerSet ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              pool.winner 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              Risultato: {pool.winner ? 'YES' : 'NO'}
                            </span>
                          ) : isPredictionEnded(pool.closingBid) ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                              In Attesa Risoluzione
                            </span>
                          ) : null}
                        </div>

                        {/* Pulsanti azione */}
                        <div className="flex flex-wrap gap-2">
                          {/* Controlli Risoluzione */}
                          {!pool.winnerSet && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la risoluzione anticipata:');
                                  if (reason) {
                                    emergencyResolvePrediction(pool.address, true, reason);
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                ✅ Resolve YES
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la risoluzione anticipata:');
                                  if (reason) {
                                    emergencyResolvePrediction(pool.address, false, reason);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                ❌ Resolve NO
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo per la cancellazione del pool:');
                                  if (reason) {
                                    cancelPoolPrediction(pool.address, reason);
                                  }
                                }}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                              >
                                ❌ Cancel Pool
                              </button>
                            </div>
                          )}
                          
                          {/* Controlli Scommesse */}
                          {!pool.winnerSet && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => stopBetting(pool.address)}
                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                              >
                                🛑 Stop Betting
                              </button>
                              <button
                                onClick={() => resumeBetting(pool.address)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                ▶️ Resume Betting
                              </button>
                            </div>
                          )}
                          
                          {/* Risoluzione Normale */}
                          {!pool.winnerSet && isPredictionEnded(pool.closingBid) && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => resolvePrediction(pool.address, true)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                Resolve YES
                              </button>
                              <button
                                onClick={() => resolvePrediction(pool.address, false)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Resolve NO
                              </button>
                            </div>
                          )}
                          
                          {/* BSCScan */}
                          <button
                            onClick={() => window.open(`https://testnet.bscscan.com/address/${pool.address}`, '_blank')}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            View on BSCScan
                          </button>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
