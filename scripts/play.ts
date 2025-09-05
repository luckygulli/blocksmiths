import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import TerminalGameIO from "terminal-game-io";

// ---------------------------
// Configuration
// ---------------------------
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;
const FPS = 2;

const RPC_URL = "http://127.0.0.1:8545"; // your simulated network
const PRIVATE_KEY =
  "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";
const BOARD_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ---------------------------
// Setup ethers
// ---------------------------
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);
const boardContract = new ethers.Contract(BOARD_ADDRESS, artifact.abi, signer);

// ---------------------------
// Game state
// ---------------------------
let players: Record<string, { x: number; y: number }> = {};
let myAddress: string;
let gameInstance: any;

// ---------------------------
// Initialize my player position
// ---------------------------
async function initializePosition() {
  myAddress = await signer.getAddress();
  try {
    await boardContract.initPosition(0, 0);
    console.log("Initialized position at (0,0)");
    players[myAddress] = { x: 0, y: 0 };
  } catch (err: any) {
    console.log("Already initialized, fetching position...");
    const [x, y] = await boardContract.getPosition(myAddress);
    players[myAddress] = { x: Number(x), y: Number(y) };
    console.log(`Current position: (${players[myAddress].x}, ${players[myAddress].y})`);
  }
}

// ---------------------------
// Fetch all player positions
// ---------------------------
async function refreshPlayers() {
  const allAddresses: string[] = await boardContract.getAllPlayers();
  for (const addr of allAddresses) {
    const [x, y] = await boardContract.getPosition(addr);
    players[addr] = { x: Number(x), y: Number(y) };
  }
}

// ---------------------------
// Frame handler
// ---------------------------
const frameHandler = (instance: any) => {
  let frameData = "";
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const playerHere = Object.entries(players).find(
        ([_, pos]) => pos.x === x && pos.y === y
      );
      if (playerHere) {
        frameData += playerHere[0] === myAddress ? "@" : "O";
      } else {
        frameData += ".";
      }
    }
  }
  instance.drawFrame(frameData, BOARD_WIDTH, BOARD_HEIGHT);
};

// ---------------------------
// Key press handler
// ---------------------------
const keypressHandler = async (instance: any, keyName: string) => {
  let newX = players[myAddress].x;
  let newY = players[myAddress].y;

  switch (keyName) {
    case TerminalGameIO.Key.ArrowUp:
      newY = players[myAddress].y === 0 ? BOARD_HEIGHT - 1 : players[myAddress].y - 1;
      break;
    case TerminalGameIO.Key.ArrowDown:
      newY = (players[myAddress].y + 1) % BOARD_HEIGHT;
      break;
    case TerminalGameIO.Key.ArrowLeft:
      newX = players[myAddress].x === 0 ? BOARD_WIDTH - 1 : players[myAddress].x - 1;
      break;
    case TerminalGameIO.Key.ArrowRight:
      newX = (players[myAddress].x + 1) % BOARD_WIDTH;
      break;
    case TerminalGameIO.Key.Escape:
      instance.exit();
      return;
  }

  try {
    await boardContract.move(newX, newY);
    await refreshPlayers(); // update positions after move
  } catch (err: any) {
    console.log("Invalid move:", err.message);
  }

  frameHandler(instance);
};

// ---------------------------
// Main function
// ---------------------------
async function main() {
  await initializePosition();
  await refreshPlayers();

  // Listen to PlayerMoved events for live updates
  boardContract.on("PlayerMoved", async () => {
    await refreshPlayers();
    frameHandler(gameInstance);
  });

  // Create the terminal game instance
  gameInstance = TerminalGameIO.createTerminalGameIo({
    fps: FPS,
    frameHandler,
    keypressHandler,
  });
}

main().catch(console.error);
