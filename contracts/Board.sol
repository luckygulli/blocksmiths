// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Board Contract
/// @notice Stores positions of players, allows moving step by step, tracks all players
/// @custom:dev-run-script ./scripts/boardScript.js
contract Board {
    struct Position {
        int256 x;
        int256 y;
        bool initialized;
    }

    mapping(address => Position) public positions;
    address[] private players;

    // Event emitted when a player moves or initializes
    event PlayerMoved(address indexed player, int256 x, int256 y);

    /// @notice Initialize your position
    function initPosition(int256 x, int256 y) external {
        require(!positions[msg.sender].initialized, "Already initialized");
        positions[msg.sender] = Position(x, y, true);
        players.push(msg.sender);
        emit PlayerMoved(msg.sender, x, y);
    }

    /// @notice Move to a new position (must be exactly 1 step in any direction)
    function move(int256 newX, int256 newY) external {
        Position storage pos = positions[msg.sender];
        require(pos.initialized, "Position not initialized");

        int256 dx = newX - pos.x;
        int256 dy = newY - pos.y;

        require((dx*dx + dy*dy) == 1, "Invalid move: must be distance 1");

        pos.x = newX;
        pos.y = newY;

        emit PlayerMoved(msg.sender, newX, newY);
    }

    /// @notice Get the position of a player
    function getPosition(address player) external view returns (int256, int256) {
        Position memory pos = positions[player];
        require(pos.initialized, "Player not initialized");
        return (pos.x, pos.y);
    }

    /// @notice Get all players who have initialized a position
    function getAllPlayers() external view returns (address[] memory) {
        return players;
    }
}
