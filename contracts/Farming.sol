// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Farming Contract
/// @notice Allows Players to farm resources and stores Players resources
contract Farming {

    struct Resource {
        string id;
        string name;
        uint24 amount;
        uint24 value;
    }

    struct ResourcePosition {
        string resourceId;
        int256 x;
        int256 y;
    }

    struct ResourceCount {
        string resourceId;
        uint24 count;
    }

    event ResourceFarmed(string resourceId, address indexed user, int256 x, int256 y);
    event NewResourcePosition(string resourceId, int256 x, int256 y);

    string[2] public resourceIds = ["wood", "stone"];
    mapping(string => Resource) public resources;

    mapping(string => ResourcePosition[]) public resourcePositions;
    mapping(address => ResourceCount[]) public playerResources;

    // board boundaries (must match frontend)
    int256 public constant BOARD_WIDTH = 20;
    int256 public constant BOARD_HEIGHT = 10;

    constructor() {
        resources["wood"] = Resource("wood", "Wood", 3, 1);
        resources["stone"] = Resource("stone", "Stone", 2, 3);

        ResourcePosition memory pos;

        pos = ResourcePosition("wood", 2, 3);
        resourcePositions["wood"].push(pos);
        emit NewResourcePosition(pos.resourceId, pos.x, pos.y);

        pos = ResourcePosition("wood", 5, 9);
        resourcePositions["wood"].push(pos);
        emit NewResourcePosition(pos.resourceId, pos.x, pos.y);

        pos = ResourcePosition("wood", 7, 3);
        resourcePositions["wood"].push(pos);
        emit NewResourcePosition(pos.resourceId, pos.x, pos.y);

        pos = ResourcePosition("stone", 0, 0);
        resourcePositions["stone"].push(pos);
        emit NewResourcePosition(pos.resourceId, pos.x, pos.y);

        pos = ResourcePosition("stone", 10, 2);
        resourcePositions["stone"].push(pos);
        emit NewResourcePosition(pos.resourceId, pos.x, pos.y);
    }


    function getResourceIDs() external view returns (string[] memory) {
        string[] memory result = new string[](resourceIds.length);
        for (uint i = 0; i < resourceIds.length; i++) {
            result[i] = resourceIds[i];
        }
        return result;
    }

    function compareResourceIdsStorage(string calldata id1, string storage id2) private pure returns (bool) {
        return keccak256(bytes(id1)) == keccak256(bytes(id2));
    }

    function compareResourceIdsMemory(string calldata id1, string memory id2) private pure returns (bool) {
        return keccak256(bytes(id1)) == keccak256(bytes(id2));
    }

    function isKeyValid(string calldata id) private view returns (bool) {
        for (uint24 i = 0; i < resourceIds.length; i++) {
            if (compareResourceIdsStorage(id, resourceIds[i])) {
                return true;
            }
        }
        return false;
    }

    function random() private view returns (int256, int256) {
        uint randX = uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)));
        int256 x = int256(randX % uint(BOARD_WIDTH));

        uint randY = uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)));
        int256 y = int256(randY % uint(BOARD_HEIGHT));

        return (x, y);
    }

    function isPositionTaken(int256 x, int256 y) private view returns (bool) {
        for (uint i = 0; i < resourceIds.length; i++) {
            string memory resourceId = resourceIds[i];
            for (uint j = 0; j < resourcePositions[resourceId].length; j++) {
                ResourcePosition memory resourcePosition = resourcePositions[resourceId][j];
                if (resourcePosition.x == x && resourcePosition.y == y) {
                    return true;
                }
            }
        }
        return false;
    }

    // helper to check bounds
    function isWithinBounds(int256 x, int256 y) private pure returns (bool) {
        return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
    }

    function getResource(string calldata id) external view returns (Resource memory) {
        require(isKeyValid(id), "Resource does not exist");
        return resources[id]; 
    }

    function getResourcePositions() external view returns (ResourcePosition[] memory) {
        uint total = 0;
        for (uint i = 0; i < resourceIds.length; i++) {
            total += resourcePositions[resourceIds[i]].length;
        }

        ResourcePosition[] memory result = new ResourcePosition[](total);
        uint pos = 0;
        for (uint i = 0; i < resourceIds.length; i++) {
            string memory resourceId = resourceIds[i];
            for (uint j = 0; j < resourcePositions[resourceId].length; j++) {
                ResourcePosition memory position = resourcePositions[resourceId][j];
                result[pos++] = position;
            }
        }
        return result;
    }

    function farm(string calldata resourceId, int256 x, int256 y) external {
        require(isWithinBounds(x, y), "Position out of bounds"); // boundary check
        uint256 index = resourcePositions[resourceId].length;
        for (uint24 i = 0; i < resourcePositions[resourceId].length; i++) {
            if (resourcePositions[resourceId][i].x == x && resourcePositions[resourceId][i].y == y) {
                index = i;
            }
        }
        require(index != resourcePositions[resourceId].length, "Resource position does not exist");

        // generate new resource position within bounds
        int256 newX;
        int256 newY;
        (newX, newY) = random();
        while (isPositionTaken(newX, newY)) {
            (newX, newY) = random();
        }

        resourcePositions[resourceId][index] = ResourcePosition(resourceId, newX, newY);
        emit NewResourcePosition(resourceId, newX, newY);

        // add resource to player's inventory
        uint256 resourceIndex = playerResources[msg.sender].length;
        for (uint24 i = 0; i < playerResources[msg.sender].length; i++) {
            if (compareResourceIdsMemory(resourceId, playerResources[msg.sender][i].resourceId)) {
                resourceIndex = i;
            }
        }
        if (resourceIndex == playerResources[msg.sender].length) {
            playerResources[msg.sender].push(ResourceCount(resourceId, 1));
        } else {
            playerResources[msg.sender][resourceIndex].count += 1;
        }
        emit ResourceFarmed(resourceId, msg.sender, x, y);
    }
}
