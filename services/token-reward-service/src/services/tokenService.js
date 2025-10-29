// src/services/tokenService.js

// Import các model từ file index
const db = require('../models');
const blockchainService = require('./blockchainService');

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
            // 1. TÌM USER (Dòng bị thiếu)
            const user = await db.User.findByPk(studentId, { transaction: t });

            if (!user) {
                throw new Error('User not found.');
            }

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

        return result;
    },

    spendTokens: async ({ studentId, amount, reasonCode, relatedId }) => {
        if (amount <= 0) {
            throw new Error('Amount must be positive.');
        }

        const result = await db.sequelize.transaction(async (t) => {
            const user = await db.User.findByPk(studentId, { 
                transaction: t,
                lock: t.LOCK.UPDATE 
            });

            if (!user) {
                throw new Error('User not found.');
            }
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
        const user = await db.User.findByPk(studentId);
        
        if (!user) {
            throw new Error('User not found.');
        }

        return { tokenBalance: user.tokenBalance };
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

        // Bước 1: Trừ tiền Off-chain (trong DB)
        // Chúng ta phải đảm bảo người dùng có đủ tiền TRƯỚC KHI chuyển on-chain
        try {
            await db.sequelize.transaction(async (t) => {
                const user = await db.User.findByPk(studentId, { 
                    transaction: t,
                    lock: t.LOCK.UPDATE 
                });

                if (!user) {
                    throw new Error('User not found.');
                }
                if (user.tokenBalance < amount) {
                    throw new Error('Insufficient funds.'); // Không đủ tiền
                }

                // Trừ tiền trong DB
                await user.decrement('tokenBalance', { by: amount, transaction: t });

                // Ghi log rút tiền (có thể thêm transaction_type 'WITHDRAW')
                await db.Reward.create({
                    studentId,
                    tokensAwarded: amount, // Ghi số dương
                    reasonCode: 'WITHDRAW',
                    relatedId: toAddress, // Lưu địa chỉ ví rút tiền
                    transaction_type: 'SPEND' // Hoặc 'WITHDRAW' nếu bạn thêm vào DB
                }, { transaction: t });
            });
        } catch (dbError) {
            // Nếu có lỗi ở bước này (vd: không đủ tiền), dừng lại ngay
            console.error("Lỗi khi trừ tiền off-chain:", dbError.message);
            throw dbError; 
        }

        // Bước 2: Chuyển tiền On-chain (trên Ganache)
        // Chỉ thực hiện khi Bước 1 đã thành công
        const onChainResult = await blockchainService.transferTokens(toAddress, amount);

        if (onChainResult.success) {
            // Cả 2 bước thành công!
            return { 
                message: 'Withdrawal successful!', 
                txHash: onChainResult.txHash 
            };
        } else {
            // LỖI: Bước 2 (On-chain) thất bại
            // Chúng ta phải "hoàn tiền" lại cho người dùng vào DB
            console.error('Lỗi On-chain, đang hoàn tiền (refund) cho người dùng...');
            const user = await db.User.findByPk(studentId);
            await user.increment('tokenBalance', { by: amount });
            
            // Ghi log hoàn tiền
            await db.Reward.create({
                studentId,
                tokensAwarded: amount,
                reasonCode: 'WITHDRAW_FAILED_REFUND',
                relatedId: toAddress,
                transaction_type: 'EARN' // Trả lại tiền
            });
            throw new Error('Giao dịch on-chain thất bại. Tiền đã được hoàn lại vào ví off-chain.');
        }
    }
};

module.exports = tokenService; 
