require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

async function verifySimpleFactory() {
  console.log("🔍 Verifica BellaNapoliPredictionFactory (versione semplificata)...");
  
  const contractAddress = "0x584e07ae43D43B655c85eaBC3074B43D192EBAEA";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.error("❌ BSCSCAN_API_KEY non trovata");
    return;
  }

  const sourceCodePath = './bscscan/factory-simple.sol';
  const sourceCode = fs.readFileSync(sourceCodePath, 'utf8');

  try {
    console.log("📝 Preparando verifica...");
    console.log("📍 Contratto:", contractAddress);
    console.log("🔑 API Key:", apiKey.substring(0, 8) + "...");
    
    // Prepara i dati per la verifica
    const verificationData = {
      apikey: apiKey,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: 'BellaNapoliPredictionFactory',
      compilerversion: 'v0.8.19+commit.7dd6d404',
      optimizationUsed: '1',
      runs: '200',
      constructorArgu: ''
    };
    
    console.log("🚀 Invio richiesta a BSCScan...");
    
    // Invia richiesta usando Etherscan API v2
    const response = await fetch('https://api.etherscan.io/v2/api?chainid=97', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(verificationData)
    });
    
    const result = await response.json();
    
    console.log("📊 Risposta BSCScan:");
    console.log("Status:", result.status);
    console.log("Message:", result.message);
    console.log("Result:", result.result);

    if (result.status === "1") {
      console.log("✅ Verifica inviata con successo!");
      console.log("🔗 GUID:", result.result);
      console.log("⏳ La verifica richiede alcuni minuti...");
      console.log(`🌐 Controlla su: https://testnet.bscscan.com/address/${contractAddress}`);

      // Attendi e controlla lo stato
      await new Promise(resolve => setTimeout(resolve, 30000)); // Attendi 30 secondi
      await checkStatus(apiKey, result.result);

    } else {
      console.error("❌ Errore verifica:", result.message);
      console.error("📋 Dettagli:", result.result);
    }

  } catch (error) {
    console.error("❌ Errore:", error.message);
  }
}

async function checkStatus(apiKey, guid) {
  try {
    // Usa Etherscan API v2 per controllare lo stato
    const statusUrl = `https://api.etherscan.io/v2/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}&chainid=97`;
    
    const response = await fetch(statusUrl);
    const result = await response.json();
    
    console.log("📊 Stato verifica:");
    console.log("Status:", result.status);
    console.log("Result:", result.result);
    
    if (result.status === "1" && result.result === "Pass - Verified") {
      console.log("✅ Contratto verificato con successo!");
    } else {
      console.warn("⚠️ Stato:", result.result);
    }
  } catch (error) {
    console.error("❌ Errore controllo stato:", error.message);
  }
}

verifySimpleFactory().catch(console.error);
