import hre from "hardhat";
const { ethers } = hre;
import TerminalGameIO from "terminal-game-io";

async function main() {
  const [player] = await ethers.getSigners();

  // Deploy Board contract
  const Board = await ethers.getContractFactory("Board");
  const board = await Board.deploy();
  await board.deployed();
  console.log("Board deployed at:", board.address); //0x5FbDB2315678afecb367f032d93F642f64180aa3

  // Init position at (0,0)
  let tx = await board.connect(player).initPosition(0, 0);
  await tx.wait();

  // Setup terminal game UI
  const game = new TerminalGameIO({ width: 20, height: 10 });
  game.printAt(0, 0, "🙂"); // player symbol
  game.render();

  // Keyboard controls
  game.onKey(async (key) => {
    let [x, y] = await board.getPosition(player.address);

    x = x.toNumber();
    y = y.toNumber();

    if (key === "up") y -= 1;
    if (key === "down") y += 1;
    if (key === "left") x -= 1;
    if (key === "right") x += 1;

    try {
      const tx = await board.connect(player).move(x, y);
      await tx.wait();

      game.clear();
      game.printAt(x, y, "🙂");
      game.render();
    } catch (err) {
      console.log("Invalid move:", err.message);
    }
  });
}

main().catch(console.error);
