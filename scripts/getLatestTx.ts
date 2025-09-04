import { ethers } from 'ethers'

async function getLastTransaction() {
    // Replace with your actual RPC URL
    //const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID");
    const provider = new ethers.providers.Web3Provider(web3Provider)

    try {
        // Get the latest block number
        const latestBlockNumber = await provider.getBlockNumber()
        console.log(`Latest Block Number: ${latestBlockNumber}`)

        // Get the latest block
        const latestBlock = await provider.getBlock(latestBlockNumber)

        if (latestBlock && latestBlock.transactions.length > 0) {
            // The last element in the transactions array is the last transaction in this block
            const lastTransactionHash =
                latestBlock.transactions[latestBlock.transactions.length - 1]

            // Fetch the full details of the transaction using its hash
            const transactionDetails = await provider.getTransaction(
                lastTransactionHash,
            )

            console.log('Details of the Last Transaction in the Latest Block:')
            console.log(transactionDetails)
        } else {
            console.log('No transactions found in the latest block.')
        }
    } catch (error) {
        console.error('Error fetching transaction:', error)
    }
}

getLastTransaction()
