// SPDX-License-Identifier: MIT
// Remix IDE script to fetch the latest transaction (JavaScript VM)

async function getLatestTransaction() {
    // Use Remix's built-in web3 provider
    const web3 = remix.web3;

    try {
        // 1. Get the latest block number
        const latestBlockNumber = await web3.eth.getBlockNumber();
        console.log("Latest Block Number:", latestBlockNumber);

        // 2. Fetch the block with transactions
        const block = await web3.eth.getBlock(latestBlockNumber, true);
        if (!block || block.transactions.length === 0) {
            throw new Error("No transactions in the latest block.");
        }

        // 3. Get the last transaction
        const lastTx = block.transactions[block.transactions.length - 1];
        console.log("\nLast Transaction in the Block:");
        console.log("- Hash:", lastTx.hash);
        console.log("- From:", lastTx.from);
        console.log("- To:", lastTx.to || "Contract Creation");
        console.log("- Value:", web3.utils.fromWei(lastTx.value, "ether"), "ETH");
        console.log("- Gas Price:", lastTx.gasPrice);
        console.log("- Gas Used:", lastTx.gas);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Run the function
getLatestTransaction().then(() => console.log("Done"));