import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BoardModule", (m) => {
  const board = m.contract("Board");
  const farming = m.contract("Farming");
  return { board, farming };
});
