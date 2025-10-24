"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBNBPrice } from '@/hooks/useBNBPrice';
import { usePoolState } from '@/hooks/usePoolState';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
import { useBNBBalance } from '@/hooks/useBNBBalance';
import { useContractData } from '@/hooks/useContractData';
import { useAdmin } from '@/hooks/useAdmin';
import { placeBet } from '@/lib/contracts';
import { supabase } from '@/lib/supabase';
import { validateComment } from '@/lib/profanityFilter';
import BettingProgressModal, { BettingStep } from '@/components/BettingProgressModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuoteChart from '@/components/QuoteChart';
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
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  
  // Stati per il modal di scommessa
  const [showBettingModal, setShowBettingModal] = useState(false);
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

  // Hook per stato del pool (legge dal smart contract)
  const poolState = usePoolState(poolAddress, {
    winnerSet: prediction?.status === 'risolta',
    winner: false, // Da leggere dal contratto
    userBet: null, // Da leggere dal contratto
    emergencyStop: prediction?.status === 'in_pausa'
  });

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
    loadPredictionData();
    loadRecentBets(true); // Refresh forzato al caricamento iniziale
    
    // Polling manuale ogni 5 minuti per aggiornamenti
    const interval = setInterval(() => {
      loadRecentBets(true); // Refresh forzato ogni 5 minuti
    }, 300000); // 5 minuti
    
    return () => clearInterval(interval);
  }, [params.slug]);

  // useEffect per caricare i commenti quando prediction è disponibile
  useEffect(() => {
    if (prediction) {
      console.log('useEffect: Prediction available, loading comments...');
      loadComments();
      checkUserHasBet();
    }
  }, [prediction]);

  // useEffect per controllare le scommesse quando user diventa disponibile
  useEffect(() => {
    if (user?.id && prediction) {
      console.log('useEffect: User available, checking bets...');
      checkUserHasBet();
    }
  }, [user?.id, prediction]);

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
  }, [contractBets, contractStats, lastDataHash]);

  // useEffect per reindirizzare alla homepage se il wallet si disconnette
  useEffect(() => {
    // Aggiungi un delay per evitare reindirizzamenti prematuri durante il refresh
    const timeoutId = setTimeout(() => {
      // Se l'utente era connesso e ora non lo è più, reindirizza alla homepage
      if (isAuthenticated === false && address === undefined) {
        console.log('Wallet disconnesso, reindirizzamento alla homepage...');
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
          .rpc('get_top_bettors', { prediction_uuid: predictionData.id, limit_count: 10 });

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
        .rpc('get_recent_bets', { limit_count: 10 });

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

    console.log('checkUserHasBet: Checking bets for user:', user.id, 'prediction:', prediction.id);

    try {
      // Controlla se l'utente ha già scommesso in questa prediction usando user_id
      const { data: userBets, error } = await supabase
        .from('bets')
        .select('id, amount_bnb, position, created_at')
        .eq('prediction_id', prediction.id)
        .eq('user_id', user?.id);

      console.log('checkUserHasBet: Query result:', userBets, 'error:', error);

      if (error) {
        console.warn('Error checking user bets:', error);
        setUserHasBet(false);
        setUserBetInfo(null);
      } else {
        const hasBet = userBets && userBets.length > 0;
        console.log('checkUserHasBet: User has bet:', hasBet);
        setUserHasBet(hasBet);
        
        if (hasBet && userBets[0]) {
          // Salva i dettagli della scommessa
          setUserBetInfo({
            amount: userBets[0].amount_bnb,
            position: userBets[0].position,
            timestamp: userBets[0].created_at
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

  // Funzione per eliminare un commento (solo admin)
  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin || !commentId) return;

    console.log('Deleting comment with ID:', commentId);

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        alert('Errore nell\'eliminazione del commento');
      } else {
        console.log('Comment deleted successfully');
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
        .rpc('get_prediction_comments', { prediction_uuid: prediction.id, limit_count: 10 });

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

    if (!canStillBet) {
      alert('Le scommesse sono chiuse per questa prediction');
      return;
    }

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

      // Validazione aggiuntiva con contratto (se disponibile)
      if (poolAddress) {
        try {
          const { canUserBet } = await import('@/lib/contracts');
          const betCheck = await canUserBet(poolAddress, address);
          if (!betCheck.canBet) {
            throw new Error(betCheck.reason);
          }
        } catch (contractError) {
          console.warn('Contract validation failed, proceeding with basic validation:', contractError);
        }
      }
      

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
      console.log('Transazione confermata:', result.receipt);
      
      updateBettingStepStatus('blockchain', 'completed');

      // Step 4: Salvataggio database
      updateBettingStepStatus('database', 'loading');
      setCurrentBettingStep(4);

      // Salva nel database usando la funzione RPC esistente
      const { data: betId, error: dbError } = await supabase
        .rpc('create_bet', {
          prediction_uuid: prediction.id,
          bet_amount: amount,
          bet_position: selectedPosition,
          caller_wallet: address
        });

      if (dbError) {
        throw new Error(`Errore salvataggio database: ${dbError.message}`);
      }

      updateBettingStepStatus('database', 'completed');

      // Step 5: Completato
      updateBettingStepStatus('completed', 'loading');
      setCurrentBettingStep(5);

      // Ricarica i dati
      await loadPredictionData();
      await loadRecentBets(true); // Refresh forzato dopo scommessa

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
            {/* Stato del pool dal smart contract (REAL-TIME) */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              poolState.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              poolState.isPaused ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              poolState.isResolved ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              poolState.isCancelled ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {poolState.statusIcon} {poolState.statusText}
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

              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {prediction.description}
              </p>
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {prediction?.status === 'in_attesa' || prediction?.status === 'attiva' ? 'Fai la tua prediction' : 'Piazza la tua scommessa'}
              </h3>

              {/* Avviso se l'utente ha già scommesso */}
              {userHasBet && (
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

              {/* Avviso se non si può più scommettere */}
              {!canStillBet && !userHasBet && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  prediction?.status === 'in_pausa'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : prediction?.status === 'in_attesa'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${
                        prediction?.status === 'in_pausa' 
                          ? 'text-yellow-400' 
                          : prediction?.status === 'in_attesa'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`} viewBox="0 0 20 20" fill="currentColor">
                        {prediction?.status === 'in_attesa' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${
                        prediction?.status === 'in_pausa' || prediction?.status === 'in_attesa'
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : poolAddress && poolState && (!poolState.isActive || poolState.isPaused)
                          ? 'text-orange-800 dark:text-orange-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {prediction?.status === 'in_attesa' 
                          ? 'Il contratto per questa Prediction è in attesa di essere deployato.'
                          : poolAddress && poolState && (!poolState.isActive || poolState.isPaused)
                          ? 'Le scommesse sono chiuse per questa prediction'
                          : 'Prediction chiusa'
                        }
                      </h3>
                      <div className={`mt-2 text-sm ${
                        prediction?.status === 'in_pausa'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : prediction?.status === 'in_attesa'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        <p>
                          {poolState.isActive
                            ? 'Seleziona la tua posizione e inserisci l\'importo per scommettere.'
                            : poolState.isPaused
                            ? 'Pool temporaneamente in pausa. Le scommesse sono bloccate.'
                            : poolState.isCancelled
                            ? 'Pool cancellato. I rimborsi sono disponibili.'
                            : poolState.isResolved
                            ? 'Pool risolto. I rewards sono disponibili per i vincitori.'
                            : prediction?.status === 'in_attesa'
                            ? 'Non è ancora possibile scommettere su questa prediction.'
                            : 'Non è più possibile scommettere su questa prediction.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setSelectedPosition('yes')}
                  disabled={!canStillBet || userHasBet}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    !canStillBet || userHasBet
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                      : selectedPosition === 'yes'
                      ? 'bg-yes-button text-white'
                      : 'bg-yes-button/10 text-yes-button hover:bg-yes-button/20'
                  }`}
                >
                  Sì ({prediction.yes_percentage}%)
                </button>
                <button
                  onClick={() => setSelectedPosition('no')}
                  disabled={!canStillBet || userHasBet}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    !canStillBet || userHasBet
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                      : selectedPosition === 'no'
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
                  disabled={!canStillBet || userHasBet}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    !canStillBet || userHasBet
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg text-gray-900 dark:text-white'
                  }`}
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
                disabled={!selectedPosition || !betAmount || !canStillBet || bettingLoading || !isAuthenticated || userHasBet}
                className={`w-full font-medium py-3 px-4 rounded-lg border transition-colors duration-200 ${
                  !canStillBet || userHasBet
                    ? prediction?.status === 'in_attesa'
                      ? 'bg-yellow-300 text-yellow-800 cursor-not-allowed border-yellow-400 dark:bg-yellow-700 dark:text-yellow-200 dark:border-yellow-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                    : !selectedPosition || !betAmount || !isAuthenticated
                    ? 'bg-gray-300 disabled:cursor-not-allowed text-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                    : bettingLoading
                    ? 'bg-blue-500 text-white border-blue-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                }`}
              >
                {!isAuthenticated 
                  ? 'Connettiti per scommettere'
                  : !canStillBet 
                    ? (prediction?.status === 'in_attesa' ? 'Attendi' : 'Scommessa chiusa')
                    : userHasBet
                      ? 'Hai già scommesso'
                      : bettingLoading
                        ? 'Piazzando prediction...'
                        : (poolAddress ? 'Conferma prediction' : 'Conferma prediction')
                }
              </button>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    {prediction.status === 'in_attesa' ? 'In attesa' : 
                     prediction.status === 'in_pausa' ? 'In pausa' :
                     prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
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
    </div>
  );
}
