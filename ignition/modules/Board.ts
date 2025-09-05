import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BoardModule", (m) => {
  const board = m.contract("Board");
  return { board };
});
