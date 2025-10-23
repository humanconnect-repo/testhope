// Script per calcolare timestamp UTC da orari italiani
const { ethers } = require("hardhat");

function calculateTimestamps() {
  console.log("🇮🇹 Calcolo timestamp per orari italiani");
  console.log("=====================================");
  
  // Date italiane (CET = UTC+1)
  const bettingCloseItalian = new Date('2025-11-15T21:59:00+01:00'); // CET
  const predictionEndItalian = new Date('2025-12-31T21:59:00+01:00'); // CET
  
  // Conversione a UTC
  const bettingCloseUTC = new Date(bettingCloseItalian.getTime() - (1 * 60 * 60 * 1000)); // -1 ora
  const predictionEndUTC = new Date(predictionEndItalian.getTime() - (1 * 60 * 60 * 1000)); // -1 ora
  
  // Timestamp Unix (secondi)
  const bettingCloseTimestamp = Math.floor(bettingCloseUTC.getTime() / 1000);
  const predictionEndTimestamp = Math.floor(predictionEndUTC.getTime() / 1000);
  
  console.log("\n📅 Date italiane (CET):");
  console.log("Chiusura scommesse:", bettingCloseItalian.toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
  console.log("Scadenza prediction:", predictionEndItalian.toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
  
  console.log("\n🌍 Date UTC:");
  console.log("Chiusura scommesse:", bettingCloseUTC.toISOString());
  console.log("Scadenza prediction:", predictionEndUTC.toISOString());
  
  console.log("\n⏰ Timestamp Unix (per Smart Contract):");
  console.log("Chiusura scommesse:", bettingCloseTimestamp);
  console.log("Scadenza prediction:", predictionEndTimestamp);
  
  console.log("\n📊 Verifica:");
  console.log("Ora attuale UTC:", new Date().toISOString());
  console.log("Ora attuale italiana:", new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
  
  // Calcola giorni rimanenti
  const now = Math.floor(Date.now() / 1000);
  const daysToBettingClose = Math.floor((bettingCloseTimestamp - now) / (24 * 60 * 60));
  const daysToPredictionEnd = Math.floor((predictionEndTimestamp - now) / (24 * 60 * 60));
  
  console.log("\n⏳ Tempo rimanente:");
  console.log("Giorni alla chiusura scommesse:", daysToBettingClose);
  console.log("Giorni alla scadenza prediction:", daysToPredictionEnd);
  
  return {
    bettingCloseTimestamp,
    predictionEndTimestamp,
    bettingCloseItalian: bettingCloseItalian.toISOString(),
    predictionEndItalian: predictionEndItalian.toISOString()
  };
}

// Funzione per testare con date vicine (per testing)
function calculateTestTimestamps() {
  console.log("\n🧪 Timestamp per TESTING (date vicine)");
  console.log("=====================================");
  
  const now = new Date();
  const bettingCloseTest = new Date(now.getTime() + (2 * 60 * 1000)); // 2 minuti da ora
  const predictionEndTest = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minuti da ora
  
  const bettingCloseTestTimestamp = Math.floor(bettingCloseTest.getTime() / 1000);
  const predictionEndTestTimestamp = Math.floor(predictionEndTest.getTime() / 1000);
  
  console.log("Chiusura scommesse (test):", bettingCloseTest.toISOString());
  console.log("Scadenza prediction (test):", predictionEndTest.toISOString());
  console.log("Timestamp chiusura (test):", bettingCloseTestTimestamp);
  console.log("Timestamp scadenza (test):", predictionEndTestTimestamp);
  
  return {
    bettingCloseTestTimestamp,
    predictionEndTestTimestamp
  };
}

if (require.main === module) {
  const realTimestamps = calculateTimestamps();
  const testTimestamps = calculateTestTimestamps();
  
  console.log("\n💡 Per usare nei contratti:");
  console.log("// Date reali");
  console.log(`const closingDate = ${realTimestamps.bettingCloseTimestamp};`);
  console.log(`const closingBid = ${realTimestamps.predictionEndTimestamp};`);
  console.log("\n// Date di test");
  console.log(`const closingDateTest = ${testTimestamps.bettingCloseTestTimestamp};`);
  console.log(`const closingBidTest = ${testTimestamps.predictionEndTestTimestamp};`);
}

module.exports = { calculateTimestamps, calculateTestTimestamps };
