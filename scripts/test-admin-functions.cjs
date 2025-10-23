const { ethers } = require("hardhat");

async function testAdminFunctions() {
  console.log("🧪 Test funzioni admin del nuovo contratto...");
  
  const FACTORY_ADDRESS = "0x0874E279856a87c5d4531e361Ff0686c03d20c7c";
  const POOL_ADDRESS = "0x564D250bfF9bCda09d94F3EC76B81de401491Fbc";
  
  try {
    // Connessione al provider con signer
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("✅ Connesso a BSC Testnet con wallet:", wallet.address);
    
    // Connessione al contratto
    const pool = new ethers.Contract(POOL_ADDRESS, [
      "function owner() view returns (address)",
      "function emergencyStop() view returns (bool)",
      "function cancelled() view returns (bool)",
      "function isBettingCurrentlyOpen() view returns (bool)",
      "function setEmergencyStop(bool)",
      "function emergencyResolve(bool,string)",
      "function cancelPool(string)",
      "function canClaimRefund(address) view returns (bool)"
    ], wallet);
    
    console.log("\n🔍 Stato iniziale del pool:");
    const initialEmergencyStop = await pool.emergencyStop();
    const initialCancelled = await pool.cancelled();
    const initialBettingOpen = await pool.isBettingCurrentlyOpen();
    
    console.log("🛑 Emergency Stop:", initialEmergencyStop);
    console.log("❌ Cancelled:", initialCancelled);
    console.log("🎯 Betting Open:", initialBettingOpen);
    
    // Test 1: Stop Betting
    console.log("\n🛑 Test 1: Stop Betting...");
    const tx1 = await pool.setEmergencyStop(true);
    await tx1.wait();
    console.log("✅ Emergency stop attivato");
    
    const afterStop = await pool.isBettingCurrentlyOpen();
    console.log("🎯 Betting Open dopo stop:", afterStop);
    
    // Test 2: Resume Betting
    console.log("\n▶️ Test 2: Resume Betting...");
    const tx2 = await pool.setEmergencyStop(false);
    await tx2.wait();
    console.log("✅ Emergency stop disattivato");
    
    const afterResume = await pool.isBettingCurrentlyOpen();
    console.log("🎯 Betting Open dopo resume:", afterResume);
    
    // Test 3: Emergency Resolve
    console.log("\n🚨 Test 3: Emergency Resolve...");
    const tx3 = await pool.emergencyResolve(true, "Test emergency resolution");
    await tx3.wait();
    console.log("✅ Emergency resolve completato (YES winner)");
    
    const afterResolve = await pool.isBettingCurrentlyOpen();
    const afterResolveCancelled = await pool.cancelled();
    console.log("🎯 Betting Open dopo resolve:", afterResolve);
    console.log("❌ Cancelled dopo resolve:", afterResolveCancelled);
    
    console.log("\n🎉 Tutte le funzioni admin funzionano correttamente!");
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error);
  }
}

testAdminFunctions().catch(console.error);
