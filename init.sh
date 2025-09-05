#!/bin/bash
# Installation
npm init -y
npm install --save-dev hardhat
# npx hardhat --init
#npx hardhat
npm install ethers terminal-game-io

npx hardhat ignition deploy ./ignition/modules/Board.ts
npx hardhat ignition deploy ./ignition/modules/Board.ts --network hardhatMainnet

# New Terminal:
##############npx hardhat node



# Run the game script
npx hardhat run scripts/play.js
npx hardhat run scripts/play2.js
