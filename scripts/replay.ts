import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import TerminalGameIo from "terminal-game-io";
import { ResourcePosition } from "./Farming.js";

const FPS = 5;
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 10;

const boardAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const farmingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const RPC_URL = "http://127.0.0.1:8545";

// Load ABIs
const boardArtifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Board.sol/Board.json"), "utf8")
);
const farmingArtifact = JSON.parse(
  fs.readFileSync(path.join("artifacts/contracts/Farming.sol/Farming.json"), "utf8")
);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const boardContract = new ethers.Contract(boardAddress, boardArtifact.abi, provider);
const farmingContract = new ethers.Contract(farmingAddress, farmingArtifact.abi, provider);

// ---------- State ----------
let history: { type: string; data: any }[] = [];
let frameIndex = 0;
let positions: Record<string, { x: number; y: number }> = {};
let resourcePositions: ResourcePosition[] = [];

// ---------- Load history ----------
async function loadHistory() {
  // Player moves
  const moveEvents = await boardContract.queryFilter("PositionSet", 0, "latest");
  for (const ev of moveEvents) {
    history.push({
      type: "PositionSet",
      data: {
        player: ev.args?.player,
        x: Number(ev.args?.x),
        y: Number(ev.args?.y),
      },
    });
  }

  // Farming
  const farmEvents = await farmingContract.queryFilter("ResourceFarmed", 0, "latest");
  for (const ev of farmEvents) {
    history.push({
      type: "ResourceFarmed",
      data: {
        resourceId: ev.args?.resourceId,
        user: ev.args?.user,
        x: Number(ev.args?.x),
        y: Number(ev.args?.y),
      },
    });
  }

  const newResEvents = await farmingContract.queryFilter("NewResourcePosition", 0, "latest");
  for (const ev of newResEvents) {
    history.push({
      type: "NewResourcePosition",
      data: {
        resourceId: ev.args?.resourceId,
        x: Number(ev.args?.x),
        y: Number(ev.args?.y),
      },
    });
  }

  // Sort by block/tx order
  history.sort((a, b) => {
    const aBlock = (a as any).blockNumber ?? 0;
    const bBlock = (b as any).blockNumber ?? 0;
    return aBlock - bBlock;
  });

  console.log(`Loaded ${history.length} historical events`);
}

// ---------- Apply frame ----------
function applyEvent(ev: { type: string; data: any }) {
  if (ev.type === "PositionSet") {
    positions[ev.data.player] = { x: ev.data.x, y: ev.data.y };
  } else if (ev.type === "NewResourcePosition") {
    resourcePositions.push({
      resourceId: ev.data.resourceId,
      x: ev.data.x,
      y: ev.data.y,
    });
  } else if (ev.type === "ResourceFarmed") {
    // remove the farmed resource
    resourcePositions = resourcePositions.filter(
      (r) => !(r.resourceId === ev.data.resourceId && r.x === ev.data.x && r.y === ev.data.y)
    );
  }
}

// ---------- Draw ----------
function drawFrame(instance: any, index: number) {
  if (index >= history.length) {
    console.log("Replay finished.");
    instance.exit();
    return;
  }

  applyEvent(history[index]);

  let frameData = "";
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let char = ".";

      for (const res of resourcePositions) {
        if (res.x === x && res.y === y) {
          char = res.resourceId === "wood" ? "w" : "s";
        }
      }

      for (const pos of Object.values(positions)) {
        if (pos.x === x && pos.y === y) {
          char = "O";
        }
      }

      frameData += char;
    }
  }

  instance.drawFrame(frameData, BOARD_WIDTH, BOARD_HEIGHT);
}

// ---------- Main ----------
async function main() {
  await loadHistory();

  process.stdout.write("\x1b[2J\x1b[H");

  TerminalGameIo.createTerminalGameIo({
    fps: FPS,
    frameHandler: (instance: any) => {
      drawFrame(instance, frameIndex);
      frameIndex++;
    },
    keypressHandler: (instance: any, keyName: string) => {
      if (keyName === TerminalGameIo.Key.Escape) {
        instance.exit();
      }
    },
  });
}

main().catch(console.error);
