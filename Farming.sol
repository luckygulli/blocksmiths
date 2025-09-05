// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

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

    event ResourceFarmed(string indexed resourceId, address indexed user, int256 x, int256 y);
    event NewResourcePosition(string indexed resourceId, int256 x, int256 y);

    string[2] public resourceIds = ["wood", "stone"];
    mapping(string => Resource) public resources;

    mapping(string => ResourcePosition[]) public resourcePositions;
    mapping(address => ResourceCount[]) public playerResources;

    constructor() {
        resources["wood"] = Resource("wood", "Wood", 3, 1);
        resources["stone"] = Resource("stone", "Stone", 2, 3);

        resourcePositions["wood"].push(ResourcePosition("wood", 2, 3));
        resourcePositions["wood"].push(ResourcePosition("wood", 5, 10));
        resourcePositions["wood"].push(ResourcePosition("wood", 16, 3));

        resourcePositions["stone"].push(ResourcePosition("stone", 0, 0));
        resourcePositions["stone"].push(ResourcePosition("stone", 100, 2));
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

    function random() private view returns (int256) {
        return int(block.prevrandao);
    }

    function isPositionTaken(int x, int y) private view returns (bool) {
        for (uint i = 0; i < resourceIds.length; i++) {
            string memory resourceId = resourceIds[i];
            for (uint j = 0; j < resourcePositions[resourceIds[i]].length; j++) {
                ResourcePosition memory resourcePosition = resourcePositions[resourceId][j];
                if (resourcePosition.x == x && resourcePosition.y == y) {
                    return true;
                }
            }
        }
        return false;
    }

    function getResource(string calldata id) external view returns (Resource memory) {
        require(isKeyValid(id), "Resource does not exist");
        Resource memory resource = resources[id];
        return resource; 
    }


    function farm(string calldata resourceId, int256 x, int256 y) external {
        // validate that resource exists
        uint256 index = resourcePositions[resourceId].length;
        for (uint24 i = 0; i < resourcePositions[resourceId].length; i++) {
            if (resourcePositions[resourceId][i].x == x && resourcePositions[resourceId][i].y == y) {
                index = i;
            }
        }
        require(index != resourcePositions[resourceId].length, "Resource position does not exist");

        // create new resource
        int256 newX = random();
        int256 newY = random();
        while (isPositionTaken(newX, newY)) {
            newX = random();
            newY = random();
        }

        resourcePositions[resourceId][index] = ResourcePosition(resourceId, newX, newY);
        emit NewResourcePosition(resourceId, newX, newY);

        // add resource to players inventory
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