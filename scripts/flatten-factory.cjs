const fs = require('fs');
const path = require('path');

// Leggi i file OpenZeppelin
const ownablePath = path.join(__dirname, '../node_modules/@openzeppelin/contracts/access/Ownable.sol');
const reentrancyPath = path.join(__dirname, '../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol');
const contextPath = path.join(__dirname, '../node_modules/@openzeppelin/contracts/utils/Context.sol');

// Leggi i file del progetto
const factoryPath = path.join(__dirname, '../contractweb3/BellaNapoliPredictionFactory.sol');
const poolPath = path.join(__dirname, '../contractweb3/PredictionPool.sol');
const timeConfigPath = path.join(__dirname, '../contractweb3/TimeConfig.sol');

try {
  // Leggi tutti i file
  const ownable = fs.readFileSync(ownablePath, 'utf8');
  const reentrancy = fs.readFileSync(reentrancyPath, 'utf8');
  const context = fs.readFileSync(contextPath, 'utf8');
  const factory = fs.readFileSync(factoryPath, 'utf8');
  const pool = fs.readFileSync(poolPath, 'utf8');
  const timeConfig = fs.readFileSync(timeConfigPath, 'utf8');

  // Rimuovi gli import e crea un file unico
  let flattened = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ============ OPENZEPPELIN CONTRACTS ============

${context.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\n/, '')}

${ownable.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\nimport.*?\n/, '')}

${reentrancy.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\nimport.*?\n/, '')}

// ============ TIME CONFIG ============

${timeConfig.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\n/, '')}

// ============ PREDICTION POOL ============

${pool.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\nimport.*?\n/g, '')}

// ============ FACTORY ============

${factory.replace(/\/\/ SPDX-License-Identifier: MIT\npragma solidity \^0\.8\.19;\nimport.*?\n/g, '')}`;

  // Salva il file appiattito
  const outputPath = path.join(__dirname, '../bscscan/factory-flattened.sol');
  fs.writeFileSync(outputPath, flattened);
  
  console.log('✅ File appiattito creato:', outputPath);
  console.log('📋 Ora puoi usare questo file per la verifica su BSCScan');
  
} catch (error) {
  console.error('❌ Errore:', error.message);
}
