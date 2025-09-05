import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIO from "terminal-game-io";
import { ResourcePosition } from "./Farming.js";

// ---------------------------
// Config
// ---------------------------
const boardAddress = "0x6e0a5725dD4071e46356bD974E13F35DbF9ef367";
const farmingAddress = "0xA9d0Fb5837f9c42c874e16da96094b14Af0e2784";
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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
const farmingArtifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Farming.sol/Farming.json"), "utf8")
);
const boardContract = new ethers.Contract(boardAddress, artifact.abi, signer);
const farmingContract = new ethers.Contract(farmingAddress, farmingArtifact.abi, signer);


// ---------------------------
// Player state
// ---------------------------
let posX = 0;
let posY = 0;

// Resource positions
let resourcePositions: ResourcePosition[] = [];

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
// Get the current Resource positions
// ---------------------------
async function getResourcePositions() {
    try {
      resourcePositions = await farmingContract.getResourcePositions();
    } catch (err: any) {
    console.log("Something went wrong", err);
  }
}


// ---------------------------
// Frame handler
// ---------------------------
const frameHandler = (instance: any) => {
  let frameData = "";

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (posX === x && posY === y) {
        frameData += "@";
      } else if (isIncludedInResourcePositions('wood', x, y)) {
        frameData += "|";
      } else if (isIncludedInResourcePositions('stone', x, y)) {
        frameData += "o";
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
    case TerminalGameIO.Key.Space:
      await farm();
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
  await getResourcePositions();

  TerminalGameIO.createTerminalGameIo({
    fps: 2,
    frameHandler,
    keypressHandler,
  });
}

// ---------------------------
// Interact with Farming
// ---------------------------
async function farm() {
  let type;
  if (isIncludedInResourcePositions('wood', posX, posY)) {
    type = 'wood'
  } else if (isIncludedInResourcePositions('stone', posX, posY)) {
    type = 'stone'
  }
  if (type == undefined) {
    return;
  }
try {
    await farmingContract.farm(type, posX, posY);
  } catch (err: any) {
    console.log("No Resource:", err.message);
  }
}

main().catch(console.error);


function isIncludedInResourcePositions(resourceId: string, x: number, y: number) {
  for (const resourcePosition of resourcePositions) {
    if (resourcePosition.resourceId == resourceId 
      && resourcePosition.x == x
      && resourcePosition.y == y
    ) {
      return true;
    }
  }
  return false;
}

farmingContract.on("NewResourcePosition", async () => {
  await getResourcePositions();
})