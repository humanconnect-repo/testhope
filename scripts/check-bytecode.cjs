const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Controllo bytecode del contratto deployato...");
  
  const contractAddress = "0xC8AdeC0e56FFa0D7B00292C64b62233BEF856E4A";
  
  try {
    // Ottieni il bytecode dal contratto deployato
    const code = await ethers.provider.getCode(contractAddress);
    console.log("📋 Bytecode length:", code.length);
    console.log("📋 Bytecode (first 100 chars):", code.substring(0, 100));
    console.log("📋 Bytecode (last 100 chars):", code.substring(code.length - 100));
    
    // Prova a compilare il contratto locale
    console.log("\n🔨 Compilazione contratto locale...");
    const BellaNapoliPredictionFactory = await ethers.getContractFactory("BellaNapoliPredictionFactory");
    const bytecode = BellaNapoliPredictionFactory.bytecode;
    console.log("📋 Local bytecode length:", bytecode.length);
    console.log("📋 Local bytecode (first 100 chars):", bytecode.substring(0, 100));
    console.log("📋 Local bytecode (last 100 chars):", bytecode.substring(bytecode.length - 100));
    
    // Confronta i bytecode
    if (code === bytecode) {
      console.log("✅ Bytecode corrispondono!");
    } else {
      console.log("❌ Bytecode NON corrispondono!");
      console.log("📋 Differenze:");
      for (let i = 0; i < Math.min(code.length, bytecode.length); i++) {
        if (code[i] !== bytecode[i]) {
          console.log(`   Posizione ${i}: deployato='${code[i]}', locale='${bytecode[i]}'`);
          if (i > 10) break; // Mostra solo le prime differenze
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Errore:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
