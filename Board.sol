// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Board {
    struct Position {
        int256 x;
        int256 y;
        bool initialized;
    }

    // Mapping of player address => their position
    mapping(address => Position) public positions;

    event PositionSet(address indexed player, int256 x, int256 y);

    /// @notice Initialize your starting position
    function initPosition(int256 x, int256 y) external {
        require(!positions[msg.sender].initialized, "Already initialized");
        positions[msg.sender] = Position(x, y, true);
        emit PositionSet(msg.sender, x, y);
    }

    /// @notice Move to a new position (must be exactly distance 1 from current)
    function move(int256 newX, int256 newY) external {
        Position storage pos = positions[msg.sender];
        require(pos.initialized, "Position not initialized");

        // Calculate Manhattan distance (grid-based distance)
        int256 dx = newX - pos.x;
        int256 dy = newY - pos.y;

        // Must move exactly one step (horizontal, vertical, or diagonal)
        require(
            (dx * dx + dy * dy) == 1,
            "Invalid move: must be distance 1"
        );

        // Update position
        pos.x = newX;
        pos.y = newY;

        emit PositionSet(msg.sender, newX, newY);
    }

    /// @notice Get a player's position
    function getPosition(address player) external view returns (int256, int256) {
        Position memory pos = positions[player];
        require(pos.initialized, "Player not initialized");
        return (pos.x, pos.y);
    }
}
