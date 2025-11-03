// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event TransactionSubmitted(uint indexed txIndex, address indexed proposer, address indexed to, uint value, bytes data);
    event TransactionConfirmed(uint indexed txIndex, address indexed confirmer);
    event TransactionRevoked(uint indexed txIndex, address indexed revoker);
    event TransactionExecuted(uint indexed txIndex, address indexed executor);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public requiredConfirmations;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
        mapping(address => bool) isConfirmed;
    }

    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!transactions[_txIndex].isConfirmed[msg.sender], "Transaction already confirmed by you");
        _;
    }

    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required confirmations");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        requiredConfirmations = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint _value, bytes memory _data)
        public
        onlyOwner
    {
        uint txIndex = transactions.length;

        // Tạo transaction mới
        transactions.push();

        Transaction storage newTx = transactions[txIndex];

        newTx.to = _to;
        newTx.value = _value;
        newTx.data = _data;
        newTx.executed = false;
        newTx.numConfirmations = 0;

        emit TransactionSubmitted(txIndex, msg.sender, _to, _value, _data);
    }

    function confirmTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage tx = transactions[_txIndex];
        tx.isConfirmed[msg.sender] = true;
        tx.numConfirmations++;
        emit TransactionConfirmed(_txIndex, msg.sender);
    }

    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage tx = transactions[_txIndex];
        require(tx.numConfirmations >= requiredConfirmations, "Not enough confirmations");

        tx.executed = true;
        (bool success, ) = tx.to.call{value: tx.value}(tx.data);
        require(success, "Transaction execution failed");

        emit TransactionExecuted(_txIndex, msg.sender);
    }

    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage tx = transactions[_txIndex];
        require(tx.isConfirmed[msg.sender], "You have not confirmed this transaction");

        tx.isConfirmed[msg.sender] = false;
        tx.numConfirmations--;
        emit TransactionRevoked(_txIndex, msg.sender);
    }

    // Read-only functions
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex)
        public
        view
        txExists(_txIndex)
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage tx = transactions[_txIndex];
        return (
            tx.to,
            tx.value,
            tx.data,
            tx.executed,
            tx.numConfirmations
        );
    }

    function isConfirmed(uint _txIndex, address _owner)
        public
        view
        txExists(_txIndex)
        returns (bool)
    {
        return transactions[_txIndex].isConfirmed[_owner];
    }
}

