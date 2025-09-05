import { ethers } from "ethers";

async function run() {
    // Remix auto-injects a provider when using "Remix VM"
    const provider = new ethers.providers.Web3Provider(web3Provider);

    // Get signer (the first account in Remix VM)
    const signer = provider.getSigner();

    // ABI of the HelloWorld contract
    const abi = [
        "function message() view returns (string)",
        "function setMessage(string newMessage)"
    ];

    // Replace with your deployed HelloWorld address from Remix deploy panel
    const contractAddress = "0x...";

    // Connect contract
    const helloWorld = new ethers.Contract(contractAddress, abi, signer);

    // Read current message
    console.log("Current:", await helloWorld.message());

    // Send transaction
    const tx = await helloWorld.setMessage("Hello from Remix JS!");
    console.log("Tx sent:", tx.hash);

    await tx.wait();
    console.log("Updated:", await helloWorld.message());
}

run().catch(console.error);
