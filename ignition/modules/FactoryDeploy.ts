import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FactoryDeployModule = buildModule("FactoryDeployModule", (m) => {
  const factory = m.contract("BellaNapoliPredictionFactoryOptimized");

  return { factory };
});

export default FactoryDeployModule;
