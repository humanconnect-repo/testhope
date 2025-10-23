require('dotenv').config({ path: '.env.local' });

async function verifySimpleStorage() {
  console.log("🔍 Verifica SimpleStorage su BSCScan...");
  
  const contractAddress = "0xA7f521b7e38ebeb31457E8Cb8dbA0c071761C33D";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.error("❌ BSCSCAN_API_KEY non trovata");
    return;
  }
  
  // Source code del contratto SimpleStorage
  const sourceCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}`;
  
  try {
    console.log("📝 Preparando verifica...");
    console.log("📍 Contratto:", contractAddress);
    console.log("🔑 API Key:", apiKey.substring(0, 8) + "...");
    
    // Prepara i dati per la verifica con Etherscan API v2
    const verificationData = {
      apikey: apiKey,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: 'SimpleStorage',
      compilerversion: 'v0.8.19+commit.7dd6d404',
      optimizationUsed: '1',
      runs: '200',
      constructorArgu: ''
    };
    
    console.log("🚀 Invio richiesta a BSCScan...");
    
    // Invia richiesta usando Etherscan API v2
    const formData = new URLSearchParams();
    Object.keys(verificationData).forEach(key => {
      formData.append(key, verificationData[key]);
    });
    
    // Usa l'endpoint v2 di Etherscan con chainid nell'URL
    const response = await fetch('https://api.etherscan.io/v2/api?chainid=97', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    const result = await response.json();
    
    console.log("📊 Risposta BSCScan:");
    console.log("Status:", result.status);
    console.log("Message:", result.message);
    console.log("Result:", result.result);
    
    if (result.status === "1") {
      console.log("\n✅ Verifica inviata con successo!");
      console.log("🔗 GUID:", result.result);
      console.log("⏳ La verifica richiede alcuni minuti...");
      console.log("🌐 Controlla su: https://testnet.bscscan.com/address/" + contractAddress);
      
      // Controlla lo stato dopo 30 secondi
      console.log("\n⏳ Aspetto 30 secondi e controllo lo stato...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      await checkStatus(apiKey, result.result);
      
    } else {
      console.error("❌ Errore verifica:", result.message);
      if (result.result) {
        console.error("📋 Dettagli:", result.result);
      }
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
    
    if (result.status === "1") {
      console.log("🎉 Contratto verificato con successo!");
      console.log("🔗 Visualizza: https://testnet.bscscan.com/address/0x79C3589c06483478baa8Ee283EC5156A344692e3");
    } else if (result.result === "Pending in queue") {
      console.log("⏳ Ancora in coda... controlla tra qualche minuto");
    } else {
      console.log("⚠️ Stato:", result.result);
    }
    
  } catch (error) {
    console.error("❌ Errore controllo stato:", error.message);
  }
}

verifySimpleStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore generale:", error);
    process.exit(1);
  });
