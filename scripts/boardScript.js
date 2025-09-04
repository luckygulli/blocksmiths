import { ethers } from "ethers";

(async function () {
    // Remix injects a provider for the current environment
    const provider = new ethers.providers.Web3Provider(web3Provider);
    const signer = provider.getSigner();

    // ABI of the Board contract
    const abi = [
        "function initPosition(int256 x, int256 y)",
        "function move(int256 newX, int256 newY)",
        "function getPosition(address player) view returns (int256, int256)"
    ];

    // Replace with your deployed contract address from Remix
    const contractAddress = "0x85F05208B6C3613f42366dE27BAFBd4df40a8ceb";

    const board = new ethers.Contract(contractAddress, abi, signer);

    // Initialize position
   /* let tx = await board.initPosition(0, 0);
    await tx.wait();
    console.log("Position initialized to (0,0)");
*/
    // Move right
    tx = await board.move(1, 1);
    await tx.wait();
    console.log("Moved to (1,0)");

    // Check position
    const pos = await board.getPosition(await signer.getAddress());
    console.log("Current position:", pos.toString());
})();
