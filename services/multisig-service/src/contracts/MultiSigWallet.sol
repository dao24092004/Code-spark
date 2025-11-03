// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

    // DÁN HÀM ĐÃ SỬA LỖI NÀY VÀO
    function submitTransaction(address _to, uint _value, bytes memory _data)
        public
        onlyOwner
    {
        uint txIndex = transactions.length;

        // 1. Đẩy (push) một struct rỗng vào mảng 'transactions'
        //    Việc này sẽ tạo ra một "slot" (ô chứa) mới trong storage
        transactions.push();

        // 2. Lấy một tham chiếu (storage pointer) tới "slot" vừa tạo
        Transaction storage newTx = transactions[txIndex];

        // 3. Gán giá trị cho struct thông qua tham chiếu storage
        newTx.to = _to;
        newTx.value = _value;
        newTx.data = _data;
        newTx.executed = false;
        newTx.numConfirmations = 0;
        // Mapping 'isConfirmed' được tự động khởi tạo rỗng trong storage

        emit TransactionSubmitted(txIndex, msg.sender, _to, _value, _data);
    }

    function confirmTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage txData = transactions[_txIndex];
        txData.isConfirmed[msg.sender] = true;
        txData.numConfirmations++;
        emit TransactionConfirmed(_txIndex, msg.sender);
    }

    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage txData = transactions[_txIndex];
        require(txData.numConfirmations >= requiredConfirmations, "Not enough confirmations");

        txData.executed = true;
        (bool success, ) = txData.to.call{value: txData.value}(txData.data);
        require(success, "Transaction execution failed");

        emit TransactionExecuted(_txIndex, msg.sender);
    }

    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage txData = transactions[_txIndex];
        require(txData.isConfirmed[msg.sender], "You have not confirmed this transaction");

        txData.isConfirmed[msg.sender] = false;
        txData.numConfirmations--;
        emit TransactionRevoked(_txIndex, msg.sender);
    }

    // --- Hàm chỉ đọc (Read-only functions) ---

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
        Transaction storage txData = transactions[_txIndex];
        return (
            txData.to,
            txData.value,
            txData.data,
            txData.executed,
            txData.numConfirmations
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

