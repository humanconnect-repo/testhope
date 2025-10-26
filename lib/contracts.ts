import { ethers } from 'ethers';
import PredictionPoolABI from '../artifacts/contracts/BellaNapoliPredictionFactory.sol/PredictionPool.json';

// ABI minimi per i contratti
const FACTORY_ABI = [
  "function owner() view returns (address)",
  "function createPool(string,string,string,uint256,uint256) returns (address)",
  "function getAllPools() view returns (address[])",
  "function getPoolCount() view returns (uint256)",
  "function getPoolInfo(address) view returns (tuple(string title,string description,string category,uint256 closingDate,uint256 closingBid,address creator,bool isActive,uint256 createdAt))",
  "function setPoolWinner(address,bool)",
  "function emergencyResolvePool(address,bool,string)",
  "function setPoolEmergencyStop(address,bool)",
  "function cancelPoolPrediction(address,string)",
  "function closePool(address)",
  "function collectFees(address) returns (uint256)",
  "event PoolCreated(address indexed poolAddress, string title, string category, address indexed creator, uint256 closingDate, uint256 closingBid)",
  "event PoolWinnerSet(address indexed poolAddress, bool winner)",
  "event PoolEmergencyResolved(address indexed poolAddress, bool winner, string reason)",
  "event PoolEmergencyStopToggled(address indexed poolAddress, bool stopped)",
  "event PoolCancelled(address indexed poolAddress, string reason)"
];

// Usa l'ABI del contratto deployato invece di quello hardcoded
const POOL_ABI = PredictionPoolABI.abi;

// Indirizzo della factory (da configurare dopo il deploy)
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '';

export function getProvider() {
  if (typeof window === 'undefined') throw new Error('No window');
  const anyWin = window as any;
  if (!anyWin.ethereum) throw new Error('Wallet non trovato');
  return new ethers.BrowserProvider(anyWin.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  return provider.getSigner();
}

export async function getFactory() {
  if (!FACTORY_ADDRESS) throw new Error('Factory address non configurata');
  const signer = await getSigner();
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

export async function getPool(address: string) {
  const signer = await getSigner();
  return new ethers.Contract(address, PredictionPoolABI.abi, signer);
}

// Verifica se il wallet connesso è l'owner della factory
export async function isFactoryOwner(): Promise<boolean> {
  try {
    if (!FACTORY_ADDRESS) {
      console.log('Factory non ancora deployata');
      return false;
    }
    
    // Usa un provider read-only per evitare problemi di connessione (stesso RPC del deploy)
    const provider = new ethers.JsonRpcProvider("https://bsc-testnet.publicnode.com");
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    const owner: string = await factory.owner();
    console.log('Owner della factory:', owner);
    
    // Verifica se l'utente è connesso
    if (typeof window === 'undefined') {
      return false;
    }
    
    const anyWin = window as any;
    if (!anyWin.ethereum) {
      console.log('Wallet non connesso');
      return false;
    }
    
    const browserProvider = new ethers.BrowserProvider(anyWin.ethereum);
    const signer = await browserProvider.getSigner();
    const me = await signer.getAddress();
    
    console.log('Wallet connesso:', me);
    console.log('Owner match:', owner.toLowerCase() === me.toLowerCase());
    
    return owner.toLowerCase() === me.toLowerCase();
  } catch (error) {
    console.error('Errore verifica owner:', error);
    return false;
  }
}

// Crea un nuovo pool di prediction
export async function createPool(input: {
  title: string;
  description: string;
  category: string;
  closingDateUtc: number; // timestamp UTC
  closingBidUtc: number;  // timestamp UTC
}): Promise<{ address: string; hash: string }> {
  if (!FACTORY_ADDRESS) {
    throw new Error('Factory non ancora deployata');
  }
  const factory = await getFactory();
  const tx = await factory.createPool(
    input.title,
    input.description,
    input.category,
    input.closingDateUtc,
    input.closingBidUtc
  );
  const receipt = await tx.wait();
  
  // Cerca l'evento PoolCreated
  const event = receipt.logs?.find((log: any) => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === 'PoolCreated';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = factory.interface.parseLog(event);
    return {
      address: parsed?.args?.poolAddress || '',
      hash: tx.hash
    };
  }
  
  // Fallback: prendi l'ultimo pool dalla lista
  const pools = await factory.getAllPools();
  return {
    address: pools[pools.length - 1],
    hash: tx.hash
  };
}

// Lista tutti i pool
export async function listPools(): Promise<string[]> {
  if (!FACTORY_ADDRESS) {
    console.log('Factory non ancora deployata');
    return [];
  }
  
  try {
    console.log('🔍 Caricamento pool dal factory:', FACTORY_ADDRESS);
    // Usa provider read-only per le operazioni di lettura (stesso RPC del deploy)
    const provider = new ethers.JsonRpcProvider("https://bsc-testnet.publicnode.com");
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const pools = await factory.getAllPools();
    console.log('📋 Pool trovate:', pools.length, pools);
    return pools;
  } catch (error) {
    console.error('❌ Errore caricamento pools:', error);
    return [];
  }
}

// Informazioni dettagliate di un pool (semplificato)
export async function getPoolSummary(address: string) {
  try {
    console.log('🔍 getPoolSummary per:', address);
    
    // Restituisce solo l'indirizzo - i dettagli li prendiamo dal database
    const result = {
      address,
      title: '', // Sarà popolato dal database
      description: '', // Sarà popolato dal database
      category: '', // Sarà popolato dal database
      closingDate: 0, // Sarà popolato dal database
      closingBid: 0, // Sarà popolato dal database
      totalYes: "0",
      totalNo: "0", 
      totalBets: "0",
      bettorCount: 0,
      isClosed: false,
      winnerSet: false,
      winner: false,
      feeWallet: '',
      feeBps: 0,
      feeCalc: "0",
      feeSent: false,
      winningPot: "0",
      losingPot: "0",
      feeAmount: "0",
      netLosingPot: "0",
      totalRedistribution: "0"
    };
    
    console.log('✅ Pool summary semplificato creato:', result);
    return result;
  } catch (error) {
    console.error('❌ Errore caricamento pool summary:', address, error);
    throw error;
  }
}

// Imposta il risultato di una prediction
export async function resolvePool(address: string, winnerYes: boolean) {
  const factory = await getFactory();
  const tx = await factory.setPoolWinner(address, winnerYes);
  await tx.wait();
  return tx.hash;
}

// Converte data italiana in timestamp UTC
export function italianToUtcTimestamp(dateIsoWithTZ: string): number {
  return Math.floor(new Date(dateIsoWithTZ).getTime() / 1000);
}

// Formatta timestamp per display italiano
export function formatItalianTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Verifica se il betting è ancora aperto
export function isBettingOpen(closingDate: number): boolean {
  return Math.floor(Date.now() / 1000) <= closingDate;
}

// Verifica se la prediction è terminata
export function isPredictionEnded(closingBid: number): boolean {
  return Math.floor(Date.now() / 1000) > closingBid;
}

// ============ ADMIN FUNCTIONS ============

// Emergency stop betting
export async function setEmergencyStop(poolAddress: string, stop: boolean) {
  const factory = await getFactory();
  const tx = await factory.setPoolEmergencyStop(poolAddress, stop);
  await tx.wait();
  return tx.hash;
}

// Emergency resolve prediction
export async function emergencyResolve(poolAddress: string, winner: boolean, reason: string) {
  const factory = await getFactory();
  const tx = await factory.emergencyResolvePool(poolAddress, winner, reason);
  await tx.wait();
  return tx.hash;
}

// DEPRECATED: Usa la logica del database + tempo invece di chiamare il contratto
// Check if betting is currently open (including emergency stop)
export async function isBettingCurrentlyOpen(poolAddress: string): Promise<boolean> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.isBettingOpen(); // Corretto: isBettingOpen invece di isBettingCurrentlyOpen
  } catch (error) {
    console.warn('Errore nel controllo stato scommesse:', error);
    return true; // Default: scommesse aperte
  }
}

// Check emergency stop status
export async function getEmergencyStopStatus(poolAddress: string): Promise<boolean> {
  const pool = await getPool(poolAddress);
  return await pool.emergencyStop();
}

// Cancel pool and allow refunds
export async function cancelPool(poolAddress: string, reason: string) {
  const factory = await getFactory();
  const tx = await factory.cancelPoolPrediction(poolAddress, reason);
  await tx.wait();
  return tx.hash;
}

// Claim refund for cancelled pool
export async function claimRefund(poolAddress: string) {
  const pool = await getPool(poolAddress);
  const tx = await pool.claimRefund();
  await tx.wait();
  return tx.hash;
}

// Check if user can claim refund
export async function canClaimRefund(poolAddress: string, userAddress: string): Promise<boolean> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.canClaimRefund(userAddress);
  } catch (error) {
    console.error('Error checking can claim refund:', error);
    return false;
  }
}

// Check if user already claimed refund (check the claimed status in userBets)
export async function hasClaimedRefund(poolAddress: string, userAddress: string): Promise<boolean> {
  try {
    const pool = await getPool(poolAddress);
    const bet = await pool.userBets(userAddress);
    return bet.claimed === true;
  } catch (error) {
    console.error('Error checking claimed status:', error);
    return false;
  }
}

// ============ BET READING FUNCTIONS ============

// Get all bettors from a pool contract
export async function getPoolBettors(poolAddress: string): Promise<string[]> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.getBettors();
  } catch (error) {
    console.error('Error getting pool bettors:', error);
    return [];
  }
}

// Get user bet information from contract
export async function getUserBetFromContract(poolAddress: string, userAddress: string) {
  try {
    const pool = await getPool(poolAddress);
    // userBets è un mapping pubblico, quindi possiamo chiamarlo direttamente
    const bet = await pool.userBets(userAddress);
    return {
      amount: bet.amount.toString(),
      choice: bet.choice, // true = Yes, false = No
      claimed: bet.claimed,
      timestamp: bet.timestamp.toString()
    };
  } catch (error) {
    console.error('Error getting user bet from contract:', error);
    return null;
  }
}

// Get recent bets from contract (last N bettors)
export async function getRecentBetsFromContract(poolAddress: string, limit: number = 5) {
  try {
    const bettors = await getPoolBettors(poolAddress);
    const recentBettors = bettors.slice(-limit); // Get last N bettors
    
    const bets = await Promise.all(
      recentBettors.map(async (bettorAddress) => {
        const bet = await getUserBetFromContract(poolAddress, bettorAddress);
        if (!bet) return null;
        
        return {
          userAddress: bettorAddress,
          amount: bet.amount,
          choice: bet.choice,
          timestamp: bet.timestamp,
          claimed: bet.claimed
        };
      })
    );
    
    return bets.filter(bet => bet !== null);
  } catch (error) {
    console.error('Error getting recent bets from contract:', error);
    return [];
  }
}

// Get pool statistics from contract
export async function getPoolStatsFromContract(poolAddress: string) {
  try {
    const pool = await getPool(poolAddress);
    const [totalYes, totalNo, totalBets, bettorCount, isClosed, winnerSet, winner] = await pool.getPoolStats();
    
    return {
      totalYes: totalYes.toString(),
      totalNo: totalNo.toString(),
      totalBets: totalBets.toString(),
      bettorCount: Number(bettorCount),
      isClosed,
      winnerSet,
      winner
    };
  } catch (error) {
    console.error('Error getting pool stats from contract:', error);
    return null;
  }
}

// Check if pool is cancelled
export async function isPoolCancelled(poolAddress: string): Promise<boolean> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.cancelled();
  } catch (error) {
    console.warn('Errore nel controllo cancellazione pool:', error);
    return false; // Default: pool non cancellato
  }
}

// Get bet description from pool contract
export async function getBetDescription(poolAddress: string): Promise<string> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.getBetDescription();
  } catch (error) {
    console.warn('Error getting bet description:', error);
    return 'Place a bet on prediction pool';
  }
}

// Get betting status from pool contract
export async function getBettingStatus(poolAddress: string): Promise<string> {
  try {
    const pool = await getPool(poolAddress);
    return await pool.getBettingStatus();
  } catch (error) {
    console.warn('Error getting betting status:', error);
    return 'Unable to check betting status';
  }
}

// Check if user can bet with detailed reason
export async function canUserBet(poolAddress: string, userAddress: string): Promise<{ canBet: boolean; reason: string }> {
  try {
    const pool = await getPool(poolAddress);
    const result = await pool.canUserBet(userAddress);
    return {
      canBet: result[0],
      reason: result[1]
    };
  } catch (error) {
    console.warn('Error checking if user can bet:', error);
    return {
      canBet: false,
      reason: 'Unable to check betting eligibility'
    };
  }
}

// Place a bet on a pool
export async function placeBet(poolAddress: string, choice: boolean, amount: string): Promise<{ hash: string; receipt: any }> {
  try {
    const pool = await getPool(poolAddress);
    const provider = getProvider();
    const signer = await provider.getSigner();
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);
    console.log('🔍 Contract placeBet:', { amount, amountWei: amountWei.toString() });
    
    // Call placeBet function with improved metadata for wallet display
    const tx = await (pool.connect(signer) as any).placeBet(choice, { 
      value: amountWei,
      gasLimit: 200000, // Explicit gas limit for better wallet estimation
    });
    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      receipt: receipt
    };
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
}
