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
type HistoryEvent = { type: string; data: any };
let history: HistoryEvent[] = [];
let frameIndex = 0;
let positions: Record<string, { x: number; y: number }> = {};
let resourcePositions: ResourcePosition[] = [];

// ---------- Load history ----------
async function loadHistory() {
  const allEvents: any[] = [];

  // Board events
  const moveEvents = await boardContract.queryFilter("PositionSet", 0, "latest");
  allEvents.push(
    ...moveEvents.map((e) => ({
      type: "PositionSet",
      data: { player: e.args?.player, x: Number(e.args?.x), y: Number(e.args?.y) },
      blockNumber: e.blockNumber,
      logIndex: e.logIndex,
    }))
  );

  // Farming events
  const farmEvents = await farmingContract.queryFilter("ResourceFarmed", 0, "latest");
  allEvents.push(
    ...farmEvents.map((e) => ({
      type: "ResourceFarmed",
      data: { resourceId: e.args?.resourceId, user: e.args?.user, x: Number(e.args?.x), y: Number(e.args?.y) },
      blockNumber: e.blockNumber,
      logIndex: e.logIndex,
    }))
  );

  const newResEvents = await farmingContract.queryFilter("NewResourcePosition", 0, "latest");
  allEvents.push(
    ...newResEvents.map((e) => ({
      type: "NewResourcePosition",
      data: { resourceId: e.args?.resourceId, x: Number(e.args?.x), y: Number(e.args?.y) },
      blockNumber: e.blockNumber,
      logIndex: e.logIndex,
    }))
  );

  // Sort by blockchain order
  allEvents.sort((a, b) => (a.blockNumber - b.blockNumber) || (a.logIndex - b.logIndex));

  // Build history array
  history = allEvents.map((e) => ({ type: e.type, data: e.data }));

  console.log(`Loaded ${history.length} events`);
}

// ---------- Apply a single event ----------
function applyEvent(ev: HistoryEvent) {
  if (ev.type === "PositionSet") {
    positions[ev.data.player] = { x: ev.data.x, y: ev.data.y };
  } else if (ev.type === "NewResourcePosition") {
    resourcePositions.push({ resourceId: ev.data.resourceId, x: ev.data.x, y: ev.data.y });
  } else if (ev.type === "ResourceFarmed") {
    resourcePositions = resourcePositions.filter(
      (r) => !(r.resourceId === ev.data.resourceId && r.x === ev.data.x && r.y === ev.data.y)
    );
  }
}

// ---------- Draw frame ----------
function drawFrame(instance: any, index: number) {
  if (index >= history.length) {
    console.log("Replay finished.");
    instance.exit();
    return;
  }

  applyEvent(history[index]);

  let frameData = "";

  for (let y = -1; y <= BOARD_HEIGHT; y++) {
    for (let x = -1; x <= BOARD_WIDTH; x++) {
      let char = " ";

      // corners
      if (y === -1 && x === -1) char = "┌";
      else if (y === -1 && x === BOARD_WIDTH) char = "┐";
      else if (y === BOARD_HEIGHT && x === -1) char = "└";
      else if (y === BOARD_HEIGHT && x === BOARD_WIDTH) char = "┘";

      // top/bottom
      else if (y === -1 || y === BOARD_HEIGHT) char = "─";

      // sides
      else if (x === -1 || x === BOARD_WIDTH) char = "│";

      // inside board
      else {
        char = ".";

        // resources
        for (const res of resourcePositions) {
          if (res.x === x && res.y === y) {
            char = res.resourceId === "wood" ? "w" : "s";
          }
        }

        // players
        for (const pos of Object.values(positions)) {
          if (pos.x === x && pos.y === y) {
            char = "O";
          }
        }

      }
      frameData += char;
    }
  }

  instance.drawFrame(frameData, BOARD_WIDTH + 2, BOARD_HEIGHT + 2);
}

// ---------- Main ----------
async function main() {
  await loadHistory();

  process.stdout.write("\x1b[2J\x1b[H"); // clear terminal

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
