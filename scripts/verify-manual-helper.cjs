require('dotenv').config({ path: '.env.local' });

console.log("🔍 GUIDA VERIFICA MANUALE BSCScan");
console.log("=====================================");
console.log("");
console.log("📍 Contratto: 0xA7f521b7e38ebeb31457E8Cb8dbA0c071761C33D");
console.log("🌐 URL: https://testnet.bscscan.com/address/0xA7f521b7e38ebeb31457E8Cb8dbA0c071761C33D");
console.log("");
console.log("📋 PARAMETRI PER LA VERIFICA:");
console.log("==============================");
console.log("");
console.log("1. Contract Address: 0xA7f521b7e38ebeb31457E8Cb8dbA0c071761C33D");
console.log("2. Compiler Type: Solidity (Single file)");
console.log("3. Compiler Version: v0.8.19+commit.7dd6d404");
console.log("4. Open Source License: MIT License (MIT)");
console.log("5. Optimization: Yes");
console.log("6. Runs: 200");
console.log("7. Constructor Arguments: (vuoto)");
console.log("");
console.log("📝 SOURCE CODE DA COPIARE:");
console.log("===========================");
console.log("");
console.log(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}`);
console.log("");
console.log("🚀 ISTRUZIONI:");
console.log("==============");
console.log("1. Vai su https://testnet.bscscan.com/address/0xA7f521b7e38ebeb31457E8Cb8dbA0c071761C33D");
console.log("2. Clicca 'Verify and Publish'");
console.log("3. Compila il form con i parametri sopra");
console.log("4. Incolla il source code");
console.log("5. Clicca 'Verify and Publish'");
console.log("6. Attendi 1-2 minuti");
console.log("");
console.log("✅ Se tutto va bene, vedrai il codice sorgente sulla pagina del contratto!");
