// Example: already deployed contract address
const boardAddress = "0xcabee62adfb2a4d4172fc2f7536f324fc52c274a";

// Load ABI
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // your simulated network
const signer = new ethers.Wallet("0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1", provider);

// Load the compiled artifact
const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);

// Attach to the deployed contract
const boardContract = new ethers.Contract(boardAddress, artifact.abi, signer);

// Now you can call functions
await boardContract.initPosition(0, 0);
