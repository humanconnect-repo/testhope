const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BellaNapoliPredictionFactory to BNB Testnet...");
  
  // Deploy Factory
  const BellaNapoliPredictionFactory = await ethers.getContractFactory("BellaNapoliPredictionFactory");
  const factory = await BellaNapoliPredictionFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ BellaNapoliPredictionFactory deployed to:", factoryAddress);
  console.log("🔗 BSCScan Testnet:", `https://testnet.bscscan.com/address/${factoryAddress}`);
  
  // Test basic functionality
  console.log("\n🧪 Testing Factory...");
  const owner = await factory.owner();
  console.log("✅ Owner:", owner);
  
  const poolCount = await factory.getPoolCount();
  console.log("✅ Pool count:", poolCount.toString());
  
  console.log("\n📋 AGGIORNA IL TUO .env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  
  console.log("\n🎉 Deploy completato! Ora puoi usare il pannello admin.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
