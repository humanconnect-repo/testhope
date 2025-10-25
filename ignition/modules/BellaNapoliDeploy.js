import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BellaNapoliDeployModule = buildModule("BellaNapoliDeployModule", (m) => {
  // Deploy del BellaNapoliPredictionFactory
  const bellaNapoliFactory = m.contract("BellaNapoliPredictionFactory", []);

  return { bellaNapoliFactory };
});

export default BellaNapoliDeployModule;
