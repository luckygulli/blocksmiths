import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIo from "terminal-game-io";
import { ResourcePosition } from "./Farming.js";

const Key = TerminalGameIo.Key;

// ========== CONFIG ==========
const boardAddress = "0x72662E4da74278430123cE51405c1e7A1B87C294";
const farmingAddress = "0x52bad4A8584909895C22bdEcf8DBF33314468Fb0";
const RPC_URL = "http://127.0.0.1:8545";

// pick 2 different random accounts
const accounts = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
];
const idx1 = Math.floor(Math.random() * accounts.length);
const idx2 = (idx1 + Math.floor(Math.random() * (accounts.length - 1)) + 1) % accounts.length;

const playerKeys = [accounts[idx1], accounts[idx2]];

// Player controls
const CONTROLS = [
  { up: Key.ArrowUp, down: Key.ArrowDown, left: Key.ArrowLeft, right: Key.ArrowRight, farm: Key.Space },
  { up: 'w', down: 's', left: 'a', right: 'd', farm: 'f' }
];

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;
const FPS = 25;
// ============================

// Load ABI
const artifact = JSON.parse(fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8"));
const farmingArtifact = JSON.parse(fs.readFileSync(path.join("artifacts/contracts/Farming.sol/Farming.json"), "utf8"));

// Setup provider & signers
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signers = playerKeys.map(pk => new ethers.Wallet(pk, provider));

// Attach to contracts
const boardContracts = signers.map(s => new ethers.Contract(boardAddress, artifact.abi, s));
const farmingContracts = signers.map(s => new ethers.Contract(farmingAddress, farmingArtifact.abi, s));

let positions: Record<string, { x: number; y: number }> = {};
let resourcePositions: ResourcePosition[] = [];
let leaderboard: {address: string, wood: number, stone: number}[] = [];
let playerAddresses: string[] = [];

// === Initialise ===
async function initGame() {
  playerAddresses = await Promise.all(signers.map(s => s.getAddress()));

  // init positions for both players
  for (let i = 0; i < boardContracts.length; i++) {
    try { await boardContracts[i].initPosition(i, 0); } catch { }
  }

  await getResourcePositions();
  await refreshPositions();
  await getInitialLeaderboard();
}

// === Refresh all positions from chain ===
async function refreshPositions() {
  const players: string[] = await boardContracts[0].getAllPlayers();
  const newPositions: Record<string, { x: number; y: number }> = {};
  for (const addr of players) {
    try {
      const [x, y] = await boardContracts[0].getPosition(addr);
      newPositions[addr] = { x: Number(x), y: Number(y) };
    } catch { }
  }
  positions = newPositions;
}

// === Draw the board ===
function frameHandler(instance: any) {
  let frameData = "";

  for (let y = -1; y <= BOARD_HEIGHT; y++) {
    let line = ""
    for (let x = -1; x <= BOARD_WIDTH; x++) {
      let char = " ";

      if (y === -1 && x === -1) char = "┌";
      else if (y === -1 && x === BOARD_WIDTH) char = "┐";
      else if (y === BOARD_HEIGHT && x === -1) char = "└";
      else if (y === BOARD_HEIGHT && x === BOARD_WIDTH) char = "┘";
      else if (y === -1 || y === BOARD_HEIGHT) char = "─";
      else if (x === -1 || x === BOARD_WIDTH) char = "│";
      else {
        char = ".";
        for (const r of resourcePositions) {
          if (x == r.x && y == r.y) char = r.resourceId == 'wood' ? "w" : "s";
        }
        for (const [addr, pos] of Object.entries(positions)) {
          if (pos.x === x && pos.y === y) {
            const idx = playerAddresses.findIndex(a => a.toLowerCase() === addr.toLowerCase());
            char = idx === 0 ? "@" : idx === 1 ? "O" : "X";
          }
        }
      }
      line += char;
    }

    // Add leaderboard column at the right
      if (y + 1 < leaderboard.length) {
        const player = leaderboard[y + 1];
        const idx = playerAddresses.findIndex(a => a.toLowerCase() === player.address.toLowerCase());
        const char = idx === 0 ? "@" : idx === 1 ? "O" : "X";
        const leaderboardString = `   ${char} | W:${mapToLeaderboard(player.wood)} S:${mapToLeaderboard(player.stone)}`;
        line += leaderboardString;
      }
  
    line = line.padEnd(100, " ");
    frameData += line;
  }

  instance.drawFrame(frameData, 100, BOARD_HEIGHT + 2);
}

// === Handle movement ===
async function keypressHandler(instance: any, keyName: string) {
  for (let i = 0; i < CONTROLS.length; i++) {
    const ctrl = CONTROLS[i];
    const addr = playerAddresses[i];
    const me = positions[addr];
    let newX = me?.x ?? 0;
    let newY = me?.y ?? 0;

    if ([ctrl.up, ctrl.down, ctrl.left, ctrl.right, ctrl.farm].includes(keyName)) {
      if (keyName === ctrl.up) newY--;
      if (keyName === ctrl.down) newY++;
      if (keyName === ctrl.left) newX--;
      if (keyName === ctrl.right) newX++;
      if (keyName === ctrl.farm) await farm(i, newX, newY);

      if (keyName !== ctrl.farm) {
        if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) return;
        try { await boardContracts[i].move(newX, newY); } catch { }
      }
    } else if (keyName === Key.Escape) {
      instance.exit();
      return;
    }
  }
  await refreshPositions();
  frameHandler(instance);
}

// === Start game ===
async function main() {
  await initGame();

  process.stdout.write("\x1b[2J\x1b[H");

  const game = TerminalGameIo.createTerminalGameIo({ fps: FPS, frameHandler, keypressHandler });

  boardContracts[0].on("PositionSet", async () => { await refreshPositions(); frameHandler(game); });
  boardContracts[1].on("PositionSet", async () => { await refreshPositions(); frameHandler(game); });

  setInterval(async () => { await refreshPositions(); await getResourcePositions(); }, 100);
}

main().catch(console.error);

// ---------------------------
async function getResourcePositions() {
  try { resourcePositions = await farmingContracts[0].getResourcePositions(); } catch { }
}

async function getInitialLeaderboard() {
  for (const player of playerAddresses) {
    const resources = await farmingContracts[0].getResourceCount(player);
    const leaderboardEntry = {address: player, wood: 0, stone: 0};
    for (const resource of resources) {
      leaderboardEntry[resource.resourceId] = resource.count;
    }
  }
}

function sortLeaderboard() {
  leaderboard = leaderboard.sort((a, b) => {
    const totalA = a.wood + a.stone;
    const totalB = b.wood + b.stone;
    return totalB - totalA;
  });
}

function isIncludedInResourcePositions(resourceId: string, x: number, y: number) {
  return resourcePositions.some(r => r.resourceId == resourceId && r.x == x && r.y == y);
}

async function farm(playerIdx: number, x: number, y: number) {
  let type: string | undefined;
  if (isIncludedInResourcePositions('wood', x, y)) type = 'wood';
  else if (isIncludedInResourcePositions('stone', x, y)) type = 'stone';
  if (!type) return;

  try { await farmingContracts[playerIdx].farm(type, x, y); } catch { }
}

farmingContracts[0].on("NewResourcePosition", async () => { await getResourcePositions(); });
farmingContracts[1].on("NewResourcePosition", async () => { await getResourcePositions(); });


farmingContracts[0].on("ResourceFarmed", (resourceId, address) => {
  for (const player of leaderboard) {
    if (player.address == address) {
      player[resourceId]++;
      sortLeaderboard();
      return;
    }
  }
  const newPlayer = {address: address, wood: 0, stone: 0};
  newPlayer[resourceId]++;
  leaderboard.push(newPlayer);

  sortLeaderboard();
})

function mapToLeaderboard(value: number) {
    return value.toString().padStart(4, "0");
}
