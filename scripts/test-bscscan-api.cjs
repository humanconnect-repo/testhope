const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function testBSCScanAPI() {
  console.log("🔍 Testing BSCScan API...");
  
  // Test con l'indirizzo del SimpleStorage che abbiamo deployato
  const contractAddress = "0x79C3589c06483478baa8Ee283EC5156A344692e3";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.error("❌ BSCSCAN_API_KEY non trovata nel .env.local");
    return;
  }
  
  console.log("📋 Contract Address:", contractAddress);
  console.log("🔑 API Key:", apiKey.substring(0, 8) + "...");
  
  try {
    // Test 1: Verifica contratto
    console.log("\n1️⃣ Verificando contratto...");
    const verifyUrl = `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;
    
    const response = await fetch(verifyUrl);
    const data = await response.json();
    
    if (data.status === "1") {
      console.log("✅ Contratto trovato su BSCScan");
      console.log("📝 Nome:", data.result[0].ContractName);
      console.log("🔧 Compilatore:", data.result[0].CompilerVersion);
      console.log("📊 Ottimizzazioni:", data.result[0].Runs);
    } else {
      console.log("⚠️ Contratto non verificato:", data.message);
    }
    
    // Test 2: Balance del contratto
    console.log("\n2️⃣ Controllando balance...");
    const balanceUrl = `https://api.bscscan.com/api?module=account&action=balance&address=${contractAddress}&tag=latest&apikey=${apiKey}`;
    
    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();
    
    if (balanceData.status === "1") {
      const balance = ethers.formatEther(balanceData.result);
      console.log("💰 Balance:", balance, "BNB");
    } else {
      console.log("❌ Errore balance:", balanceData.message);
    }
    
    // Test 3: Transazioni recenti
    console.log("\n3️⃣ Controllando transazioni recenti...");
    const txUrl = `https://api.bscscan.com/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${apiKey}`;
    
    const txResponse = await fetch(txUrl);
    const txData = await txResponse.json();
    
    if (txData.status === "1") {
      console.log("📊 Transazioni trovate:", txData.result.length);
      if (txData.result.length > 0) {
        console.log("🕒 Ultima transazione:", new Date(parseInt(txData.result[0].timeStamp) * 1000).toLocaleString('it-IT'));
        console.log("🔗 Hash:", txData.result[0].hash);
      }
    } else {
      console.log("❌ Errore transazioni:", txData.message);
    }
    
    // Test 4: Gas price attuale
    console.log("\n4️⃣ Controllando gas price...");
    const gasUrl = `https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
    
    const gasResponse = await fetch(gasUrl);
    const gasData = await gasResponse.json();
    
    if (gasData.status === "1") {
      console.log("⛽ Gas Price:");
      console.log("   - Standard:", gasData.result.Standard, "Gwei");
      console.log("   - Fast:", gasData.result.Fast, "Gwei");
      console.log("   - Safe:", gasData.result.Safe, "Gwei");
    } else {
      console.log("❌ Errore gas price:", gasData.message);
    }
    
    console.log("\n🎉 Test BSCScan API completato!");
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error.message);
  }
}

// Test anche con Etherscan API v2 (unificata)
async function testEtherscanV2() {
  console.log("\n🌐 Testing Etherscan API v2 (unificata)...");
  
  const contractAddress = "0x79C3589c06483478baa8Ee283EC5156A344692e3";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  try {
    // Test con Etherscan API v2 per BSC
    const v2Url = `https://api.etherscan.io/v2/api?chainid=97&module=account&action=balance&address=${contractAddress}&apikey=${apiKey}`;
    
    const response = await fetch(v2Url);
    const data = await response.json();
    
    if (data.status === "1") {
      const balance = ethers.formatEther(data.result);
      console.log("✅ Etherscan API v2 funziona!");
      console.log("💰 Balance (v2):", balance, "BNB");
    } else {
      console.log("⚠️ Etherscan API v2:", data.message);
    }
    
  } catch (error) {
    console.error("❌ Errore Etherscan API v2:", error.message);
  }
}

async function main() {
  await testBSCScanAPI();
  await testEtherscanV2();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore generale:", error);
    process.exit(1);
  });
