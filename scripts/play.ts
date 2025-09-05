import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIO from "terminal-game-io";

// ---------------------------
// Config
// ---------------------------
const boardAddress = "0xcabee62adfb2a4d4172fc2f7536f324fc52c274a";
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY =
  "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1";

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;

// ---------------------------
// Setup ethers
// ---------------------------
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);
const boardContract = new ethers.Contract(boardAddress, artifact.abi, signer);

// ---------------------------
// Player state
// ---------------------------
let posX = 0;
let posY = 0;

// ---------------------------
// Initialize position on-chain or fetch existing
// ---------------------------
async function initializePosition() {
  try {
    await boardContract.initPosition(posX, posY);
    console.log(`Initialized position at (${posX}, ${posY})`);
  } catch (err: any) {
    console.log("Position already initialized, fetching from blockchain...");

    // Fetch current position from the contract
    const [x, y] = await boardContract.getPosition(signer.address);
    posX = Number(x); // convert bigint to number
    posY = Number(y);
    console.log(`Current position: (${posX}, ${posY})`);
  }
}


// ---------------------------
// Frame handler
// ---------------------------
const frameHandler = (instance: any) => {
  let frameData = "";

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      frameData += posX === x && posY === y ? "@" : ".";
    }
  }

  instance.drawFrame(frameData, BOARD_WIDTH, BOARD_HEIGHT);
};

// ---------------------------
// Key press handler
// ---------------------------
const keypressHandler = async (instance: any, keyName: string) => {
  let newX = posX;
  let newY = posY;

  switch (keyName) {
    case TerminalGameIO.Key.ArrowUp:
      newY = posY === 0 ? BOARD_HEIGHT - 1 : posY - 1;
      break;
    case TerminalGameIO.Key.ArrowDown:
      newY = (posY + 1) % BOARD_HEIGHT;
      break;
    case TerminalGameIO.Key.ArrowLeft:
      newX = posX === 0 ? BOARD_WIDTH - 1 : posX - 1;
      break;
    case TerminalGameIO.Key.ArrowRight:
      newX = (posX + 1) % BOARD_WIDTH;
      break;
    case TerminalGameIO.Key.Escape:
      instance.exit();
      return;
  }

  try {
    await boardContract.move(newX, newY);
    posX = newX;
    posY = newY;
  } catch (err: any) {
    console.log("Invalid move:", err.message);
  }

  frameHandler(instance);
};

// ---------------------------
// Run the game
// ---------------------------
async function main() {
  await initializePosition();

  TerminalGameIO.createTerminalGameIo({
    fps: 2,
    frameHandler,
    keypressHandler,
  });
}

main().catch(console.error);
