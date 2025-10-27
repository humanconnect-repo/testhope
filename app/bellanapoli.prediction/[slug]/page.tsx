"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBNBPrice } from '../../../hooks/useBNBPrice';
import { usePoolState } from '../../../hooks/usePoolState';
import { useWeb3Auth } from '../../../hooks/useWeb3Auth';
import { useBNBBalance } from '../../../hooks/useBNBBalance';
import { useContractData } from '../../../hooks/useContractData';
import { useAdmin } from '../../../hooks/useAdmin';
import { placeBet, claimRefund, getUserBetFromContract, hasClaimedRefund, getPoolWinner, calculateUserWinnings, claimWinnings, hasClaimedWinnings } from '../../../lib/contracts';
import { supabase } from '../../../lib/supabase';
import { validateComment } from '../../../lib/profanityFilter';
import BettingProgressModal, { BettingStep } from '../../../components/BettingProgressModal';
import TransactionProgressModal, { TransactionStep } from '../../../components/TransactionProgressModal';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import QuoteChart from '../../../components/QuoteChart';
import Link from 'next/link';

interface PredictionData {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  status: 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'in_attesa';
  closing_date: string;
  closing_bid: string;
  rules: string;
  image_url?: string;
  yes_percentage: number;
  no_percentage: number;
  total_bets: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  pool_address?: string;
}

interface BetData {
  id?: string;
  amount_bnb: number;
  position?: 'yes' | 'no';
  created_at?: string;
  username: string;
}

interface CommentData {
  comment_id: string;
  id?: string; // Fallback per compatibilità
  text: string;
  content?: string;
  created_at: string;
  username: string;
}


export default function PredictionPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { price: bnbPrice, loading: priceLoading, error: priceError } = useBNBPrice();
  const { user, isAuthenticated, address } = useWeb3Auth();
  const { balance: bnbBalance, loading: balanceLoading } = useBNBBalance();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [betAmount, setBetAmount] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no' | undefined>(undefined);
  const [newComment, setNewComment] = useState('');
  const [poolAddress, setPoolAddress] = useState<string>('');
  const [bettingLoading, setBettingLoading] = useState(false);
  const [claimRefundLoading, setClaimRefundLoading] = useState(false);
  const [showClaimRefundModal, setShowClaimRefundModal] = useState(false);
  const [claimRefundSteps, setClaimRefundSteps] = useState<TransactionStep[]>([]);
  const [currentClaimRefundStep, setCurrentClaimRefundStep] = useState(0);
  const [claimRefundTransactionHash, setClaimRefundTransactionHash] = useState<string>('');
  const [claimRefundError, setClaimRefundError] = useState<string>('');
  const [userBetAmount, setUserBetAmount] = useState<string>('0');
  const [userHasClaimedRefund, setUserHasClaimedRefund] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string>('');
  const [userBetAmountInBnb, setUserBetAmountInBnb] = useState<string>('0');
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [poolWinner, setPoolWinner] = useState<boolean | null>(null);
  const [userWinnings, setUserWinnings] = useState<{ totalWinnings: string; betAmount: string; reward: string } | null>(null);
  const [userWon, setUserWon] = useState<boolean | null>(null);
  
  // Stati per claim delle vincite
  const [claimWinningsLoading, setClaimWinningsLoading] = useState(false);
  const [showClaimWinningsModal, setShowClaimWinningsModal] = useState(false);
  const [claimWinningsSteps, setClaimWinningsSteps] = useState<TransactionStep[]>([]);
  const [currentClaimWinningsStep, setCurrentClaimWinningsStep] = useState(0);
  const [claimWinningsTransactionHash, setClaimWinningsTransactionHash] = useState<string>('');
  const [claimWinningsError, setClaimWinningsError] = useState<string>('');
  const [userHasClaimedWinnings, setUserHasClaimedWinnings] = useState(false);
  const [claimWinningsTxHash, setClaimWinningsTxHash] = useState<string>('');

  // Memoizza i dati del pool per evitare re-render infiniti
  const poolData = useMemo(() => ({
    status: prediction?.status,
    closingDate: prediction?.closing_date ? new Date(prediction.closing_date).getTime() / 1000 : 0,
    closingBid: prediction?.closing_bid ? new Date(prediction.closing_bid).getTime() / 1000 : 0,
    winnerSet: prediction?.status === 'risolta',
    winner: false, // Da leggere dal contratto
    userBet: null, // Sarà aggiornato quando userHasBet sarà disponibile
    emergencyStop: prediction?.status === 'in_pausa'
  }), [prediction?.status, prediction?.closing_date, prediction?.closing_bid]);

  // Hook per stato del pool (legge dal smart contract)
  const poolState = usePoolState(poolAddress, poolData);

  // Funzione helper per determinare lo stato basato su contratto + database
  const getPredictionStatus = useMemo(() => {
    return (prediction: PredictionData | null) => {
      if (!prediction) {
        return {
          status: 'unknown',
          displayText: 'Sconosciuto',
          emoji: '❓',
          bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        };
      }

      // Se abbiamo un pool address e poolState, usa quello come priorità assoluta
      if (poolAddress && poolState) {
        // Controlla prima se è cancellata
        if (poolState.isCancelled || prediction.status === 'cancellata') {
          return {
            status: 'cancellata',
            displayText: 'Cancellata',
            emoji: '🔴',
            bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          };
        } else if (poolState.statusText === 'CHIUSA') {
          return {
            status: 'chiusa',
            displayText: 'Chiusa',
            emoji: '🟡',
            bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        } else if (poolState.isPaused) {
          return {
            status: 'in_pausa',
            displayText: 'In pausa',
            emoji: '🟡',
            bgColor: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        } else if (poolState.isActive) {
          return {
            status: 'attiva',
            displayText: 'Attiva',
            emoji: '🟢',
            bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          };
        } else if (poolState.statusText === 'SCOMMESSE CHIUSE') {
          return {
            status: 'attiva',
            displayText: 'Attiva (Scommesse chiuse)',
            emoji: '🟡',
            bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        } else if (poolState.statusText === 'ATTESA RISULTATI') {
          return {
            status: 'risolta',
            displayText: 'In attesa risultati',
            emoji: '🏆',
            bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          };
        }
      }

      // Fallback alla logica del database
      switch (prediction.status) {
        case 'in_attesa':
          return {
            status: 'in_attesa',
            displayText: 'In attesa',
            emoji: '🟡',
            bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        case 'attiva':
          return {
            status: 'attiva',
            displayText: 'Attiva',
            emoji: '🟢',
            bgColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          };
        case 'in_pausa':
          return {
            status: 'in_pausa',
            displayText: 'In pausa',
            emoji: '🟡',
            bgColor: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          };
        case 'risolta':
          return {
            status: 'risolta',
            displayText: 'Risolta',
            emoji: '🏆',
            bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          };
        case 'cancellata':
          return {
            status: 'cancellata',
            displayText: 'Cancellata',
            emoji: '❌',
            bgColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          };
        default:
          return {
            status: 'unknown',
            displayText: 'Sconosciuto',
            emoji: '❓',
            bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          };
      }
    };
  }, [poolAddress, poolState]);

  // Funzione helper per determinare lo status del container betting (memoizzata)
  const getBettingContainerStatus = useMemo(() => {
    return (prediction: PredictionData | null) => {
      if (!prediction) {
        return {
          type: 'unknown',
          message: 'Status sconosciuto',
          status: 'Status sconosciuto'
        };
      }

      // Se abbiamo un pool address e poolState, usa quello come priorità assoluta
      if (poolAddress && poolState) {
        // Controlla prima se è cancellata
        if (poolState.isCancelled || prediction.status === 'cancellata') {
          return {
            type: 'cancelled',
            message: 'Puoi fare il claim dei tuoi fondi se avevi fatto una prediction !',
            status: 'Prediction cancellata'
          };
        } else if (poolState.statusText === 'CHIUSA') {
          return {
            type: 'closed_waiting',
            message: 'Prediction chiusa',
            status: ''
          };
        } else if (poolState.isPaused) {
          return {
            type: 'paused',
            message: 'Prediction in pausa',
            status: 'Prediction in pausa',
            highlightText: 'Prediction in pausa'
          };
        } else if (poolState.isActive) {
          return {
            type: 'open',
            message: 'Fai la tua prediction',
            status: 'Predictions aperte'
          };
        } else if (poolState.statusText === 'SCOMMESSE CHIUSE') {
          return {
            type: 'closed_waiting',
            message: 'Non puoi più scommettere, attendi la scadenza della prediction',
            status: 'Predictions chiuse - In attesa risultati'
          };
        } else if (poolState.statusText === 'ATTESA RISULTATI') {
          return {
            type: 'ended',
            message: 'In attesa dei risultati',
            status: 'Prediction terminata'
          };
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const closingDate = new Date(prediction.closing_date).getTime() / 1000;
      const closingBid = new Date(prediction.closing_bid).getTime() / 1000;
      
      // Fallback: controlla il status del database
      switch (prediction.status) {
        case 'in_pausa':
          return {
            type: 'closed_waiting',
            message: 'Pool chiusa - In attesa risultati',
            status: 'Predictions chiuse - In attesa risultati'
          };
        
        case 'risolta':
          return {
            type: 'resolved',
            message: 'Prediction risolta',
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
  }, [poolAddress, poolState]); // Dipende da poolAddress e poolState
  
  // Stati per il modal di scommessa
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showBettingConfirmModal, setShowBettingConfirmModal] = useState(false);
  const [bettingSteps, setBettingSteps] = useState<BettingStep[]>([]);
  const [currentBettingStep, setCurrentBettingStep] = useState(0);
  const [bettingTransactionHash, setBettingTransactionHash] = useState<string>('');
  const [bettingError, setBettingError] = useState<string>('');

  // Inizializza i passi della scommessa
  const initializeBettingSteps = (): BettingStep[] => [
    {
      id: 'preparation',
      title: 'Preparazione Prediction',
      description: `Validazione scommessa: ${selectedPosition === 'yes' ? 'SÌ' : 'NO'} per ${betAmount} BNB`,
      status: 'pending'
    },
    {
      id: 'wallet',
      title: 'Firma Transazione',
      description: `Firma la transazione nel wallet per scommettere ${betAmount} BNB`,
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
      title: 'Salvataggio Database',
      description: 'Salvataggio prediction nel database...',
      status: 'pending'
    },
    {
      id: 'completed',
      title: 'Completato',
      description: 'Prediction piazzata con successo!',
      status: 'pending'
    }
  ];

  // Aggiorna lo stato di un passo
  const updateBettingStepStatus = (stepId: string, status: BettingStep['status'], error?: string) => {
    setBettingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, error }
        : step
    ));
  };
  
  // Dichiarazioni di stato principali
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook per i dati del contratto (disabilita polling durante scommessa e caricamento)
  const { recentBets: contractBets, poolStats: contractStats, loading: contractLoading } = useContractData(poolAddress, bettingLoading || loading);


  // Funzione per controllare se si può ancora scommettere
  const canStillBet = useMemo(() => {
    if (!prediction) return false;
    
    // Se c'è un pool_address, usa i dati del contratto (priorità assoluta)
    if (poolAddress && poolState) {
      // Usa le proprietà esistenti di PoolState
      const bettingOpen = poolState.isActive && !poolState.isPaused;
      const emergencyStop = poolState.isPaused;
      
      return bettingOpen && !emergencyStop;
    }
    
    // Se c'è un pool_address ma poolState non è ancora caricato, permette comunque
    // (il contratto gestirà la validazione)
    if (poolAddress) {
      return true;
    }
    
    // Fallback: controlla solo la data di chiusura scommesse (senza smart contract)
    // Controlla se la prediction è attiva
    if (prediction.status !== 'attiva') return false;
    
    // Controlla se la data di chiusura scommesse è nel futuro
    const now = new Date();
    const closingBid = new Date(prediction.closing_bid);
    
    return closingBid > now;
  }, [prediction, poolAddress, poolState]);
  const [topBettors, setTopBettors] = useState<BetData[]>([]);
  const [previousBettors, setPreviousBettors] = useState<BetData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [recentBets, setRecentBets] = useState<Array<{
    id: string;
    amount_bnb: number;
    position: 'yes' | 'no';
    created_at: string;
    username: string;
    prediction_title: string;
    prediction_slug: string;
  }>>([]);
  const [previousRecentBets, setPreviousRecentBets] = useState<Array<{
    id: string;
    amount_bnb: number;
    position: 'yes' | 'no';
    created_at: string;
    username: string;
    prediction_title: string;
    prediction_slug: string;
  }>>([]);
  const [previousPercentages, setPreviousPercentages] = useState<{
    yes: number;
    no: number;
  }>({ yes: 0, no: 0 });
  const [totalBetsAmount, setTotalBetsAmount] = useState<number>(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [recentLoading, setRecentLoading] = useState<boolean>(false);
  const [lastDataHash, setLastDataHash] = useState<string>('');
  const [lastRecentBetsHash, setLastRecentBetsHash] = useState<string>('');
  
  // Stati per i commenti
  const [commentLoading, setCommentLoading] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false);
  const [commentValidation, setCommentValidation] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: true });

  // Stato per tracciare se l'utente ha già scommesso
  const [userHasBet, setUserHasBet] = useState<boolean>(false);
  const [userBetInfo, setUserBetInfo] = useState<{
    amount: number;
    position: 'yes' | 'no';
    timestamp: string;
    tx_hash?: string;
  } | null>(null);


  // Calcola il controvalore in Euro
  const euroValue = betAmount && bnbPrice ? 
    (parseFloat(betAmount) * bnbPrice).toFixed(2) : 
    null;

  // Funzione per generare hash dei dati e controllare se sono cambiati
  const generateDataHash = (data: any) => {
    return JSON.stringify(data);
  };

  const hasDataChanged = (newData: any, lastHash: string) => {
    const newHash = generateDataHash(newData);
    return newHash !== lastHash;
  };

  // Funzione per calcolare il totale delle scommesse
  const calculateTotalBets = async (predictionId: string) => {
    try {
      const { data: bets, error } = await supabase
        .from('bets')
        .select('amount_bnb')
        .eq('prediction_id', predictionId);
      
      if (error) {
        console.warn('Error fetching bets for total:', error);
        return 0;
      }
      
      const total = bets?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;
      return total;
    } catch (error) {
      console.warn('Error calculating total bets:', error);
      return 0;
    }
  };

  useEffect(() => {
    // Non ricaricare durante il processo di betting
    if (showBettingModal || bettingLoading) {
      return;
    }
    
    loadPredictionData();
    loadRecentBets(true); // Refresh forzato al caricamento iniziale
    
    // Polling manuale ogni 5 minuti per aggiornamenti
    const interval = setInterval(() => {
      if (!showBettingModal && !bettingLoading) {
        loadRecentBets(true); // Refresh forzato ogni 5 minuti
      }
    }, 300000); // 5 minuti
    
    return () => clearInterval(interval);
  }, [params.slug, showBettingModal, bettingLoading]);

  // useEffect per caricare i commenti quando prediction è disponibile
  useEffect(() => {
    if (prediction) {
      loadComments();
      checkUserHasBet();
      loadWinnerInfo();
    }
  }, [prediction]);

  // useEffect per controllare le scommesse quando user diventa disponibile
  useEffect(() => {
    if (user?.id && prediction) {
      checkUserHasBet();
      // Se la pool è risolta, carica anche le info sul vincitore
      if (prediction.status === 'risolta') {
        loadWinnerInfo();
      }
    }
  }, [user?.id, prediction]);

  // useEffect per ricaricare le info del vincitore quando l'utente si connette/disconnette
  useEffect(() => {
    if (prediction && prediction.status === 'risolta' && poolAddress && isAuthenticated && address) {
      loadWinnerInfo();
    }
  }, [isAuthenticated, address, poolAddress]);

  // useEffect per controllare se l'utente ha già fatto claim del refund
  useEffect(() => {
    const checkRefundClaimStatus = async () => {
      if (prediction?.pool_address && address && user?.id) {
        try {
          // Controlla prima nel database se ha già fatto claim
          const { data: betData, error: betError } = await supabase
            .from('bets')
            .select('claim_tx_hash, amount_bnb')
            .eq('prediction_id', prediction.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (betData && betData.claim_tx_hash) {
            // Ha già fatto claim, mostra il messaggio con l'hash
            setUserHasClaimedRefund(true);
            setClaimTxHash(betData.claim_tx_hash);
            setUserBetAmountInBnb(betData.amount_bnb.toString());
            return;
          }
          
          // Se non ha fatto claim nel database, controlla il contratto
          const claimed = await hasClaimedRefund(prediction.pool_address, address);
          setUserHasClaimedRefund(claimed);
          
          // Se ha già fatto claim nel contratto, ottieni l'importo della scommessa
          if (claimed) {
            const userBet = await getUserBetFromContract(prediction.pool_address, address);
            if (userBet) {
              // Converti da Wei a BNB
              const amountInWei = BigInt(userBet.amount);
              const amountInBnb = Number(amountInWei) / 1e18;
              setUserBetAmountInBnb(amountInBnb.toFixed(4));
            }
          }
        } catch (error) {
          console.error('Errore nel controllo claim refund:', error);
        }
      }
    };
    checkRefundClaimStatus();
  }, [prediction?.pool_address, address, user?.id]);

  // useEffect per controllare se l'utente ha già fatto claim delle vincite (pool risolta)
  useEffect(() => {
    const checkWinningsClaimStatus = async () => {
      if (prediction?.pool_address && address && prediction?.status === 'risolta' && userWon === true && user?.id) {
        try {
          // Controlla prima nel database se ha già fatto claim
          const { data: betData, error: betError } = await supabase
            .from('bets')
            .select('claim_winning_tx_hash, winning_rewards_amount')
            .eq('prediction_id', prediction.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (betData && betData.claim_winning_tx_hash) {
            // Ha già fatto claim, mostra il messaggio con l'hash
            setUserHasClaimedWinnings(true);
            setClaimWinningsTxHash(betData.claim_winning_tx_hash);
            // Se c'è l'importo salvato, usalo per mostrarlo nel messaggio
            if (betData.winning_rewards_amount && userWinnings) {
              // userWinnings.reward è in Wei, convertiamolo in BNB se non è già nel formato corretto
              const savedReward = betData.winning_rewards_amount;
              setUserWinnings({
                totalWinnings: userWinnings.totalWinnings,
                betAmount: userWinnings.betAmount,
                reward: (savedReward * 1e18).toString() // Converti da BNB a Wei per consistenza
              });
            }
            return;
          }
          
          // Se non ha fatto claim nel database, controlla il contratto
          const claimed = await hasClaimedWinnings(prediction.pool_address, address);
          setUserHasClaimedWinnings(claimed);
        } catch (error) {
          console.error('Errore nel controllo claim vincite:', error);
        }
      }
    };
    checkWinningsClaimStatus();
  }, [prediction?.pool_address, address, prediction?.status, userWon, user?.id]);

  // Aggiorna solo quando i dati del contratto cambiano significativamente
  useEffect(() => {
    if (contractBets || contractStats) {
      const currentData = { contractBets, contractStats };
      
      // Controlla se i dati sono realmente cambiati
      if (hasDataChanged(currentData, lastDataHash)) {
        setLastDataHash(generateDataHash(currentData));
        // Non ricaricare automaticamente, aspetta il polling di 5 minuti
      }
    }
  }, [contractBets, contractStats]); // Rimosso lastDataHash dalle dipendenze per evitare loop

  // useEffect per reindirizzare alla homepage se il wallet si disconnette
  useEffect(() => {
    // Aggiungi un delay per evitare reindirizzamenti prematuri durante il refresh
    const timeoutId = setTimeout(() => {
      // Se l'utente era connesso e ora non lo è più, reindirizza alla homepage
      if (isAuthenticated === false && address === undefined) {
        router.push('/');
      }
    }, 5000); // 5 secondi di delay per dare tempo al sistema di caricare l'autenticazione

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, address, router]);

  const loadPredictionData = async () => {
    try {
      // Evita refresh troppo frequenti (minimo 5 secondi tra le chiamate)
      const now = Date.now();
      if (now - lastLoadTime < 5000) {
        return;
      }
      setLastLoadTime(now);
      
      setLoading(true);
      setError(null);

      // Carica i dati della prediction
      const { data: predictionData, error: predictionError } = await supabase
        .from('predictions')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (predictionError) {
        if (predictionError.code === 'PGRST116') {
          setError('Prediction non trovata');
        } else {
          throw predictionError;
        }
        return;
      }

      // Calcola le percentuali - prima prova dal contratto, poi fallback al database
      let stats = { yes_percentage: 0, no_percentage: 0, total_bets: 0 };
      
      // Se abbiamo dati dal contratto, usali
      if (contractStats) {
        const totalYes = Number(contractStats.totalYes) / 1e18; // Converti da wei
        const totalNo = Number(contractStats.totalNo) / 1e18; // Converti da wei
        const totalBets = totalYes + totalNo;
        
        stats = {
          yes_percentage: totalBets > 0 ? (totalYes / totalBets) * 100 : 0,
          no_percentage: totalBets > 0 ? (totalNo / totalBets) * 100 : 0,
          total_bets: totalBets
        };
      } else {
        // Fallback al database se non abbiamo dati dal contratto
        const { data: betStats } = await supabase
          .rpc('get_prediction_percentages', { prediction_uuid: predictionData.id });
        
        const dbStats = betStats?.[0] || { yes_percentage: 0, no_percentage: 0, total_bets: 0, total_amount_bnb: 0 };
        stats = {
          yes_percentage: dbStats.yes_percentage || 0,
          no_percentage: dbStats.no_percentage || 0,
          total_bets: dbStats.total_amount_bnb || 0 // Usa total_amount_bnb invece di total_bets
        };
        
        // Se non abbiamo dati dalla RPC, calcoliamo manualmente
        if (!betStats || betStats.length === 0) {
          const { data: manualBets } = await supabase
            .from('bets')
            .select('amount_bnb, position')
            .eq('prediction_id', predictionData.id);
          
          if (manualBets && manualBets.length > 0) {
            const totalAmount = manualBets.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0);
            const yesBets = manualBets.filter((bet: any) => bet.position === 'yes');
            const noBets = manualBets.filter((bet: any) => bet.position === 'no');
            const yesAmount = yesBets.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0);
            const noAmount = noBets.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0);
            
            stats = {
              yes_percentage: totalAmount > 0 ? (yesAmount / totalAmount) * 100 : 0,
              no_percentage: totalAmount > 0 ? (noAmount / totalAmount) * 100 : 0,
              total_bets: totalAmount
            };
          }
        }
      }

      // Rileva i cambiamenti nelle percentuali per l'animazione
      const newYesPercentage = stats.yes_percentage || 0;
      const newNoPercentage = stats.no_percentage || 0;
      const hasChanged = 
        Math.abs(newYesPercentage - previousPercentages.yes) > 0.1 ||
        Math.abs(newNoPercentage - previousPercentages.no) > 0.1;

      setPrediction({
        ...predictionData,
        yes_percentage: newYesPercentage,
        no_percentage: newNoPercentage,
        total_bets: stats.total_bets || 0
      });

          // I commenti verranno caricati tramite useEffect quando prediction è disponibile

      // Aggiorna le percentuali precedenti
      setPreviousPercentages({
        yes: newYesPercentage,
        no: newNoPercentage
      });

      // Calcola il totale delle scommesse
      const totalAmount = await calculateTotalBets(predictionData.id);
      setTotalBetsAmount(totalAmount);

      // Imposta il pool address se disponibile
      if (predictionData.pool_address) {
        setPoolAddress(predictionData.pool_address);
      }

      // Carica i top bettors via RPC (evita join PostgREST senza FK)
      try {
        const { data: bettorsRpcData, error: bettorsError } = await supabase
          .rpc('get_top_bettors', { prediction_uuid: predictionData.id, limit_count: 5 });

        if (bettorsError) {
          console.warn('Error loading top bettors:', bettorsError);
          setTopBettors([]);
        } else {
          // Mappa i campi RPC all'interfaccia UI
          const mappedBettors: BetData[] = (bettorsRpcData || []).map((row: any) => ({
            username: row.username,
            amount_bnb: Number(row.total_amount) || 0,
            position: row.bet_choice || 'yes' // Default a 'yes' se non specificato
          }));
          
          // Rileva i nuovi bettors per l'animazione
          const newBettors = mappedBettors.filter(bettor => 
            !previousBettors.some(prev => prev.username === bettor.username)
          );
          
          // Aggiorna i bettors precedenti
          setPreviousBettors(mappedBettors);
          setTopBettors(mappedBettors);
        }
      } catch (e) {
        console.warn('Error in top bettors RPC:', e);
        setTopBettors([]);
      }

      // I commenti vengono caricati dopo setPrediction

    } catch (error) {
      console.error('Error loading prediction data:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  // Funzione per risolvere l'username dall'indirizzo wallet
  const resolveUsername = async (walletAddress: string): Promise<string> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (error || !profile) {
        return 'Anonimo';
      }
      
      return profile.username || 'Anonimo';
    } catch (error) {
      console.warn('Error resolving username:', error);
      return 'Anonimo';
    }
  };

  // Carica le ultime scommesse del sito (globali) usando RPC o Smart Contract
  const loadRecentBets = async (forceRefresh: boolean = false) => {
    try {
      setRecentLoading(true);

      // Prima prova a caricare dal contratto se disponibile
      if (contractBets && contractBets.length > 0) {
        const currentBetsHash = generateDataHash(contractBets);
        
        // Controlla se i dati sono cambiati (a meno che non sia un refresh forzato)
        if (!forceRefresh && !hasDataChanged(contractBets, lastRecentBetsHash)) {
          setRecentLoading(false);
          return;
        }
        
        setLastRecentBetsHash(currentBetsHash);
        // Risolvi tutti gli username in parallelo
        const betsWithUsernames = await Promise.all(
          contractBets.map(async (bet: any) => {
            const username = await resolveUsername(bet.userAddress);
            return {
              id: `${bet.userAddress}-${bet.timestamp}`,
              amount_bnb: Number(bet.amount) / 1e18, // Converti da wei a BNB
              position: (bet.choice ? 'yes' : 'no') as 'yes' | 'no',
              created_at: new Date(Number(bet.timestamp) * 1000).toISOString(),
              username: username,
              prediction_title: prediction?.title || '',
              prediction_slug: prediction?.slug || ''
            };
          })
        );

        // Rileva le nuove scommesse per l'animazione
        const newRecentBets = betsWithUsernames.filter(bet => 
          !previousRecentBets.some(prev => prev.id === bet.id)
        );
        
        // Aggiorna le scommesse precedenti
        setPreviousRecentBets(betsWithUsernames);
        setRecentBets(betsWithUsernames);
        return;
      }

      // Fallback al database se il contratto non è disponibile o errore
      const { data: recentBetsData, error } = await supabase
        .rpc('get_recent_bets', { limit_count: 5 });

      if (error) {
        console.warn('Error calling get_recent_bets RPC:', error);
        setRecentBets([]);
        return;
      }

      // Controlla se i dati del database sono cambiati
      const currentDbHash = generateDataHash(recentBetsData);
      if (!forceRefresh && !hasDataChanged(recentBetsData, lastRecentBetsHash)) {
        setRecentLoading(false);
        return;
      }
      
      setLastRecentBetsHash(currentDbHash);

      // Mappa i dati dalla RPC al formato UI
      const mappedBets = (recentBetsData || []).map((bet: any) => ({
        id: bet.bet_id as string,
        amount_bnb: Number(bet.amount_bnb) || 0,
        position: (bet.position as 'yes' | 'no') ?? 'yes',
        created_at: bet.created_at as string,
        username: (bet.username as string) || 'Anonimo',
        prediction_title: (bet.prediction_title as string) || '',
        prediction_slug: (bet.prediction_slug as string) || ''
      }));

      // Rileva le nuove scommesse per l'animazione (fallback database)
      const newRecentBets = mappedBets.filter((bet: any) => 
        !previousRecentBets.some(prev => prev.id === bet.id)
      );
      
      // Aggiorna le scommesse precedenti
      setPreviousRecentBets(mappedBets);
      setRecentBets(mappedBets);
    } catch (e) {
      console.warn('Error loading recent bets:', e);
      setRecentBets([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const formatTimeAgoMinutes = (dateString: string): string => {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - then);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'ora';
    if (minutes < 60) return `${minutes}m fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h fa`;
    const days = Math.floor(hours / 24);
    return `${days}g fa`;
  };

  // Funzione per gestire l'invio dei commenti
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated || !address || !prediction) {
      setCommentError('Devi essere connesso per commentare');
      return;
    }

    // Validazione delle parole inappropriate
    const validation = validateComment(newComment);
    if (!validation.isValid) {
      setCommentError(validation.message || 'Commento non valido');
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError(null);
      setCommentSuccess(false);

      // Salva il commento nel database usando la funzione RPC
      const { data: commentId, error: commentError } = await supabase
        .rpc('create_comment', {
          prediction_uuid: prediction.id,
          comment_content: newComment.trim(),
          caller_wallet: address
        });

      if (commentError) {
        throw new Error(`Errore salvataggio commento: ${commentError.message}`);
      }

      // Reset del form
      setNewComment('');
      setCommentSuccess(true);

      // Ricarica i commenti per mostrare il nuovo commento
      await loadComments();

      // Scroll al bottom dopo aver inviato il commento
      setTimeout(scrollToBottom, 200);

      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setCommentSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setCommentError(errorMessage);
    } finally {
      setCommentLoading(false);
    }
  };

  // Funzione per scrollare al bottom della chat
  const scrollToBottom = () => {
    const chatContainer = document.getElementById('comments-chat');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  // Funzione per controllare se l'utente ha già scommesso
  const checkUserHasBet = async () => {
    if (!isAuthenticated || !address || !prediction || !user?.id) {
      setUserHasBet(false);
      setUserBetInfo(null);
      return;
    }

    try {
      // Controlla se l'utente ha già scommesso in questa prediction usando user_id
      const { data: userBets, error } = await supabase
        .from('bets')
        .select('id, amount_bnb, position, created_at, tx_hash')
        .eq('prediction_id', prediction.id)
        .eq('user_id', user?.id);

      if (error) {
        console.warn('Error checking user bets:', error);
        setUserHasBet(false);
        setUserBetInfo(null);
      } else {
        const hasBet = userBets && userBets.length > 0;
        setUserHasBet(hasBet);
        
        if (hasBet && userBets[0]) {
          // Salva i dettagli della scommessa
          setUserBetInfo({
            amount: userBets[0].amount_bnb,
            position: userBets[0].position,
            timestamp: userBets[0].created_at,
            tx_hash: userBets[0].tx_hash
          });
        } else {
          setUserBetInfo(null);
        }
      }
    } catch (e) {
      console.warn('Error checking user bets:', e);
      setUserHasBet(false);
      setUserBetInfo(null);
    }
  };

  // Funzione per caricare informazioni sul vincitore e vincite
  const loadWinnerInfo = async () => {
    if (!poolAddress || !prediction || prediction.status !== 'risolta') {
      return;
    }

    try {
      // Carica il vincitore dal contratto
      const winnerInfo = await getPoolWinner(poolAddress);
      if (winnerInfo) {
        setPoolWinner(winnerInfo.winner);
        
        // Se l'utente è connesso, calcola le vincite
        if (isAuthenticated && address) {
          const winnings = await calculateUserWinnings(poolAddress, address);
          
          if (winnings) {
            // L'utente ha vinto
            setUserWon(true);
            setUserWinnings(winnings);
          } else {
            // L'utente ha perso o non ha scommesso
            setUserWon(false);
            setUserWinnings(null);
          }
        }
      }
    } catch (error) {
      console.warn('Error loading winner info:', error);
    }
  };

  // Funzione per eliminare un commento (solo admin)
  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin || !commentId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        alert('Errore nell\'eliminazione del commento');
      } else {
        // Ricarica i commenti per aggiornare la lista
        await loadComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Errore nell\'eliminazione del commento');
    }
  };

  // Funzione per caricare i commenti
  const loadComments = async () => {
    if (!prediction) return;

    try {
      const { data: commentsRpcData, error: commentsError } = await supabase
        .rpc('get_prediction_comments', { prediction_uuid: prediction.id, limit_count: 5 });

      if (commentsError) {
        console.warn('Error loading comments:', commentsError);
        setComments([]);
      } else {
        setComments((commentsRpcData || []) as CommentData[]);
        // Scroll al bottom dopo aver caricato i commenti
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      console.warn('Error in comments RPC:', e);
      setComments([]);
    }
  };

  // Funzione per validare il commento in tempo reale
  const handleCommentChange = (text: string) => {
    setNewComment(text);
    
    if (text.trim().length === 0) {
      setCommentValidation({ isValid: true });
      setCommentError(null);
      return;
    }

    const validation = validateComment(text);
    setCommentValidation(validation);
    
    // Se c'è un errore di validazione, mostra anche l'errore principale
    if (!validation.isValid) {
      setCommentError(validation.message || 'Commento non valido');
    } else {
      setCommentError(null);
    }
  };

  // Funzione per gestire le scommesse con modal di progresso
  const handleBet = async () => {
    if (!isAuthenticated || !address || !selectedPosition || !betAmount || !prediction) {
      alert('Devi essere connesso per piazzare una scommessa');
      return;
    }

    if (getBettingContainerStatus(prediction).type !== 'open') {
      alert('Le scommesse sono chiuse per questa prediction');
      return;
    }

    // Mostra modal di conferma prima di procedere
    setShowBettingConfirmModal(true);
  };

  // Funzione per confermare la scommessa
  const confirmBet = async () => {
    setShowBettingConfirmModal(false);

    // Inizializza il modal
    setBettingSteps(initializeBettingSteps());
    setCurrentBettingStep(0);
    setBettingTransactionHash('');
    setBettingError('');
    setShowBettingModal(true);
    setBettingLoading(true);

    try {
      // Step 1: Preparazione
      updateBettingStepStatus('preparation', 'loading');
      setCurrentBettingStep(1);
      
      // Validazione parametri
      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Importo non valido');
      }

      // Validazione frontend sufficiente - il contratto impedisce doppie scommesse
      

      updateBettingStepStatus('preparation', 'completed');

      // Step 2: Invio al wallet
      updateBettingStepStatus('wallet', 'loading');
      setCurrentBettingStep(2);

      // Chiama la funzione reale del contratto
      const result = await placeBet(poolAddress, selectedPosition === 'yes', amount.toString());
      setBettingTransactionHash(result.hash);
      
      updateBettingStepStatus('wallet', 'completed');

      // Step 3: Conferma blockchain
      updateBettingStepStatus('blockchain', 'loading');
      setCurrentBettingStep(3);

      // La conferma è già inclusa nel result.receipt
      
      updateBettingStepStatus('blockchain', 'completed');

      // Step 4: Salvataggio database
      updateBettingStepStatus('database', 'loading');
      setCurrentBettingStep(4);

      // Salva nel database usando la funzione RPC esistente
      const { data: betId, error: dbError } = await supabase
        .rpc('create_bet', {
          prediction_uuid: prediction!.id,
          bet_amount: amount,
          bet_position: selectedPosition,
          caller_wallet: address
        });
      
      if (dbError) {
        throw new Error(`Errore salvataggio database: ${dbError.message}`);
      }
      
      // Aggiorna il tx_hash della bet appena creata
      if (betId && result.hash) {
        await supabase
          .from('bets')
          .update({ tx_hash: result.hash })
          .eq('id', betId);
        
        // Ricarica le informazioni dell'utente per includere il tx_hash
        await checkUserHasBet();
      }

      updateBettingStepStatus('database', 'completed');

      // Step 5: Completato
      updateBettingStepStatus('completed', 'loading');
      setCurrentBettingStep(5);

      updateBettingStepStatus('completed', 'completed');

      // Reset form
      setBetAmount('');
      setSelectedPosition(undefined);
      
      // Aggiorna lo stato delle scommesse dell'utente
      setUserHasBet(true);

    } catch (error) {
      console.error('Error in handleBet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setBettingError(errorMessage);
      
      // Marca l'ultimo step come errore
      const currentStepId = bettingSteps[currentBettingStep - 1]?.id;
      if (currentStepId) {
        updateBettingStepStatus(currentStepId, 'error', errorMessage);
      }
    } finally {
      setBettingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Caricamento...
            </h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Prediction non trovata'}
            </h1>
            <Link href="/" className="text-primary hover:underline">
              Torna alla homepage
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="mb-8 flex justify-start">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            HOME
          </button>
        </div>

        {/* Header della prediction */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
              {prediction.category}
            </span>
            {/* Status della prediction */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPredictionStatus(prediction).bgColor}`}>
              {getPredictionStatus(prediction).emoji} {getPredictionStatus(prediction).displayText}
            </span>
          </div>

          {/* Immagine e contenuto */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Immagine */}
            {prediction.image_url && (
              <div className="flex-shrink-0">
                <img
                  src={prediction.image_url}
                  alt={prediction.title}
                  className="w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                />
              </div>
            )}
            
            {/* Testo */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {prediction.title}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                {prediction.description}
              </p>

              {/* Pool Address - solo se attiva */}
              {prediction.status === 'attiva' && poolAddress && (
                <div className="inline-flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pool:</span>
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-200">
                    {poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}
                  </code>
                  <a
                    href={`https://testnet.bscscan.com/address/${poolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    title="Visualizza su BSCScan"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Percentuali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center p-6 bg-yes-button/10 dark:bg-yes-button/20 rounded-xl">
              <div className={`text-4xl font-bold text-yes-button mb-2 transition-all duration-500 ${
                Math.abs(prediction.yes_percentage - previousPercentages.yes) > 0.1 
                  ? 'animate-pulse-slow' 
                  : ''
              }`}>
                {prediction.yes_percentage}%
              </div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">Sì</div>
            </div>
            <div className="text-center p-6 bg-no-button/10 dark:bg-no-button/20 rounded-xl">
              <div className={`text-4xl font-bold text-no-button mb-2 transition-all duration-500 ${
                Math.abs(prediction.no_percentage - previousPercentages.no) > 0.1 
                  ? 'animate-pulse-slow' 
                  : ''
              }`}>
                {prediction.no_percentage}%
              </div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">No</div>
            </div>
          </div>

          {/* Barra di progresso */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-8">
            <div 
              className={`bg-yes-button h-4 rounded-full transition-all duration-500 ${
                Math.abs(prediction.yes_percentage - previousPercentages.yes) > 0.1 
                  ? 'animate-pulse-slow' 
                  : ''
              }`}
              style={{ width: `${prediction.yes_percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Box per scommettere */}
          <div className="lg:col-span-1">
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    const containerStatus = getBettingContainerStatus(prediction);
                    if (containerStatus.highlightText) {
                      const parts = containerStatus.message.split(containerStatus.highlightText);
                      return (
                        <>
                          {parts[0]}
                          <span className="text-yellow-500 font-extrabold text-2xl drop-shadow-lg" style={{
                            textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000'
                          }}>
                            {containerStatus.highlightText}
                          </span>
                          {parts[1]}
                        </>
                      );
                    }
                    const text = containerStatus.type === 'cancelled' ? containerStatus.status : containerStatus.message;
                    if (containerStatus.type === 'closed_waiting') {
                      return <span className="text-yellow-500 font-bold text-2xl">{text}</span>;
                    }
                    return text;
                  })()}
                </h3>
                {poolAddress && poolState && (
                  <button
                    onClick={() => poolState.refreshContractState?.()}
                    disabled={poolState.isRefreshing}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                    title="Aggiorna stato contratto"
                  >
                    <span className="text-lg">
                      {poolState.isRefreshing ? '⏳' : '↻'}
                    </span>
                  </button>
                )}
              </div>

              {/* Stato del contratto */}
              {poolAddress && poolState && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Stato Contratto:
                    </span>
                    <span className={`font-bold ${
                      poolState.statusText === 'ATTIVA' ? 'text-green-600' :
                      poolState.statusText === 'CHIUSA' ? 'text-yellow-600' :
                      poolState.statusText === 'IN PAUSA' ? 'text-yellow-600' :
                      poolState.statusText === 'SCOMMESSE CHIUSE' ? 'text-yellow-600' :
                      poolState.statusText === 'ATTESA RISULTATI' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {poolState.statusIcon} {poolState.statusText}
                    </span>
                  </div>
                  {poolState.lastUpdate && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
                      <span>Ultimo aggiornamento: {new Date(poolState.lastUpdate).toLocaleTimeString('it-IT')}</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs">Live</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Avviso se l'utente ha già scommesso - Non mostrare se la pool è cancellata o risolta */}
              {userHasBet && getBettingContainerStatus(prediction).type !== 'cancelled' && getBettingContainerStatus(prediction).type !== 'resolved' && (
                <div className="mb-6 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Hai già eseguito la tua prediction in questa pool.
                      </h3>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p>Non puoi scommettere più volte sulla stessa prediction.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Avviso basato sullo status del container */}
              {(() => {
                const containerStatus = getBettingContainerStatus(prediction);
                
                // Mostra avviso solo se non è "open" (scommesse aperte)
                if (containerStatus.type === 'open') return null;
                
                return (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    containerStatus.type === 'paused'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : containerStatus.type === 'closed_waiting'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : containerStatus.type === 'resolved'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : containerStatus.type === 'cancelled'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : containerStatus.type === 'ended'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  }`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className={`h-5 w-5 ${
                          containerStatus.type === 'paused'
                            ? 'text-yellow-500'
                            : containerStatus.type === 'closed_waiting'
                            ? 'text-yellow-400'
                            : containerStatus.type === 'resolved'
                            ? 'text-green-400'
                            : containerStatus.type === 'cancelled'
                            ? 'text-yellow-400'
                            : containerStatus.type === 'ended'
                            ? 'text-blue-400'
                            : 'text-gray-400'
                        }`} viewBox="0 0 20 20" fill="currentColor">
                          {containerStatus.type === 'resolved' ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          ) : containerStatus.type === 'cancelled' ? (
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          )}
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${
                          containerStatus.type === 'paused'
                            ? 'text-yellow-500 font-bold text-lg'
                            : containerStatus.type === 'closed_waiting'
                            ? 'text-yellow-500 font-bold text-lg'
                            : containerStatus.type === 'resolved'
                            ? 'text-green-800 dark:text-green-200'
                            : containerStatus.type === 'cancelled'
                            ? 'text-yellow-800 dark:text-yellow-200'
                            : containerStatus.type === 'ended'
                            ? 'text-blue-800 dark:text-blue-200'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {containerStatus.type === 'paused' || containerStatus.type === 'closed_waiting' ? 'Segui gli aggiornamenti e attendi i risultati' : containerStatus.type === 'cancelled' ? 'Puoi fare il claim dei tuoi fondi se avevi fatto una prediction' : containerStatus.status}
                        </h3>
                        {/* Non mostrare il messaggio duplicato quando è risolta (il check verde lo mostra già) */}
                        {containerStatus.type !== 'paused' && containerStatus.type !== 'cancelled' && containerStatus.type !== 'closed_waiting' && containerStatus.type !== 'resolved' && (
                          <div className={`mt-2 text-sm ${
                            containerStatus.type === 'closed_waiting'
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : containerStatus.type === 'resolved'
                              ? 'text-green-700 dark:text-green-300'
                              : containerStatus.type === 'cancelled'
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : containerStatus.type === 'ended'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            <p>{containerStatus.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mostra vincitore e risultato utente se pool è risolta */}
                    {containerStatus.type === 'resolved' && poolWinner !== null && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        {/* Check verde con "I risultati sono disponibili" */}
                        <div className="mb-3 flex items-center space-x-2">
                          <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                            I risultati sono disponibili
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                            Vincitore: {poolWinner ? 'SÌ 🟢' : 'NO 🔴'}
                          </span>
                        </div>
                        
                        {/* Se l'utente è connesso e ha scommesso, mostra il risultato */}
                        {isAuthenticated && address && userHasBet && (
                          <div className="mt-2">
                            {userWon === true && userWinnings ? (
                              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-xl">🎉</span>
                                  <span className="font-bold text-green-800 dark:text-green-200">HAI VINTO!</span>
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300">
                                  <div className="flex justify-between items-center mb-1">
                                    <span>Importo scommesso:</span>
                                    <span className="font-bold">{(Number(userWinnings.betAmount) / 1e18).toFixed(4)} BNB</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span>Vincita:</span>
                                    <span className="font-bold">{(Number(userWinnings.reward) / 1e18).toFixed(4)} BNB</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-green-300 dark:border-green-700 mt-2">
                                    <span className="font-semibold">Totale da ricevere:</span>
                                    <span className="font-bold text-green-800 dark:text-green-200">{(Number(userWinnings.totalWinnings) / 1e18).toFixed(4)} BNB</span>
                                  </div>
                                </div>
                              </div>
                            ) : userWon === false ? (
                              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-xl">😔</span>
                                  <span className="font-bold text-red-800 dark:text-red-200">HAI PERSO</span>
                                </div>
                                <div className="text-sm text-red-700 dark:text-red-300">
                                  La tua previsione non si è verificata. Grazie per aver partecipato!
                                </div>
                              </div>
                            ) : userBetInfo ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Hai scommesso {userBetInfo.amount} BNB su {userBetInfo.position === 'yes' ? 'SÌ' : 'NO'}
                              </div>
                            ) : null}
                          </div>
                        )}
                        
                        {/* Se l'utente non ha scommesso */}
                        {!(isAuthenticated && userHasBet) && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                            {isAuthenticated ? 'Non hai scommesso su questa prediction' : 'Connetti il wallet per vedere il tuo risultato'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Area Aggiornamenti - Mostra quando le scommesse sono chiuse */}
              {getBettingContainerStatus(prediction).type !== 'open' && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Aggiornamenti:
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    {prediction?.notes ? (
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {prediction.notes}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Nessun aggiornamento disponibile al momento.
                      </div>
                    )}
                  </div>
                  
                  {/* Messaggio per pool cancellata se utente non ha scommesso */}
                  {getBettingContainerStatus(prediction).type === 'cancelled' && !userHasBet && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Non hai nulla da claimare
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Area Claim Vincite - Mostra quando la pool è risolta e l'utente ha vinto */}
              {getBettingContainerStatus(prediction).type === 'resolved' && userWon === true && userWinnings && (
                <div className="space-y-4 mb-6">
                  {userHasClaimedWinnings ? (
                    /* Messaggio se ha già fatto claim */
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-green-800 dark:text-green-200">
                          ✅ Hai già fatto il claim delle tue vincite!
                        </span>
                      </div>
                      {userWinnings && userWinnings.reward && (
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          Ricompensa: {(Number(userWinnings.reward) / 1e18).toFixed(4)} BNB
                        </p>
                      )}
                      {claimWinningsTxHash && (
                        <a 
                          href={`https://testnet.bscscan.com/tx/${claimWinningsTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 underline hover:text-green-800 dark:hover:text-green-200 text-sm"
                        >
                          Visualizza la TX
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Pulsante Claim */
                    <button
                      onClick={async () => {
                        if (!isAuthenticated || !address || !prediction?.pool_address) {
                          alert('Devi essere connesso per reclamare le vincite');
                          return;
                        }
                        
                        try {
                          // Inizializza i passi del modal
                          const steps: TransactionStep[] = [
                            { 
                              id: 'prepare', 
                              title: 'Preparazione transazione', 
                              description: `Preparazione del claim di ${(Number(userWinnings.totalWinnings) / 1e18).toFixed(4)} BNB...`, 
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
                            }
                          ];
                          
                          setClaimWinningsSteps(steps);
                          setCurrentClaimWinningsStep(0);
                          setClaimWinningsError('');
                          setClaimWinningsTransactionHash('');
                          setShowClaimWinningsModal(true);
                          
                          setClaimWinningsLoading(true);
                          
                          // Step 1: Preparazione
                          setClaimWinningsSteps(prev => prev.map(step => step.id === 'prepare' ? { ...step, status: 'completed' } : step));
                          setCurrentClaimWinningsStep(1);
                          
                          // Step 2: Firma e invio
                          setClaimWinningsSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'loading' } : step));
                          
                          const txHash = await claimWinnings(prediction.pool_address);
                          
                          setClaimWinningsSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'completed' } : step));
                          setCurrentClaimWinningsStep(2);
                          setClaimWinningsTransactionHash(txHash);
                          setClaimWinningsTxHash(txHash);
                          
                          // Salva l'hash della transazione e l'importo della ricompensa nel database
                          const winningRewardInBnb = userWinnings ? Number(userWinnings.reward) / 1e18 : 0;
                          const { error: dbError } = await supabase
                            .from('bets')
                            .update({ 
                              claim_winning_tx_hash: txHash,
                              winning_rewards_amount: winningRewardInBnb
                            })
                            .eq('prediction_id', prediction.id)
                            .eq('user_id', user.id);
                          
                          if (dbError) {
                            console.error('Errore nel salvataggio hash claim vincite:', dbError);
                          }
                          
                          // Aggiorna lo stato che l'utente ha fatto il claim
                          setUserHasClaimedWinnings(true);
                          
                          // Step 3: Conferma
                          setClaimWinningsSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'loading' } : step));
                          
                          // Attendi conferma
                          setClaimWinningsSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'completed' } : step));
                          setCurrentClaimWinningsStep(steps.length);
                        } catch (error: any) {
                          console.error('Errore durante il claim delle vincite:', error);
                          setClaimWinningsError(`Errore durante il claim: ${error.message || 'Errore sconosciuto'}`);
                          setClaimWinningsSteps(prev => prev.map(step => ({
                            ...step,
                            status: step.status === 'loading' ? 'error' : step.status
                          })));
                        } finally {
                          setClaimWinningsLoading(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={claimWinningsLoading}
                    >
                      {claimWinningsLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>⏳ Elaborazione...</span>
                        </>
                      ) : (
                        <span>💰 Reclama le tue vincite ({(Number(userWinnings.totalWinnings) / 1e18).toFixed(4)} BNB)</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Area Claim Refund - Mostra quando la pool è cancellata */}
              {getBettingContainerStatus(prediction).type === 'cancelled' && userHasBet && (
                <div className="space-y-4 mb-6">
                  {userHasClaimedRefund ? (
                    /* Messaggio se ha già fatto claim */
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-green-800 dark:text-green-200 mb-2">
                        ✅ Hai già fatto il claim di {userBetAmountInBnb || userBetAmount} BNB
                      </p>
                      {claimTxHash && (
                        <a 
                          href={`https://testnet.bscscan.com/tx/${claimTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 underline hover:text-green-800 dark:hover:text-green-200"
                        >
                          Visualizza la TX
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Pulsante Claim */
                    <button
                    onClick={async () => {
                      if (!isAuthenticated || !address || !prediction?.pool_address) {
                        alert('Devi essere connesso per recuperare i fondi');
                        return;
                      }
                      
                      try {
                        // Ottieni l'importo della scommessa dell'utente
                        const userBet = await getUserBetFromContract(prediction.pool_address, address!);
                        let betAmountInBnb = '0';
                        if (userBet) {
                          // Converti da Wei a BNB (userBet.amount è in Wei)
                          const amountInWei = BigInt(userBet.amount);
                          const amountInBnb = Number(amountInWei) / 1e18;
                          betAmountInBnb = amountInBnb.toFixed(4);
                          setUserBetAmount(betAmountInBnb);
                        }
                        
                        // Inizializza i passi del modal
                        const steps: TransactionStep[] = [
                          { 
                            id: 'prepare', 
                            title: 'Preparazione transazione', 
                            description: `Preparazione del recupero di ${betAmountInBnb} BNB...`, 
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
                          }
                        ];
                        
                        setClaimRefundSteps(steps);
                        setCurrentClaimRefundStep(0);
                        setClaimRefundError('');
                        setClaimRefundTransactionHash('');
                        setShowClaimRefundModal(true);
                        
                        setClaimRefundLoading(true);
                        
                        // Step 1: Preparazione transazione
                        await new Promise(resolve => setTimeout(resolve, 500));
                        setClaimRefundSteps(prev => prev.map(step => step.id === 'prepare' ? { ...step, status: 'completed' } : step));
                        setCurrentClaimRefundStep(1);
                        
                        // Step 2: Firma transazione
                        await new Promise(resolve => setTimeout(resolve, 500));
                        setClaimRefundSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'loading' } : step));
                        
                        const txHash = await claimRefund(prediction.pool_address);
                        
                        setClaimRefundSteps(prev => prev.map(step => step.id === 'sign' ? { ...step, status: 'completed' } : step));
                        setCurrentClaimRefundStep(2);
                        setClaimRefundTransactionHash(txHash);
                        setClaimTxHash(txHash);
                        
                        // Salva l'hash della transazione nel database
                        const { error: dbError } = await supabase
                          .from('bets')
                          .update({ claim_tx_hash: txHash })
                          .eq('prediction_id', prediction.id)
                          .eq('user_id', user.id);
                        
                        if (dbError) {
                          console.error('Errore nel salvataggio hash claim:', dbError);
                        }
                        
                        // Aggiorna lo stato che l'utente ha fatto il claim
                        setUserHasClaimedRefund(true);
                        
                        // Step 3: Conferma transazione
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setClaimRefundSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'loading' } : step));
                        
                        // Attendi conferma (claimRefund ritorna solo l'hash, non attendiamo il wait)
                        setClaimRefundSteps(prev => prev.map(step => step.id === 'confirm' ? { ...step, status: 'completed' } : step));
                        setCurrentClaimRefundStep(steps.length);
                        
                      } catch (error: any) {
                        console.error('Errore nel recupero dei fondi:', error);
                        setClaimRefundError(`Log funzione Claim Refund: ${error.message || 'Errore durante il recupero dei fondi'}`);
                        setClaimRefundSteps(prev => prev.map(step => ({
                          ...step,
                          status: step.status === 'loading' ? 'error' : step.status
                        })));
                      } finally {
                        setClaimRefundLoading(false);
                      }
                    }}
                    disabled={claimRefundLoading}
                    className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                      claimRefundLoading
                        ? 'bg-yellow-400 text-white cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    {claimRefundLoading ? '⏳ Elaborazione...' : '🪙 Recupera i tuoi fondi'}
                  </button>
                  )}
                </div>
              )}

              {/* Area Scommesse - Mostra solo quando le scommesse sono aperte */}
              {getBettingContainerStatus(prediction).type === 'open' && !userHasBet && (
                <>
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => setSelectedPosition('yes')}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        selectedPosition === 'yes'
                          ? 'bg-yes-button text-white'
                          : 'bg-yes-button/10 text-yes-button hover:bg-yes-button/20'
                      }`}
                    >
                      Sì ({prediction.yes_percentage}%)
                    </button>
                    <button
                      onClick={() => setSelectedPosition('no')}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        selectedPosition === 'no'
                          ? 'bg-no-button text-white'
                          : 'bg-no-button/10 text-no-button hover:bg-no-button/20'
                      }`}
                    >
                      No ({prediction.no_percentage}%)
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Importo (BNB)
                      </label>
                      {isAuthenticated && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Saldo: {balanceLoading ? '...' : `${bnbBalance} BNB`}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    
                    {/* Preview del controvalore in Euro */}
                    {betAmount && bnbPrice && !priceLoading && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Controvalore in Euro:
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            €{euroValue}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          1 BNB = €{bnbPrice.toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    {priceLoading && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Caricamento prezzo BNB...
                      </div>
                    )}
                    
                    {priceError && (
                      <div className="mt-2 text-sm text-red-500">
                        Errore nel caricamento del prezzo
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBet}
                    disabled={!selectedPosition || !betAmount || bettingLoading || !isAuthenticated}
                    className={`w-full font-medium py-3 px-4 rounded-lg border transition-colors duration-200 ${
                      !selectedPosition || !betAmount || !isAuthenticated
                        ? 'bg-gray-300 disabled:cursor-not-allowed text-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                        : bettingLoading
                        ? 'bg-blue-500 text-white border-blue-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                    }`}
                  >
                    {bettingLoading ? 'Elaborazione...' : 
                     !isAuthenticated
                      ? 'Connetti Wallet'
                      : !selectedPosition || !betAmount
                      ? 'Seleziona posizione e importo'
                      : 'Piazza la tua scommessa'
                    }
                  </button>
                </>
              )}
            </div>

            {/* La tua Prediction - appare solo se userBetInfo esiste */}
            {userBetInfo && (
              <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6 mt-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  La tua prediction
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Importo:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {userBetInfo.amount} BNB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Scelta:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userBetInfo.position === 'yes' 
                        ? 'bg-yes-button/10 text-yes-button' 
                        : 'bg-no-button/10 text-no-button'
                    }`}>
                      {userBetInfo.position === 'yes' ? 'Sì' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userBetInfo.timestamp).toLocaleString('it-IT')}
                    </span>
                  </div>
                  {userBetInfo.tx_hash && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Transazione:</span>
                      <a 
                        href={`https://testnet.bscscan.com/tx/${userBetInfo.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Visualizza su BSCScan
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top scommettitori */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Top Degens
              </h3>
              <div className="space-y-3">
                {topBettors.length > 0 ? (
                  topBettors.map((bettor, index) => {
                    // Rileva se è un nuovo bettor per l'animazione
                    const isNewBettor = !previousBettors.some(prev => prev.username === bettor.username);
                    
                    return (
                      <div 
                        key={`bettor-${index}`} 
                        className={`bettor-item flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                          isNewBettor ? 'animate-slide-in' : ''
                        }`}
                      >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        {isNewBettor && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 animate-pulse-slow">
                            ✨ Nuovo
                          </span>
                        )}
                        <span className="text-gray-900 dark:text-white font-medium">
                          {bettor.username}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bettor.position === 'yes' 
                            ? 'bg-yes-button/10 text-yes-button' 
                            : 'bg-no-button/10 text-no-button'
                        }`}>
                          {bettor.position === 'yes' ? 'Sì' : 'No'}
                        </span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {bettor.amount_bnb} BNB
                      </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Nessuna scommessa ancora
                  </div>
                )}
              </div>
            </div>

            {/* Ultime scommesse del sito */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🔥 Ultime predictions
              </h3>
              <div className="space-y-3">
                {recentLoading && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                )}
                {!recentLoading && recentBets.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nessuna prediction presente</div>
                )}
                {!recentLoading && recentBets.map((bet) => {
                  // Rileva se è una nuova scommessa per l'animazione
                  const isNewBet = !previousRecentBets.some(prev => prev.id === bet.id);
                  
                  return (
                    <Link 
                      key={bet.id} 
                      href={`/bellanapoli.prediction/${bet.prediction_slug}`}
                      className={`bet-item flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${
                        isNewBet ? 'animate-slide-in' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isNewBet && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 animate-pulse-slow">
                            🆕 Nuovo
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white font-medium text-sm">{bet.username}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgoMinutes(bet.created_at)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bet.position === 'yes' ? 'bg-yes-button/10 text-yes-button' : 'bg-no-button/10 text-no-button'}`}>
                          {bet.position === 'yes' ? 'Sì' : 'No'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 dark:text-white font-bold text-sm">{bet.amount_bnb} BNB</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{bet.prediction_title}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenuto principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dettagli evento */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Dettagli evento
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-left">Puoi scommettere entro il:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-left sm:text-right">
                    {prediction.closing_date ? new Date(prediction.closing_date).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) + ', ore ' + new Date(prediction.closing_date).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Rome'
                    }) : 'Non specificato'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-left">Scadenza:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-left sm:text-right">
                    {prediction.closing_bid ? new Date(prediction.closing_bid).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) + ', ore ' + new Date(prediction.closing_bid).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Rome'
                    }) : 'Non specificato'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-400">Categoria:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{prediction.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 dark:text-gray-400">Stato:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPredictionStatus(prediction).bgColor}`}>
                    {getPredictionStatus(prediction).emoji} {getPredictionStatus(prediction).displayText}
                  </span>
                </div>
                {prediction.rules && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Regolamento:</span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{prediction.rules}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grafico andamento quote */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                <span className="hidden sm:inline">📊 Grafico delle Predictions</span>
                <span className="sm:hidden">📊 Dati sulle Predictions</span>
              </h3>
              {prediction ? (
                <QuoteChart 
                  yesPercentage={prediction.yes_percentage}
                  noPercentage={prediction.no_percentage}
                  totalBetsAmount={totalBetsAmount}
                  betCount={contractBets?.length || 0}
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    📊 Caricamento dati...
                  </p>
                </div>
              )}
            </div>

            {/* Commenti */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Commenti
              </h3>

              {/* Aggiungi commento */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder={isAuthenticated ? "Aggiungi un commento..." : "Devi essere connesso per commentare"}
                  disabled={!isAuthenticated || commentLoading}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    !isAuthenticated || commentLoading
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : commentValidation.isValid
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white'
                        : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white'
                  }`}
                  rows={3}
                />
                
                {/* Messaggi di feedback */}
                {commentError && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{commentError}</p>
                  </div>
                )}
                
                {commentSuccess && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">✅ Commento pubblicato con successo!</p>
                  </div>
                )}
                
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || !isAuthenticated || commentLoading || !commentValidation.isValid}
                  className={`mt-3 font-medium py-2 px-4 rounded-lg border transition-colors duration-200 ${
                    !newComment.trim() || !isAuthenticated || commentLoading || !commentValidation.isValid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                      : 'bg-primary hover:bg-primary/90 text-white border-primary'
                  }`}
                >
                  {commentLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Pubblicando...</span>
                    </div>
                  ) : (
                    'Pubblica commento'
                  )}
                </button>
              </div>

              {/* Chat dei commenti */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-80 overflow-hidden">
                <div 
                  id="comments-chat" 
                  className="h-full overflow-y-auto p-4 space-y-3 scroll-smooth"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {comments.length > 0 ? (
                    comments.map((comment, index) => (
                      <div key={comment.comment_id || comment.id || `comment-${index}`} className="flex flex-col space-y-1 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {comment.username}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.created_at).toLocaleString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {/* Pulsante elimina per admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(comment.comment_id || comment.id || '')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Elimina commento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                          <p className="text-gray-800 dark:text-gray-200 text-sm">
                            {comment.text || comment.content || 'Commento non disponibile'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-2">💬</div>
                        <p className="text-sm">Nessun commento ancora</p>
                        <p className="text-xs mt-1">Sii il primo a commentare!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal di Conferma Scommessa */}
      {showBettingConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 mx-4 max-w-md w-full">
            {/* Content */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Stai per connetterti al tuo wallet
                </h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Ecco i BNB che stai inviando firmando la TX!
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300">Importo:</span>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{betAmount} BNB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300">Scelta:</span>
                    <span className={`text-lg font-bold ${selectedPosition === 'yes' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {selectedPosition === 'yes' ? 'SÌ' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🎭</span>
                  <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    Buona fortuna!
                  </p>
                  <span className="text-2xl">🎭</span>
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="mt-4">
                <p className="text-sm text-white dark:text-gray-200 text-center">
                  <span className="font-medium">Tooltip:</span> se procedi alla schermata successiva ma poi annulli la firma, controlla che la TX non rimanga in sospeso nel wallet.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBettingConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Annulla
              </button>
              <button
                onClick={confirmBet}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                 Procedi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal di Progresso Scommessa */}
      <BettingProgressModal
        isOpen={showBettingModal}
        onClose={() => setShowBettingModal(false)}
        steps={bettingSteps}
        currentStep={currentBettingStep}
        transactionHash={bettingTransactionHash}
        error={bettingError}
        betAmount={betAmount}
        betChoice={selectedPosition}
      />

      {/* Modal di Progresso Claim Refund */}
      <TransactionProgressModal
        isOpen={showClaimRefundModal}
        onClose={() => {
          setShowClaimRefundModal(false);
          window.location.reload();
        }}
        steps={claimRefundSteps}
        currentStep={currentClaimRefundStep}
        transactionHash={claimRefundTransactionHash}
        contractAddress={prediction?.pool_address}
        error={claimRefundError}
      />

      {/* Modal di Progresso Claim Vincite */}
      <TransactionProgressModal
        isOpen={showClaimWinningsModal}
        onClose={() => {
          setShowClaimWinningsModal(false);
          window.location.reload();
        }}
        steps={claimWinningsSteps}
        currentStep={currentClaimWinningsStep}
        transactionHash={claimWinningsTransactionHash}
        contractAddress={prediction?.pool_address}
        error={claimWinningsError}
        title="🚀 Claim della vincita!"
      />
    </div>
  );
}
