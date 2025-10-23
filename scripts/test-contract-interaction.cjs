const { ethers } = require("hardhat");

// ABI minimi per i contratti
const FACTORY_ABI = [
  "function owner() view returns (address)",
  "function createPool(string,string,string,uint256,uint256) returns (address)",
  "function getAllPools() view returns (address[])",
  "function getPoolCount() view returns (uint256)",
  "function getPoolInfo(address) view returns (tuple(string title,string description,string category,uint256 closingDate,uint256 closingBid,address creator,bool isActive,uint256 createdAt))",
  "event PoolCreated(address indexed poolAddress, string title, string category, address indexed creator, uint256 closingDate, uint256 closingBid)"
];

const POOL_ABI = [
  "function owner() view returns (address)",
  "function getPoolInfo() view returns (string,string,string,uint256,uint256)",
  "function getPoolStats() view returns (uint256,uint256,uint256,uint256,bool,bool,bool)",
  "function getFeeInfo() view returns (address,uint256,uint256,bool)",
  "function getRedistributionInfo() view returns (uint256,uint256,uint256,uint256,uint256)",
  "function getBettors() view returns (address[])",
  "function setWinner(bool)",
  "event WinnerSet(bool winner)",
  "event FeeTransferred(address indexed feeWallet, uint256 amount)",
  "event RewardClaimed(address indexed user, uint256 amount)"
];

async function testContractInteraction() {
  console.log("🧪 Test interazione con il contratto Factory...");
  
  const FACTORY_ADDRESS = "0x584e07ae43D43B655c85eaBC3074B43D192EBAEA";
  
  try {
    // Connessione al provider
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    console.log("✅ Connesso a BSC Testnet");
    
    // Connessione al contratto
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    console.log("✅ Connesso al contratto Factory");
    
    // Verifica owner
    const owner = await factory.owner();
    console.log("👤 Owner della Factory:", owner);
    
    // Conta pool esistenti
    const poolCount = await factory.getPoolCount();
    console.log("📊 Numero di pool esistenti:", poolCount.toString());
    
    // Lista tutti i pool
    const pools = await factory.getAllPools();
    console.log("📋 Pool esistenti:", pools);
    
    if (pools.length > 0) {
      // Testa il primo pool
      const firstPoolAddress = pools[0];
      console.log("\n🔍 Testando pool:", firstPoolAddress);
      
      const pool = new ethers.Contract(firstPoolAddress, POOL_ABI, provider);
      
      // Informazioni base
      const [title, description, category, closingDate, closingBid] = await pool.getPoolInfo();
      console.log("📝 Titolo:", title);
      console.log("📄 Descrizione:", description);
      console.log("🏷️ Categoria:", category);
      console.log("📅 Chiusura scommesse:", new Date(Number(closingDate) * 1000).toLocaleString('it-IT'));
      console.log("📅 Scadenza prediction:", new Date(Number(closingBid) * 1000).toLocaleString('it-IT'));
      
      // Statistiche
      const [totalYes, totalNo, totalBets, bettorCount, isClosed, winnerSet, winner] = await pool.getPoolStats();
      console.log("💰 YES:", ethers.formatEther(totalYes), "BNB");
      console.log("💰 NO:", ethers.formatEther(totalNo), "BNB");
      console.log("💰 Totale:", ethers.formatEther(totalBets), "BNB");
      console.log("👥 Scommettitori:", bettorCount.toString());
      console.log("🔒 Chiuso:", isClosed);
      console.log("🏆 Vincitore impostato:", winnerSet);
      if (winnerSet) {
        console.log("🏆 Vincitore:", winner ? "YES" : "NO");
      }
      
      // Info fee
      const [feeWallet, feeBps, feeCalc, feeSent] = await pool.getFeeInfo();
      console.log("💳 Fee Wallet:", feeWallet);
      console.log("📊 Fee %:", (Number(feeBps) / 100).toFixed(2) + "%");
      console.log("✅ Fee inviata:", feeSent);
      
      // Info redistribuzione
      const [winningPot, losingPot, feeAmount, netLosingPot, totalRedistribution] = await pool.getRedistributionInfo();
      console.log("🏆 Pool vincitori:", ethers.formatEther(winningPot), "BNB");
      console.log("💸 Pool perdenti:", ethers.formatEther(losingPot), "BNB");
      console.log("💳 Fee amount:", ethers.formatEther(feeAmount), "BNB");
      console.log("💰 Pool perdenti netto:", ethers.formatEther(netLosingPot), "BNB");
      console.log("🔄 Redistribuzione totale:", ethers.formatEther(totalRedistribution), "BNB");
    }
    
    console.log("\n✅ Test completato con successo!");
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error);
  }
}

testContractInteraction().catch(console.error);
