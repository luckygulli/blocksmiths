import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIo from "terminal-game-io";
import { ResourcePosition } from "./Farming.js";

const Key = TerminalGameIo.Key;

// ========== CONFIG ==========
// Replace with your deployed contract address
const boardAddress = "0x930b218f3e63eE452c13561057a8d5E61367d5b7";
const farmingAddress = "0x721d8077771Ebf9B931733986d619aceea412a1C";

const RPC_URL = "http://127.0.0.1:8545";

// --- pick a random account from 0..4 ---
const accounts = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
];
const myPrivateKey = accounts[Math.floor(Math.random() * accounts.length)];

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;
const FPS = 25;
// ============================

// Load ABI
const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);
const farmingArtifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Farming.sol/Farming.json"), "utf8")
);

// Setup provider & signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(myPrivateKey, provider);

// Attach to contract
const boardContract = new ethers.Contract(boardAddress, artifact.abi, signer);
const farmingContract = new ethers.Contract(farmingAddress, farmingArtifact.abi, signer);


let myAddress: string;
let positions: Record<string, { x: number; y: number }> = {};
let resourcePositions: ResourcePosition[] = [];

// === Initialise ===
async function initGame() {
  myAddress = await signer.getAddress();

  try {
    await boardContract.initPosition(0, 0);

  } catch (err: any) {
    // already initialized → ignore
  }

  await getResourcePositions();
  await refreshPositions();
}

// === Refresh all positions from chain ===
async function refreshPositions() {
  const players: string[] = await boardContract.getAllPlayers();

  const newPositions: Record<string, { x: number; y: number }> = {};
  for (const addr of players) {
    try {
      const [x, y] = await boardContract.getPosition(addr);
      newPositions[addr] = {
        x: Number(x),
        y: Number(y),
      };
    } catch {
      // skip uninitialized players
    }
  }

  positions = newPositions;
}

// === Draw the board ===
function frameHandler(instance: any) {
  let frameData = "";

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let char = ".";
      for (const resourcePosition of resourcePositions) {
        if (x == resourcePosition.x && y == resourcePosition.y) {
          if (resourcePosition.resourceId == 'wood') {
            char = "w";
          } else {
            char = "s"
          }
        }
      }
      for (const [addr, pos] of Object.entries(positions)) {
        if (pos.x === x && pos.y === y) {
          char = addr.toLowerCase() === myAddress.toLowerCase() ? "@" : "O";
        }
      }
      frameData += char;
    }
  }

  instance.drawFrame(frameData, BOARD_WIDTH, BOARD_HEIGHT);
}

// === Handle movement ===
async function keypressHandler(instance: any, keyName: string) {
  const me = positions[myAddress];
  let newX = me?.x ?? 0;
  let newY = me?.y ?? 0;

  switch (keyName) {
    case Key.ArrowDown:
      newY++;
      break;
    case Key.ArrowUp:
      newY--;
      break;
    case Key.ArrowLeft:
      newX--;
      break;
    case Key.ArrowRight:
      newX++;
      break;
    case Key.Escape:
      instance.exit();
      return;
    case Key.Space:
      await farm(newX, newY);
      return; 
  }

  try {
    await boardContract.move(newX, newY);
  } catch (err) {
    // invalid move → ignore
  }

  await refreshPositions();
  frameHandler(instance);
}

// === Start game ===
async function main() {
  await initGame();

  process.stdout.write("\x1b[2J\x1b[H");

  const game = TerminalGameIo.createTerminalGameIo({
    fps: FPS,
    frameHandler,
    keypressHandler,
  });

  // Update board whenever a PositionSet event is emitted
  boardContract.on("PositionSet", async () => {
    await refreshPositions();
    frameHandler(game);
  });

  setInterval(async () => {
    await refreshPositions();
  }, 100); // refresh every 100ms
}

main().catch(console.error);


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

async function farm(x: number, y: number) {
  let type;
  if (isIncludedInResourcePositions('wood', x, y)) {
    type = 'wood'
  } else if (isIncludedInResourcePositions('stone', x, y)) {
    type = 'stone'
  }
  if (type == undefined) {
    return;
  }
try {
    await farmingContract.farm(type, x, y);
  } catch (err: any) {
    console.log("No Resource:", err.message);
  }
}

farmingContract.on("NewResourcePosition", async () => {
  await getResourcePositions();
})