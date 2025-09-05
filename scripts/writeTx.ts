import { ethers } from "ethers";

async function writeHelloWorld() {
    // Replace with your actual RPC URL
   //const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID");
    const provider = new ethers.providers.Web3Provider(web3Provider)


    // Replace with your private key (⚠️ never commit real keys to code!)
    const wallet = new ethers.Wallet("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", provider);

    try {
        // Encode "Hello World" into hex
        const message = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Hello World"));

        // Create transaction
        const tx = {
            to: null, // no recipient → just a data tx
            value: 0,
            data: message,
            gasLimit: ethers.utils.hexlify(21000 + message.length * 10), // rough estimate
        };

console.log('Prepared')
        // Send transaction
        const sentTx = await wallet.sendTransaction(tx);

        console.log("Transaction hash:", sentTx.hash);

        // Wait for confirmation
        const receipt = await sentTx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
    } catch (err) {
        console.error("Error writing Hello World:", err);
    }
}

writeHelloWorld();
