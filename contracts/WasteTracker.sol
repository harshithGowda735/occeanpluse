// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OceanMind+ Waste Tracker
 * @dev Tracks waste lifecycle from disposal to recycling on the Polygon network.
 */
contract WasteTracker {
    enum WasteStatus { Disposed, Collected, InTransit, Recycled }
    
    struct WasteTransaction {
        uint256 id;
        address user;
        string binId;
        string wasteType;
        uint256 weight; // in grams
        WasteStatus status;
        uint256 timestamp;
        address collector;
        address recyclingPlant;
        bool verified;
    }

    uint256 public transactionCount;
    mapping(uint256 => WasteTransaction) public transactions;
    mapping(address => uint256[]) public userTransactions;

    event WasteAdded(uint256 indexed id, address indexed user, string binId, string wasteType);
    event WasteTransferred(uint256 indexed id, address indexed from, address indexed to, WasteStatus status);
    event WasteRecycled(uint256 indexed id, address indexed plant, bool verified);

    /**
     * @dev Records initial waste disposal by a user into a smart bin.
     */
    function addWaste(string memory _binId, string memory _wasteType, uint256 _weight) public returns (uint256) {
        transactionCount++;
        
        transactions[transactionCount] = WasteTransaction({
            id: transactionCount,
            user: msg.sender,
            binId: _binId,
            wasteType: _wasteType,
            weight: _weight,
            status: WasteStatus.Disposed,
            timestamp: block.timestamp,
            collector: address(0),
            recyclingPlant: address(0),
            verified: false
        });

        userTransactions[msg.sender].push(transactionCount);
        
        emit WasteAdded(transactionCount, msg.sender, _binId, _wasteType);
        return transactionCount;
    }

    /**
     * @dev Transfers waste from bin to collector or collector to plant.
     */
    function transferWaste(uint256 _id, address _to, WasteStatus _newStatus) public {
        require(_id > 0 && _id <= transactionCount, "Invalid transaction ID");
        WasteTransaction storage txn = transactions[_id];
        
        if (_newStatus == WasteStatus.Collected || _newStatus == WasteStatus.InTransit) {
            txn.collector = _to;
        } else if (_newStatus == WasteStatus.Recycled) {
            txn.recyclingPlant = _to;
        }
        
        txn.status = _newStatus;
        emit WasteTransferred(_id, msg.sender, _to, _newStatus);
    }

    /**
     * @dev Final verification of recycling by the plant.
     */
    function verifyRecycling(uint256 _id) public {
        require(_id > 0 && _id <= transactionCount, "Invalid transaction ID");
        WasteTransaction storage txn = transactions[_id];
        require(txn.status == WasteStatus.Recycled, "Waste must be at recycling plant");
        
        txn.verified = true;
        emit WasteRecycled(_id, msg.sender, true);
    }

    function getTransaction(uint256 _id) public view returns (WasteTransaction memory) {
        return transactions[_id];
    }
}
