const { ethers } = require("hardhat");

async function estimateGasFee() {
  console.log("⛽ Stima gas fee per creazione pool...");
  
  const FACTORY_ADDRESS = "0x584e07ae43D43B655c85eaBC3074B43D192EBAEA";
  
  try {
    // Connessione al provider con signer
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("✅ Connesso a BSC Testnet con wallet:", wallet.address);
    
    // Verifica balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Balance wallet:", ethers.formatEther(balance), "BNB");
    
    // Connessione al contratto con signer
    const factory = new ethers.Contract(FACTORY_ADDRESS, [
      "function owner() view returns (address)",
      "function createPool(string,string,string,uint256,uint256) returns (address)",
      "function getAllPools() view returns (address[])",
      "event PoolCreated(address indexed poolAddress, string title, string category, address indexed creator, uint256 closingDate, uint256 closingBid)"
    ], wallet);
    
    // Verifica owner
    const owner = await factory.owner();
    console.log("👤 Owner della Factory:", owner);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log("❌ Non sei l'owner della factory!");
      return;
    }
    
    // Timestamp per il test
    const closingDate = Math.floor(new Date('2025-11-15T20:59:00Z').getTime() / 1000);
    const closingBid = Math.floor(new Date('2025-12-31T20:59:00Z').getTime() / 1000);
    
    console.log("\n📅 Parametri pool:");
    console.log("   Titolo: Test: Il Napoli vincerà lo scudetto 2025?");
    console.log("   Categoria: Sport");
    console.log("   Chiusura scommesse:", new Date(closingDate * 1000).toLocaleString('it-IT'));
    console.log("   Scadenza prediction:", new Date(closingBid * 1000).toLocaleString('it-IT'));
    
    // Stima gas
    console.log("\n⛽ Stima gas...");
    const gasEstimate = await factory.createPool.estimateGas(
      "Test: Il Napoli vincerà lo scudetto 2025?",
      "Prediction di test per verificare il funzionamento del sistema",
      "Sport",
      closingDate,
      closingBid
    );
    
    console.log("📊 Gas stimato:", gasEstimate.toString());
    
    // Prezzo gas attuale
    const gasPrice = await provider.getFeeData();
    console.log("💵 Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "Gwei");
    
    // Calcola costo totale
    const totalCost = gasEstimate * gasPrice.gasPrice;
    console.log("💰 Costo totale stimato:", ethers.formatEther(totalCost), "BNB");
    console.log("💰 Costo totale stimato:", (parseFloat(ethers.formatEther(totalCost)) * 600).toFixed(2), "USD (BNB ~$600)");
    
    // Verifica se hai abbastanza BNB
    if (balance < totalCost) {
      console.log("❌ Balance insufficiente!");
      console.log("   Necessario:", ethers.formatEther(totalCost), "BNB");
      console.log("   Disponibile:", ethers.formatEther(balance), "BNB");
      console.log("   Mancante:", ethers.formatEther(totalCost - balance), "BNB");
    } else {
      console.log("✅ Balance sufficiente per la transazione");
    }
    
    // Mostra pool esistenti
    const pools = await factory.getAllPools();
    console.log("\n📋 Pool esistenti:", pools.length);
    if (pools.length > 0) {
      console.log("   Pool attuali:");
      pools.forEach((pool, index) => {
        console.log(`     ${index + 1}. ${pool}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Errore durante la stima:", error);
  }
}

estimateGasFee().catch(console.error);
