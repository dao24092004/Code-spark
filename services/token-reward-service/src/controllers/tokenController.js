 // src/controllers/tokenController.js
const tokenService = require('../services/tokenService');

const tokenController = {
    grantTokenHandler: async (req, res) => {
        try {
            // 1. Lấy dữ liệu từ body của request
            const { studentId, amount, reasonCode, relatedId } = req.body;

            // 2. Kiểm tra dữ liệu đầu vào cơ bản
            if (!studentId || !amount) {
                return res.status(400).json({ message: 'studentId and amount are required.' });
            }

            // 3. Gọi service để thực hiện logic
            const newReward = await tokenService.grantTokens({
                studentId,
                amount,
                reasonCode,
                relatedId
            });

            // 4. Trả về response thành công
            // Status 201 có nghĩa là "Created" (Đã tạo thành công)
            res.status(201).json(newReward);

        } catch (error) {
            console.error('Error granting tokens:', error);
            // Check lỗi cụ thể để trả về status code phù hợp hơn
            if (error.message === 'User not found.') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'An internal server error occurred.' });
        }
    },
    // Handler mới cho UC27
    spendTokenHandler: async (req, res) => {
        try {
            const { studentId, amount, reasonCode, relatedId } = req.body;
            if (!studentId || !amount) {
                return res.status(400).json({ message: 'studentId and amount are required.' });
            }

            const spendLog = await tokenService.spendTokens({ studentId, amount, reasonCode, relatedId });
            res.status(201).json(spendLog); // 201 Created (một bản ghi log mới)

        } catch (error) {
            console.error('Error spending tokens:', error);
            if (error.message === 'User not found.') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Insufficient funds.') {
                return res.status(400).json({ message: error.message }); // 400 Bad Request
            }
            res.status(500).json({ message: 'An internal server error occurred.' });
        }
    },

    // Handler mới cho UC28a
    getBalanceHandler: async (req, res) => {
        try {
            const { studentId } = req.params; // Lấy từ URL
            console.log('🔍 getBalanceHandler called with studentId:', studentId);
            const balance = await tokenService.getBalance(Number(studentId));
            console.log('✅ Balance found:', balance);
            return res.status(200).json(balance);

        } catch (error) {
            console.error('❌ Error getting balance:', error);
            if (error.message === 'User not found.') {
                console.log('📤 Sending 404 response for User not found');
                return res.status(404).json({ message: error.message });
            }
            console.log('📤 Sending 500 response for internal error');
            return res.status(500).json({ message: 'An internal server error occurred.' });
        }
    },

    // Handler mới cho UC28b
    getHistoryHandler: async (req, res) => {
        try {
            const { studentId } = req.params; // Lấy từ URL
            // Lấy page/limit từ query string, vd: /history/1?page=2&limit=5
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const history = await tokenService.getHistory(Number(studentId), page, limit);
            res.status(200).json(history);

        } catch (error) {
            console.error('Error getting history:', error);
            res.status(500).json({ message: 'An internal server error occurred.' });
        }
    },
    withdrawTokenHandler: async (req, res) => {
        try {
            const { studentId, amount, toAddress } = req.body;
            if (!studentId || !amount || !toAddress) {
                return res.status(400).json({ message: 'studentId, amount, và toAddress là bắt buộc.' });
            }

            const result = await tokenService.withdrawTokens({ 
                studentId: Number(studentId), 
                amount: Number(amount), 
                toAddress 
            });
            res.status(200).json(result); // Trả về hash của giao dịch

        } catch (error) {
            console.error('Lỗi khi rút token:', error.message);
            // Bắt các lỗi đã biết
            if (error.message.includes('Insufficient funds') || error.message.includes('User not found')) {
                return res.status(400).json({ message: error.message });
            }
            // Lỗi chung
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = tokenController;
