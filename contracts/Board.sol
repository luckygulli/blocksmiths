// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Board {
    struct Position {
        uint256 x;
        uint256 y;
        bool initialized;
    }

    mapping(address => Position) public positions;
    address[] public players;

    // Event emitted when a player moves
    event PlayerMoved(address indexed player, uint256 x, uint256 y);

    function initPosition(uint256 x, uint256 y) public {
        require(!positions[msg.sender].initialized, "Already initialized");
        positions[msg.sender] = Position(x, y, true);
        players.push(msg.sender);
        emit PlayerMoved(msg.sender, x, y);
    }

    function move(uint256 x, uint256 y) public {
        Position storage pos = positions[msg.sender];
        require(pos.initialized, "Not initialized");
        require(
            (pos.x == x && (pos.y == y + 1 || pos.y == y - 1)) ||
            (pos.y == y && (pos.x == x + 1 || pos.x == x - 1)),
            "Can only move 1 step"
        );
        pos.x = x;
        pos.y = y;
        emit PlayerMoved(msg.sender, x, y);
    }

    function getPosition(address player) public view returns (uint256 x, uint256 y) {
        Position storage pos = positions[player];
        return (pos.x, pos.y);
    }

    function getAllPlayers() public view returns (address[] memory) {
        return players;
    }
}
