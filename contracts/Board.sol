// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Board Contract
/// @notice Stores positions of players, allows moving step by step
/// @custom:dev-run-script ./scripts/boardScript.js
contract Board {
    struct Position {
        int256 x;
        int256 y;
        bool initialized;
    }

    mapping(address => Position) public positions;
    address[] private players; // ✅ minimal addition

    event PositionSet(address indexed player, int256 x, int256 y);

    function initPosition(int256 x, int256 y) external {
        require(!positions[msg.sender].initialized, "Already initialized");
        positions[msg.sender] = Position(x, y, true);

        // ✅ record this player once
        players.push(msg.sender);

        emit PositionSet(msg.sender, x, y);
    }

    function move(int256 newX, int256 newY) external {
        Position storage pos = positions[msg.sender];
        require(pos.initialized, "Position not initialized");

        int256 dx = newX - pos.x;
        int256 dy = newY - pos.y;

        require((dx * dx + dy * dy) == 1, "Invalid move: must be distance 1");

        pos.x = newX;
        pos.y = newY;

        emit PositionSet(msg.sender, newX, newY);
    }

    function getPosition(address player) external view returns (int256, int256) {
        Position memory pos = positions[player];
        require(pos.initialized, "Player not initialized");
        return (pos.x, pos.y);
    }

    // ✅ minimal addition to expose player list
    function getAllPlayers() external view returns (address[] memory) {
        return players;
    }
}
