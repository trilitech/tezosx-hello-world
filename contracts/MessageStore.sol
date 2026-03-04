// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MessageStore {
    string public message;

    function store(string memory _msg) public {
        message = _msg;
    }
}
