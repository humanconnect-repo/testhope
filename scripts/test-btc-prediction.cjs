const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Testing BTC 150k Prediction Market...");

  // Get signers
  const [owner, user1, user2, user3] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);
  console.log("👤 User3:", user3.address);

  // Deploy Factory
  console.log("\n📦 Deploying BellaNapoliPredictionFactory...");
  const BellaNapoliPredictionFactory = await ethers.getContractFactory("BellaNapoliPredictionFactory");
  const factory = await BellaNapoliPredictionFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress);

  // Create BTC Prediction Pool
  console.log("\n🎯 Creating BTC 150k Prediction Pool...");
  
  // Set dates (for testing, use short periods)
  const now = Math.floor(Date.now() / 1000);
  const closingDate = now + 60; // 1 minute from now
  const closingBid = now + 120; // 2 minutes from now
  
  // Date reali per produzione (orari italiani convertiti in UTC)
  // Chiusura scommesse: 15 novembre 2025, 21:59 CET = 15 novembre 2025, 20:59 UTC
  // Scadenza prediction: 31 dicembre 2025, 21:59 CET = 31 dicembre 2025, 20:59 UTC
  const realClosingDate = 1763236740; // 15 novembre 2025, 20:59 UTC
  const realClosingBid = 1767211140;  // 31 dicembre 2025, 20:59 UTC
  
  const tx = await factory.createPool(
    "Bitcoin raggiungerà $150,000 entro fine 2025?",
    "Scommetti se Bitcoin raggiungerà o supererà $150,000 entro il 31 dicembre 2025. Il prezzo sarà determinato dal prezzo di chiusura su Binance.",
    "Crypto",
    closingDate,
    closingBid
  );
  
  const receipt = await tx.wait();
  const poolCreatedEvent = receipt.logs.find(log => log.fragment?.name === 'PoolCreated');
  const poolAddress = poolCreatedEvent.args.poolAddress;
  
  console.log("✅ Pool created at:", poolAddress);
  console.log("📅 Closing date:", new Date(closingDate * 1000).toLocaleString());
  console.log("📅 Closing bid:", new Date(closingBid * 1000).toLocaleString());

  // Get pool contract
  const PredictionPool = await ethers.getContractFactory("PredictionPool");
  const pool = PredictionPool.attach(poolAddress);

  // Check pool info
  const poolInfo = await pool.getPoolInfo();
  console.log("\n📊 Pool Info:");
  console.log("Title:", poolInfo[0]);
  console.log("Category:", poolInfo[2]);
  console.log("Closing Date:", new Date(Number(poolInfo[3]) * 1000).toLocaleString());
  console.log("Closing Bid:", new Date(Number(poolInfo[4]) * 1000).toLocaleString());

  // Users place bets
  console.log("\n💰 Users placing bets...");
  
  // User1 bets YES (1 ETH)
  const bet1Amount = ethers.parseEther("1.0");
  await pool.connect(user1).placeBet(true, { value: bet1Amount });
  console.log("✅ User1 bet YES with 1 ETH");

  // User2 bets NO (0.5 ETH)
  const bet2Amount = ethers.parseEther("0.5");
  await pool.connect(user2).placeBet(false, { value: bet2Amount });
  console.log("✅ User2 bet NO with 0.5 ETH");

  // User3 bets YES (2 ETH)
  const bet3Amount = ethers.parseEther("2.0");
  await pool.connect(user3).placeBet(true, { value: bet3Amount });
  console.log("✅ User3 bet YES with 2 ETH");

  // Check pool stats
  const stats = await pool.getPoolStats();
  console.log("\n📈 Pool Statistics:");
  console.log("Total YES:", ethers.formatEther(stats[0]), "ETH");
  console.log("Total NO:", ethers.formatEther(stats[1]), "ETH");
  console.log("Total Bets:", ethers.formatEther(stats[2]), "ETH");
  console.log("Number of Bettors:", stats[3].toString());

  // Wait for betting to close
  console.log("\n⏳ Waiting for betting period to close...");
  await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds

  // Set winner (YES wins)
  console.log("\n🏆 Setting winner to YES...");
  await pool.setWinner(true);
  console.log("✅ Winner set to YES");

  // Check final stats
  const finalStats = await pool.getPoolStats();
  console.log("\n📊 Final Statistics:");
  console.log("Winner:", finalStats[6] ? "YES" : "NO");
  console.log("Winning Pot:", ethers.formatEther(finalStats[0]), "ETH");
  console.log("Losing Pot:", ethers.formatEther(finalStats[1]), "ETH");
  
  // Check fee and redistribution info
  const feeInfo = await pool.getFeeInfo();
  const redistributionInfo = await pool.getRedistributionInfo();
  
  console.log("\n💰 Fee Information:");
  console.log("Fee Wallet:", feeInfo[0]);
  console.log("Fee Percentage:", feeInfo[1].toString(), "basis points (1.5%)");
  console.log("Calculated Fee:", ethers.formatEther(feeInfo[2]), "ETH");
  console.log("Fee Sent:", feeInfo[3]);
  
  console.log("\n🔄 Redistribution Information:");
  console.log("Winning Pot:", ethers.formatEther(redistributionInfo[0]), "ETH");
  console.log("Losing Pot:", ethers.formatEther(redistributionInfo[1]), "ETH");
  console.log("Fee Amount:", ethers.formatEther(redistributionInfo[2]), "ETH");
  console.log("Net Losing Pot:", ethers.formatEther(redistributionInfo[3]), "ETH");
  console.log("Total Redistribution:", ethers.formatEther(redistributionInfo[4]), "ETH");

  // Users claim rewards
  console.log("\n💸 Users claiming rewards...");
  
  // User1 claims (YES winner)
  const user1Bet = await pool.getUserBet(user1.address);
  console.log("User1 bet amount:", ethers.formatEther(user1Bet.amount), "ETH");
  console.log("User1 choice:", user1Bet.choice ? "YES" : "NO");
  
  await pool.connect(user1).claim();
  console.log("✅ User1 claimed reward");

  // User3 claims (YES winner)
  const user3Bet = await pool.getUserBet(user3.address);
  console.log("User3 bet amount:", ethers.formatEther(user3Bet.amount), "ETH");
  console.log("User3 choice:", user3Bet.choice ? "YES" : "NO");
  
  await pool.connect(user3).claim();
  console.log("✅ User3 claimed reward");

  // Check factory fees
  const totalFees = await factory.totalFeesCollected();
  console.log("\n💰 Factory Fees Collected:", ethers.formatEther(totalFees), "ETH");

  console.log("\n🎉 BTC Prediction Market test completed successfully!");
  console.log("🔗 Factory Address:", factoryAddress);
  console.log("🔗 Pool Address:", poolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
