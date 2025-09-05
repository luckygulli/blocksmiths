import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIo from "terminal-game-io";

const Key = TerminalGameIo.Key;

// ========== CONFIG ==========
const boardAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = "http://127.0.0.1:8545";

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;
const FPS = 5; // replay at 1 FPS
// ============================

// Load ABI
const artifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);

// Setup provider (no signer needed for replay)
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Attach to contract
const boardContract = new ethers.Contract(boardAddress, artifact.abi, provider);

type Pos = { x: number; y: number };
let history: { player: string; x: number; y: number }[] = [];
let frameIndex = 0;

// === Fetch all events since block 0 ===
async function loadHistory() {
  const filter = boardContract.filters.PositionSet();
  const events = await boardContract.queryFilter(filter, 0, "latest");

  history = events.map((e) => {
    return {
      player: (e.args as any).player,
      x: Number((e.args as any).x),
      y: Number((e.args as any).y),
    };
  });
  console.log(`Loaded ${history.length} moves`);
}

// === Draw a given frame ===
function drawFrame(instance: any, frameIndex: number) {
  const positions: Record<string, Pos> = {};

  // Apply all moves up to this frame
  for (let i = 0; i <= frameIndex; i++) {
    const move = history[i];
    if (move) {
      positions[move.player] = { x: move.x, y: move.y };
    }
  }

  let frameData = "";
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let char = ".";
      for (const [addr, pos] of Object.entries(positions)) {
        if (pos.x === x && pos.y === y) {
          char = "O"; // all players same marker in replay
        }
      }
      frameData += char;
    }
  }

  instance.drawFrame(frameData, BOARD_WIDTH, BOARD_HEIGHT);
}

// === Start replay ===
async function main() {
  await loadHistory();

  process.stdout.write("\x1b[2J\x1b[H");

  const game = TerminalGameIo.createTerminalGameIo({
    fps: FPS,
    frameHandler: (instance: any) => {
      drawFrame(instance, frameIndex);
      frameIndex++;
      if (frameIndex >= history.length) {
        console.log("Replay finished.");
        instance.exit();
      }
    },
    keypressHandler: (instance: any, keyName: string) => {
      if (keyName === Key.Escape) {
        instance.exit();
      }
    },
  });
}

main().catch(console.error);
