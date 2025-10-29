// contracts/Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Đổi "CodeSparkToken" và "CST" thành tên bạn muốn
contract Token is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("CodeSparkToken", "CST") Ownable(msg.sender) {
        // Cấp toàn bộ token ban đầu cho ví của bạn (ví có private key ở trên)
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }
} 
