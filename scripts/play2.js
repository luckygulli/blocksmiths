import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  // 1️⃣ Connect to your simulated network
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // or the actual URL of your edr-simulated network

  // TODO Get one of the private keys from the network
  const signer = new ethers.Wallet(
    "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
    provider
  );

  // 3️⃣ Load your compiled artifact
  const artifact = JSON.parse(
    fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
  );

  // 4️⃣ Create a ContractFactory manually
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  // 5️⃣ Deploy contract
  const board = await factory.deploy();
  await board.deployTransaction.wait();
  console.log("Board deployed at:", board.address);

  // 6️⃣ Initialize position
  const tx = await board.initPosition(0, 0);
  await tx.wait();
  console.log("Player initialized at (0,0)");
}

main().catch(console.error);
