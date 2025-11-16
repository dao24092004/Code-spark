// Hàm helper để retry database queries với connection mới
async function retryDbQuery(queryFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await queryFn();
        } catch (error) {
            if (error.message.includes('ConnectionManager.getConnection was called after the connection manager was closed')) {
                console.warn(`depositListener: Connection closed, retrying... (${i + 1}/${maxRetries})`);
                // Re-establish database connection
                const db = require('../models');
                if (db.sequelize) {
                    await db.sequelize.authenticate();
                }
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Failed after maximum retries');
}

const { ethers } = require('ethers');
const db = require('../models');
const tokenArtifact = require('../../artifacts/contracts/Token.sol/Token.json');

const REQUIRED_ENV = ['WEB3_PROVIDER_URL', 'CONTRACT_ADDRESS', 'REWARD_DEPOSIT_ADDRESS'];

let provider = null;
let tokenContract = null;
let transferFilter = null;

const normalizeAddress = (address) => (address ? address.toLowerCase() : address);

async function resolveBlockTimestamp(blockNumber) {
    try {
        const block = await provider.getBlock(blockNumber);
        if (!block) return null;
        return new Date(block.timestamp * 1000);
    } catch (error) {
        console.warn('depositListener: failed to fetch block timestamp', error);
        return null;
    }
}

async function upsertDepositFromEvent(event) {
    const { transactionHash, args, blockNumber } = event;
    if (!args) return;

    const fromAddress = normalizeAddress(args.from);
    const toAddress = normalizeAddress(args.to);
    const rawAmount = args.value;

    // Ignore mint events (from zero address) and self-transfers that are not deposits
    if (fromAddress === '0x0000000000000000000000000000000000000000') {
        return;
    }

    const existing = await db.TokenDeposit.findOne({ where: { txHash: transactionHash } });
    if (existing) {
        // Already processed
        return;
    }

    const blockTimestamp = await resolveBlockTimestamp(blockNumber);
    const amountRawBigInt = BigInt(rawAmount);
    const amountTokens = Number(ethers.formatUnits(amountRawBigInt, 18));

    const wallet = await db.WalletAccount.findOne({ where: { address: fromAddress } });

    const status = wallet ? 'confirmed' : 'unmatched';

    await db.sequelize.transaction(async (transaction) => {
        const deposit = await db.TokenDeposit.create({
            userId: wallet ? wallet.userId : null,
            // Only set walletAddress when it exists in WalletAccount to satisfy FK
            walletAddress: wallet ? wallet.address : null,
            txHash: transactionHash,
            tokenAddress: normalizeAddress(process.env.CONTRACT_ADDRESS),
            fromAddress,
            toAddress,
            amountRaw: amountRawBigInt.toString(),
            amountTokens,
            blockNumber,
            blockTimestamp,
            status,
            confirmedAt: wallet ? blockTimestamp : null
        }, { transaction });

        if (wallet) {
            await db.User.increment('tokenBalance', {
                by: amountTokens,
                where: { id: wallet.userId },
                transaction
            });

            await db.Reward.create({
                studentId: wallet.userId,
                tokensAwarded: amountTokens,
                reasonCode: 'DEPOSIT_ONCHAIN',
                relatedId: deposit.id,
                transaction_type: 'EARN',
                awardedAt: blockTimestamp || new Date()
            }, { transaction });
        }
    });

    if (!wallet) {
        console.warn(`depositListener: Found deposit tx ${transactionHash} but wallet ${fromAddress} not linked to any user`);
    } else {
        console.log(`depositListener: Credited ${amountTokens} tokens for user ${wallet.userId} via tx ${transactionHash}`);
    }
}

async function replayHistorical(fromBlock, toBlock) {
    try {
        const events = await tokenContract.queryFilter(transferFilter, fromBlock, toBlock);
        console.log(`depositListener: Replaying ${events.length} deposit transfers from blocks ${fromBlock} to ${toBlock}`);
        for (const event of events) {
            await upsertDepositFromEvent(event);
        }
    } catch (error) {
        console.error('depositListener: Failed to replay historical events', error);
    }
}

function subscribeLive() {
    tokenContract.on(transferFilter, async (from, to, event) => {
        try {
            await upsertDepositFromEvent(event);
        } catch (error) {
            console.error('depositListener: error processing live event', error);
        }
    });

    console.log('depositListener: Live subscription started');
}

async function initialize() {
    for (const key of REQUIRED_ENV) {
        if (!process.env[key]) {
            console.warn(`depositListener: Missing ${key}; deposit listener disabled`);
            return;
        }
    }

    try {
        provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
        const tokenAddress = normalizeAddress(process.env.CONTRACT_ADDRESS);
        const depositAddress = normalizeAddress(process.env.REWARD_DEPOSIT_ADDRESS);
        tokenContract = new ethers.Contract(tokenAddress, tokenArtifact.abi, provider);
        transferFilter = tokenContract.filters.Transfer(null, depositAddress);

        const latestBlock = await provider.getBlockNumber();

        const rawLastProcessedBlock = await retryDbQuery(() => db.TokenDeposit.max('blockNumber'));
        const defaultStartBlock = process.env.REWARD_LISTENER_START_BLOCK
            ? Number(process.env.REWARD_LISTENER_START_BLOCK)
            : latestBlock;
        const startBlock = rawLastProcessedBlock !== null ? Number(rawLastProcessedBlock) : defaultStartBlock;
        const fromBlock = Math.max(0, startBlock);

        if (fromBlock <= latestBlock) {
            await replayHistorical(fromBlock, latestBlock);
        }

        subscribeLive();
    } catch (error) {
        console.error('depositListener: failed to initialize', error);
    }
}

module.exports = {
    initialize
};

