#!/bin/bash
# Installation
npm install

# New Terminal:
##############npx hardhat node
## Copy Contract Adress and initialised players

npx hardhat ignition deploy ./ignition/modules/Board.ts


# Run the game script
npx hardhat run scripts/play.ts
