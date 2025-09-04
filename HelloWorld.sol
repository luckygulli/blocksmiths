// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;

    constructor() {
        // Store "Hello World" in the blockchain state
        message = "Hello World";
    }

    function setMessage(string memory newMessage) public {
        message = newMessage;
    }
}
