// src/services/tokenService.js

// Import các model từ file index
const db = require('../models');
const blockchainService = require('./blockchainService');

const ensureUserRecord = async (studentId, { transaction = null, lockForUpdate = false } = {}) => {
    const findOptions = {};
    if (transaction) {
        findOptions.transaction = transaction;
        if (lockForUpdate && transaction.LOCK && transaction.LOCK.UPDATE) {
            findOptions.lock = transaction.LOCK.UPDATE;
        }
    }

    let user = await db.User.findByPk(studentId, findOptions);

    if (!user) {
        const createOptions = {};
        if (transaction) {
            createOptions.transaction = transaction;
        }
        user = await db.User.create({ id: studentId }, createOptions);
    }

    return user;
};

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === 'bigint') {
        try {
            return Number(value);
        } catch (error) {
            console.warn('Unable to convert bigint to number safely, falling back to fallback value.', { value, error });
            return fallback;
        }
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    return fallback;
};

const tokenService = {
    /**
     * Hàm cấp token cho một student.
     * Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu.
     * @param {number} studentId - ID của người nhận
     * @param {number} amount - Số token được cấp (phải là số dương)
     * @param {string} reasonCode - Lý do (vd: 'COURSE_COMPLETION')
     * @param {string} relatedId - ID liên quan (vd: ID của khóa học)
     * @returns {Promise<object>} - Bản ghi reward vừa được tạo
     */
    grantTokens: async ({ studentId, amount, reasonCode, relatedId }) => {
        if (amount <= 0) {
            throw new Error('Amount must be positive.');
        }

        const result = await db.sequelize.transaction(async (t) => {
            // 1. Đảm bảo user tồn tại (tạo mới nếu cần)
            const user = await ensureUserRecord(studentId, { transaction: t, lockForUpdate: true });

            // 2. CỘNG TIỀN (Dòng bị thiếu)
            await user.increment('tokenBalance', { by: amount, transaction: t });

            // 3. Ghi lại lịch sử (Dòng này bạn đã có)
            const newReward = await db.Reward.create({
                studentId,
                tokensAwarded: amount,
                reasonCode,
                relatedId,
                transaction_type: 'EARN'
            }, { transaction: t });

            return newReward;
        });

        const rewardData = typeof result?.toJSON === 'function'
            ? result.toJSON()
            : typeof result?.get === 'function'
                ? result.get({ plain: true })
                : result;

        const normalizedReward = {
            ...rewardData,
            tokensAwarded: rewardData?.tokensAwarded ?? amount,
            amount: rewardData?.amount ?? rewardData?.tokensAwarded ?? amount,
            transaction_type: rewardData?.transaction_type ?? 'EARN'
        };

        console.log('✅ Token reward granted', {
            rewardId: normalizedReward.id,
            studentId,
            amount: normalizedReward.tokensAwarded,
            reasonCode: normalizedReward.reasonCode ?? null,
            relatedId: normalizedReward.relatedId ?? null,
            transactionType: normalizedReward.transaction_type
        });

        return normalizedReward;
    },

    spendTokens: async ({ studentId, amount, reasonCode, relatedId }) => {
        if (amount <= 0) {
            throw new Error('Amount must be positive.');
        }

        const result = await db.sequelize.transaction(async (t) => {
            const user = await ensureUserRecord(studentId, { transaction: t, lockForUpdate: true });
            if (user.tokenBalance < amount) {
                throw new Error('Insufficient funds.');
            }

            // *** DÒNG QUAN TRỌNG SỐ 1 ***
            // Bạn phải có dòng này để TRỪ TIỀN
            await user.decrement('tokenBalance', { by: amount, transaction: t });

            const spendLog = await db.Reward.create({
                studentId,
                tokensAwarded: amount, // Luôn là số dương
                reasonCode,
                relatedId,
                // *** DÒNG QUAN TRỌNG SỐ 2 ***
                // Phải set là 'SPEND' để phân biệt
                transaction_type: 'SPEND' 
            }, { transaction: t });

            return spendLog;
        });

        return result;
    },

    /**
     * UC28a: Lấy số dư token hiện tại.
     */
    getBalance: async (studentId) => {
        const user = await ensureUserRecord(studentId);

        const [totalEarnedRaw, totalSpentRaw, lastTransactionAt] = await Promise.all([
            db.Reward.sum('tokensAwarded', {
                where: { studentId, transaction_type: 'EARN' }
            }),
            db.Reward.sum('tokensAwarded', {
                where: { studentId, transaction_type: 'SPEND' }
            }),
            db.Reward.max('awardedAt', {
                where: { studentId }
            })
        ]);

        const totalEarned = toNumber(totalEarnedRaw, 0);
        const totalSpent = toNumber(totalSpentRaw, 0);
        const balanceValue = toNumber(user.tokenBalance, 0);
        const netEarned = totalEarned - totalSpent;

        return {
            balance: balanceValue,
            tokenBalance: balanceValue,
            availableBalance: balanceValue,
            totalEarned,
            lifetimeEarned: totalEarned,
            totalSpent,
            lifetimeSpent: totalSpent,
            netEarned,
            lastTransactionAt: lastTransactionAt || (user.updatedAt ?? null)
        };
    },

    /**
     * UC28b: Lấy lịch sử giao dịch (có phân trang).
     */
    getHistory: async (studentId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;

        const history = await db.Reward.findAndCountAll({
            where: { studentId },
            limit,
            offset,
            order: [['awardedAt', 'DESC']] // Sắp xếp mới nhất lên đầu
        });

        return {
            totalItems: history.count,
            totalPages: Math.ceil(history.count / limit),
            currentPage: page,
            rewards: history.rows
        };
    },
    withdrawTokens: async ({ studentId, amount, toAddress }) => {
        if (amount <= 0) {
            throw new Error('Amount must be positive.');
        }

        let withdrawalRecord = null;

        try {
            await db.sequelize.transaction(async (t) => {
                const user = await ensureUserRecord(studentId, { transaction: t, lockForUpdate: true });

                if (user.tokenBalance < amount) {
                    throw new Error('Insufficient funds.');
                }

                // Lấy wallet address đã đăng ký của user cho foreign key constraint
                const userWallet = await db.WalletAccount.findOne({ 
                    where: { userId: studentId },
                    transaction: t 
                });

                if (!userWallet) {
                    throw new Error('No wallet linked to this user. Please link a wallet first.');
                }

                withdrawalRecord = await db.TokenWithdrawal.create({
                    userId: studentId,
                    walletAddress: userWallet.address, // Sử dụng wallet đã đăng ký thay vì toAddress
                    amount,
                    status: 'processing',
                    tokenAddress: process.env.CONTRACT_ADDRESS || null,
                    metadata: { toAddress } // Lưu toAddress trong metadata
                }, { transaction: t });

                await user.decrement('tokenBalance', { by: amount, transaction: t });

                await db.Reward.create({
                    studentId,
                    tokensAwarded: amount,
                    reasonCode: 'WITHDRAW',
                    relatedId: withdrawalRecord.id,
                    transaction_type: 'SPEND'
                }, { transaction: t });
            });
        } catch (dbError) {
            console.error('Lỗi khi tạo yêu cầu rút tiền:', dbError.message);
            throw dbError;
        }

        let onChainResult;

        try {
            onChainResult = await blockchainService.disburseTokens(toAddress, amount, {
                requestId: withdrawalRecord ? withdrawalRecord.id : undefined
            });
        } catch (chainError) {
            console.error('Blockchain disburse error:', chainError);
            onChainResult = { success: false, error: chainError.message };
        }

        if (onChainResult && onChainResult.success) {
            await withdrawalRecord.update({
                status: 'completed',
                txHash: onChainResult.txHash,
                completedAt: new Date(),
                metadata: {
                    ...(withdrawalRecord.metadata || {}),
                    viaEscrow: onChainResult.viaEscrow || false
                }
            });

            console.log('✅ On-chain withdrawal completed', {
                userId: studentId,
                amount,
                toAddress,
                txHash: onChainResult.txHash,
                requestId: withdrawalRecord.id,
                viaEscrow: onChainResult.viaEscrow || false
            });

            return {
                message: 'Withdrawal successful!',
                transactionHash: onChainResult.txHash,
                success: true
            };
        }

        // Re-credit user and mark withdrawal as failed
        await db.User.increment('tokenBalance', {
            by: amount,
            where: { id: studentId }
        });

        if (withdrawalRecord) {
            await withdrawalRecord.update({
                status: 'failed',
                metadata: {
                    ...(withdrawalRecord.metadata || {}),
                    error: onChainResult?.error || 'Unknown blockchain error'
                }
            });
        }

        await db.Reward.create({
            studentId,
            tokensAwarded: amount,
            reasonCode: 'WITHDRAW_FAILED_REFUND',
            relatedId: withdrawalRecord ? withdrawalRecord.id : toAddress,
            transaction_type: 'EARN'
        });

        throw new Error(onChainResult?.error || 'Giao dịch on-chain thất bại. Tiền đã được hoàn lại vào ví off-chain.');
    }
};

module.exports = tokenService; 
