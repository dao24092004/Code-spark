// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardEscrow
 * @dev Holds reward tokens for off-chain balances. Owner (backend service or multisig)
 *      can release tokens to learner wallets when withdrawal requests are approved.
 */
contract RewardEscrow is Ownable {
    IERC20 public immutable rewardToken;

    uint256 public totalLocked;
    uint256 public totalReleased;

    mapping(bytes32 => bool) public processedRequests;

    event DepositRecorded(address indexed sender, uint256 amount, uint256 balanceAfter);
    event WithdrawalReleased(bytes32 indexed requestId, address indexed operator, address indexed recipient, uint256 amount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address required");
        rewardToken = IERC20(tokenAddress);
    }

    /**
     * @dev Allow service wallets to deposit tokens into escrow using transferFrom.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        bool success = rewardToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        totalLocked += amount;
        emit DepositRecorded(msg.sender, amount, rewardToken.balanceOf(address(this)));
    }

    /**
     * @dev Release tokens to learner wallet. Only callable by owner (service or multisig).
     */
    function release(address recipient, uint256 amount, bytes32 requestId) external onlyOwner returns (bytes32) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        if (requestId != bytes32(0)) {
            require(!processedRequests[requestId], "Request already processed");
            processedRequests[requestId] = true;
        }

        bool success = rewardToken.transfer(recipient, amount);
        require(success, "Token transfer failed");

        totalReleased += amount;
        emit WithdrawalReleased(requestId, _msgSender(), recipient, amount);

        return requestId;
    }

    function escrowBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
}

