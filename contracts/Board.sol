// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Board Contract
/// @custom:dev-run-script ./scripts/boardScript.js
contract Board {
    struct Position {
        int256 x;
        int256 y;
        bool initialized;
    }

    mapping(address => Position) public positions;
    address[] private players;

    event PositionSet(address indexed player, int256 x, int256 y);

    // Board dimensions (must match frontend constants)
    int256 public constant BOARD_WIDTH = 20;
    int256 public constant BOARD_HEIGHT = 10;

    function initPosition(int256 x, int256 y) external {
        require(!positions[msg.sender].initialized, "Already initialized");
        require(_isWithinBounds(x, y), "Out of bounds");

        positions[msg.sender] = Position(x, y, true);
        players.push(msg.sender);

        emit PositionSet(msg.sender, x, y);
    }

    function move(int256 newX, int256 newY) external {
        Position storage pos = positions[msg.sender];
        require(pos.initialized, "Position not initialized");

        int256 dx = newX - pos.x;
        int256 dy = newY - pos.y;

        require((dx * dx + dy * dy) == 1, "Invalid move: must be distance 1");
        require(_isWithinBounds(newX, newY), "Out of bounds");

        pos.x = newX;
        pos.y = newY;

        emit PositionSet(msg.sender, newX, newY);
    }

    function getPosition(address player) external view returns (int256, int256) {
        Position memory pos = positions[player];
        require(pos.initialized, "Player not initialized");
        return (pos.x, pos.y);
    }

    function getAllPlayers() external view returns (address[] memory) {
        return players;
    }

    // Internal helper
    function _isWithinBounds(int256 x, int256 y) internal pure returns (bool) {
        return (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT);
    }
}
