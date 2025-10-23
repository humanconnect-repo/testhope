const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function verifyContractManually() {
  console.log("🔍 Verifica manuale del contratto SimpleStorage...");
  
  const contractAddress = "0x79C3589c06483478baa8Ee283EC5156A344692e3";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.error("❌ BSCSCAN_API_KEY non trovata");
    return;
  }
  
  try {
    // 1. Compila il contratto per ottenere il source code
    console.log("📦 Compilando contratto...");
    await hre.run("compile");
    
    // 2. Leggi il source code
    const fs = require('fs');
    const path = require('path');
    const sourceCode = fs.readFileSync(
      path.join(__dirname, '../contractweb3/SimpleStorage.sol'), 
      'utf8'
    );
    
    console.log("📝 Source code letto:", sourceCode.length, "caratteri");
    
    // 3. Prepara i parametri per la verifica
    const constructorArgs = []; // SimpleStorage non ha parametri nel costruttore
    
    const verificationData = {
      apikey: apiKey,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: 'SimpleStorage',
      compilerversion: 'v0.8.20+commit.8d45a5f',
      optimizationUsed: '1',
      runs: '200',
      constructorArgu: constructorArgs.join(',')
    };
    
    console.log("🚀 Invio richiesta di verifica a BSCScan...");
    
    // 4. Invia richiesta di verifica
    const formData = new URLSearchParams();
    Object.keys(verificationData).forEach(key => {
      formData.append(key, verificationData[key]);
    });
    
    const response = await fetch('https://api.bscscan.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.status === "1") {
      console.log("✅ Verifica inviata con successo!");
      console.log("🔗 GUID:", result.result);
      console.log("⏳ La verifica potrebbe richiedere alcuni minuti...");
      console.log("🌐 Controlla su: https://testnet.bscscan.com/address/" + contractAddress);
      
      // 5. Controlla lo stato della verifica
      console.log("\n🔄 Controllando stato verifica...");
      await checkVerificationStatus(apiKey, result.result);
      
    } else {
      console.error("❌ Errore verifica:", result.message);
      console.error("📋 Dettagli:", result.result);
    }
    
  } catch (error) {
    console.error("❌ Errore durante la verifica:", error.message);
  }
}

async function checkVerificationStatus(apiKey, guid) {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const statusUrl = `https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`;
      
      const response = await fetch(statusUrl);
      const result = await response.json();
      
      if (result.status === "1") {
        console.log("✅ Contratto verificato con successo!");
        console.log("🔗 Visualizza su: https://testnet.bscscan.com/address/0x79C3589c06483478baa8Ee283EC5156A344692e3");
        return;
      } else if (result.result === "Pending in queue") {
        console.log("⏳ Verifica in coda... tentativo", attempts + 1, "/", maxAttempts);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Aspetta 10 secondi
        attempts++;
      } else {
        console.log("⚠️ Stato verifica:", result.result);
        break;
      }
    } catch (error) {
      console.error("❌ Errore controllo stato:", error.message);
      break;
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log("⏰ Timeout - controlla manualmente su BSCScan");
  }
}

verifyContractManually()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore generale:", error);
    process.exit(1);
  });
