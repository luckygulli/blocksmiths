#!/bin/bash

# Installation
npm install

# Deploy contract
npx hardhat ignition deploy ./ignition/modules/Board.ts --network localhost

# Menu
while true; do
    echo "=============================="
    echo "      Game Menu"
    echo "=============================="
    echo "1) Play the game"
    echo "2) Show replay"
    echo "3) Exit"
    read -p "Enter your choice [1-3]: " choice

    case $choice in
        1)
            npx hardhat run scripts/play.ts
            ;;
        2)
            npx hardhat run scripts/replay.ts
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice, please try again."
            ;;
    esac
done
