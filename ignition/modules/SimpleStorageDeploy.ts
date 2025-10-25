import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SimpleStorageDeploy", (m) => {
  // Deploy del contratto SimpleStorage (usa account di default)
  const simpleStorage = m.contract("SimpleStorage");

  // Chiamata a set(42) dopo il deploy
  m.call(simpleStorage, "set", [42]);

  return { simpleStorage };
});
