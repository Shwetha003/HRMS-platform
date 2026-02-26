// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WorkforceLogger {
    // Event emitted when a task is completed
    event TaskCompleted(
        uint256 indexed taskId,
        string taskDbId,
        address indexed employee,
        uint256 timestamp
    );

    uint256 private _taskCounter;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Logs the completion of a task on the blockchain.
     * @param taskDbId The unique identifier of the task from the PostgreSQL database.
     */
    function logTaskCompletion(string memory taskDbId) external {
        // We increment the internal task counter for unique on-chain tracking
        _taskCounter++;
        
        // Emit an event that serves as the permanent on-chain record
        emit TaskCompleted(_taskCounter, taskDbId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get the total number of tasks logged on this contract.
     */
    function getTotalTasksLogged() external view returns (uint256) {
        return _taskCounter;
    }
}
