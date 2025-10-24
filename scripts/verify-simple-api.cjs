const { ethers } = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
  const contractAddress = "0xfa8C198F6b57011f52c01876a76Cf7187B027955";
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  console.log("🧪 Testing BSCScan API verification with SimpleStorage...");
  console.log("Contract Address:", contractAddress);
  console.log("API Key:", apiKey ? "✅ Configured" : "❌ Missing");
  
  // SimpleStorage source code
  const sourceCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}`;

  // Prepare verification data
  const verificationData = {
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: 'SimpleStorage',
    compilerversion: 'v0.8.19+commit.7dd6d404',
    optimizationUsed: '0', // No optimization for simple contract
    runs: '0',
    constructorArguements: '',
    evmversion: 'default',
    licenseType: '3' // MIT License
  };

  console.log("📤 Sending verification request to BSCScan...");
  
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(verificationData)) {
      formData.append(key, value);
    }

    const response = await fetch('https://api.bscscan.com/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const result = await response.json();
    
    console.log("📥 Response:", JSON.stringify(result, null, 2));
    
    if (result.status === '1') {
      console.log("✅ Verification submitted successfully!");
      console.log("GUID:", result.result);
      console.log("🔗 Check status: https://testnet.bscscan.com/address/" + contractAddress);
    } else {
      console.log("❌ Verification failed:");
      console.log("Error:", result.result);
    }
    
  } catch (error) {
    console.log("❌ Error submitting verification:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });