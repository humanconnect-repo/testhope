const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleStorage to BNB Testnet...");

  // Ottieni il contratto
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  
  // Deploy del contratto
  const simpleStorage = await SimpleStorage.deploy();
  
  // Aspetta che il deploy sia completato
  await simpleStorage.waitForDeployment();
  
  const address = await simpleStorage.getAddress();
  
  console.log("✅ SimpleStorage deployed to:", address);
  console.log("🔗 BSCScan Testnet:", `https://testnet.bscscan.com/address/${address}`);
  
  // Test del contratto
  console.log("\n🧪 Testing contract...");
  
  // Imposta un valore
  const setTx = await simpleStorage.set(42);
  await setTx.wait();
  console.log("✅ Set value to 42");
  
  // Leggi il valore
  const value = await simpleStorage.get();
  console.log("✅ Retrieved value:", value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
