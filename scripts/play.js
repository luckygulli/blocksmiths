import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import TerminalGameIO from "terminal-game-io";

// Already deployed contract address
const boardAddress = "0xcabee62adfb2a4d4172fc2f7536f324fc52c274a";

// Connect to your simulated network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(
  "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
  provider
);

// Load ABI
const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);

// Attach contract
const boardContract = new ethers.Contract(boardAddress, artifact.abi, signer);

async function main() {
  // Initialize player position
  try {
    await boardContract.initPosition(0, 0);
  } catch (err) {
    console.log("Already initialized:", err.message);
  }

  // Create terminal game
const game = TerminalGameIO.createTerminalGameIo({ width: 20, height: 10 });
  let playerPos = { x: 0, y: 0 };
  game.printAt(playerPos.x, playerPos.y, "🙂");
  game.render();

  // Listen for key presses
  game.onKey(async (key) => {
    let newX = playerPos.x;
    let newY = playerPos.y;

    if (key === "up") newY -= 1;
    if (key === "down") newY += 1;
    if (key === "left") newX -= 1;
    if (key === "right") newX += 1;

    try {
      // Move on-chain (distance 1 enforced by contract)
      await boardContract.move(newX, newY);
      playerPos = { x: newX, y: newY };

      // Update terminal display
      game.clear();
      game.printAt(playerPos.x, playerPos.y, "🙂");
      game.render();
    } catch (err) {
      console.log("Invalid move:", err.message);
    }
  });
}

main().catch(console.error);
