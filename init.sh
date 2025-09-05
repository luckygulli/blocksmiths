#!/bin/bash

# Menu
while true; do
    echo "=============================="
    echo "      Game Menu"
    echo "=============================="
    echo "1) Play the game"
    echo "2) Show replay"
    echo "3) Exit"
    echo "=============================="
    echo "4) [ADMIN] Install and launch Hardhat node"
    echo "5) [ADMIN] Apply Contracts"
    read -p "Enter your choice [1-5]: " choice

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
        4)
            npm install
            npx hardhat node
            exit 0
            ;;
        5)
            npx hardhat ignition deploy ./ignition/modules/Board.ts --network localhost
            ;;

        *)
            echo "Invalid choice, please try again."
            ;;
    esac
done
