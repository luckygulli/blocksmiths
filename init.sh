#!/bin/bash
# Installation
npm install
npx hardhat ignition deploy ./ignition/modules/Board.ts

# New Terminal:
##############npx hardhat node
## Copy Contract Adress and initialised players


# Run the game script
npx hardhat run scripts/play.ts
