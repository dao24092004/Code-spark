// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Copyright {
    // Mapping from document hash to the owner's address
    mapping(string => address) private documentHashes;
    
    // Mapping from document hash to the timestamp it was registered
    mapping(string => uint256) private registrationTimestamps;

    // Event to be emitted when a new document is registered
    event DocumentRegistered(string indexed hash, address indexed owner, uint256 timestamp);

    /**
     * @dev Registers a new document hash.
     * The hash must not have been previously registered.
     * @param _hash The SHA-256 hash of the document.
     */
    function registerDocument(string memory _hash) public {
        require(documentHashes[_hash] == address(0), "Document hash already registered.");
        
        address owner = msg.sender;
        uint256 timestamp = block.timestamp;
        
        documentHashes[_hash] = owner;
        registrationTimestamps[_hash] = timestamp;
        
        emit DocumentRegistered(_hash, owner, timestamp);
    }

    /**
     * @dev Verifies the registration details of a document hash.
     * @param _hash The SHA-256 hash of the document to verify.
     * @return owner The address of the owner who registered the document.
     * @return timestamp The timestamp of registration.
     */
    function getDocumentInfo(string memory _hash) public view returns (address owner, uint256 timestamp) {
        require(documentHashes[_hash] != address(0), "Document hash not found.");
        
        owner = documentHashes[_hash];
        timestamp = registrationTimestamps[_hash];
        
        return (owner, timestamp);
    }
}