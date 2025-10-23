const { ethers } = require("hardhat");

async function createTestPool() {
  console.log("🧪 Creazione pool di test...");
  
  const FACTORY_ADDRESS = "0x584e07ae43D43B655c85eaBC3074B43D192EBAEA";
  
  try {
    // Connessione al provider con signer
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("✅ Connesso a BSC Testnet con wallet:", wallet.address);
    
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
    
    // Crea pool di test
    console.log("\n🚀 Creando pool di test...");
    
    // Timestamp per il test (15 novembre 2025, 21:59 CET = 20:59 UTC)
    const closingDate = Math.floor(new Date('2025-11-15T20:59:00Z').getTime() / 1000);
    const closingBid = Math.floor(new Date('2025-12-31T20:59:00Z').getTime() / 1000);
    
    console.log("📅 Chiusura scommesse:", new Date(closingDate * 1000).toLocaleString('it-IT'));
    console.log("📅 Scadenza prediction:", new Date(closingBid * 1000).toLocaleString('it-IT'));
    
    // Crea il pool (solo se sei l'owner)
    const tx = await factory.createPool(
      "Test: Il Napoli vincerà lo scudetto 2025?",
      "Prediction di test per verificare il funzionamento del sistema",
      "Sport",
      closingDate,
      closingBid
    );
    
    console.log("⏳ Attendo conferma transazione...");
    const receipt = await tx.wait();
    
    console.log("✅ Pool creato con successo!");
    console.log("🔗 Hash transazione:", tx.hash);
    console.log("📊 Gas utilizzato:", receipt.gasUsed.toString());
    
    // Cerca l'evento PoolCreated
    const event = receipt.logs?.find((log) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'PoolCreated';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = factory.interface.parseLog(event);
      const poolAddress = parsed?.args?.poolAddress;
      console.log("🎯 Indirizzo pool creato:", poolAddress);
      console.log("🌐 BSCScan:", `https://testnet.bscscan.com/address/${poolAddress}`);
    }
    
    // Lista tutti i pool
    const pools = await factory.getAllPools();
    console.log("\n📋 Pool esistenti:", pools.length);
    pools.forEach((pool, index) => {
      console.log(`  ${index + 1}. ${pool}`);
    });
    
  } catch (error) {
    console.error("❌ Errore durante la creazione del pool:", error);
    
    if (error.message.includes("caller is not the owner")) {
      console.log("\n💡 Suggerimento: Solo l'owner della factory può creare pool");
      console.log("   Owner:", await factory.owner());
    }
  }
}

createTestPool().catch(console.error);
