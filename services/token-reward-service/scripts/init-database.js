// scripts/init-database.js
const db = require('../src/models');

async function initDatabase(options = {}) {
    try {
        console.log('🔧 Bắt đầu khởi tạo database...');
        
        // Test kết nối
        await db.sequelize.authenticate();
        console.log('✅ Kết nối database thành công!');
        
        // Đồng bộ hóa database
        // alter: true sẽ kiểm tra và thêm các cột còn thiếu
        await db.sequelize.sync({ alter: true });
        console.log('✅ Đồng bộ hóa database thành công!');
        
        // Chèn dữ liệu mẫu (nếu database rỗng)
        await insertSampleData(db);
        
        console.log('✅ Khởi tạo database hoàn tất!');
        
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo database:', error);
        throw error;
    } finally {
        // Chỉ đóng connection khi được gọi trực tiếp từ command line
        // Không đóng khi được gọi từ server.js
        if (options.closeConnection !== false && require.main === module) {
            if (db.sequelize) await db.sequelize.close();
        }
    }
}

async function insertSampleData(models) {
    const { User, WalletAccount, Reward, Gift, TokenDeposit, TokenWithdrawal } = models;
    console.log('📝 Chèn dữ liệu mẫu...');

    // Kiểm tra xem đã có dữ liệu chưa
    const userCount = await User.count();

    if (userCount > 0) {
        console.log('ℹ️  Database đã có dữ liệu, bỏ qua chèn dữ liệu mẫu.');
        return;
    }

    // Chèn user mẫu
    await User.bulkCreate([
        { id: 12345, tokenBalance: 1000 },
        { id: 67890, tokenBalance: 500 },
        { id: 13579, tokenBalance: 2500 }
    ]);

    // Chèn wallet accounts mẫu
    await WalletAccount.bulkCreate([
        { userId: 12345, address: '0x1234567890abcdef1234567890abcdef12345678', status: 'linked' },
        { userId: 67890, address: '0xabcdef1234567890abcdef1234567890abcdef12', status: 'linked' },
        { userId: 13579, address: '0x567890abcdef1234567890abcdef1234567890ab', status: 'linked' }
    ]);

    // Chèn rewards mẫu
    await Reward.bulkCreate([
        { studentId: 12345, tokensAwarded: 100, reasonCode: 'HOMEWORK', relatedId: 'HW001', transaction_type: 'EARN' },
        { studentId: 67890, tokensAwarded: 50, reasonCode: 'QUIZ', relatedId: 'QZ001', transaction_type: 'EARN' },
        { studentId: 13579, tokensAwarded: 200, reasonCode: 'PROJECT', relatedId: 'PJ001', transaction_type: 'EARN' }
    ]);

    // Chèn gifts mẫu
    await Gift.bulkCreate([
        { name: 'Notebook', description: 'Sổ tay cao cấp', tokenPrice: 100, stockQuantity: 50, category: 'stationery' },
        { name: 'Pen', description: 'Bút bi chất lượng', tokenPrice: 50, stockQuantity: 100, category: 'stationery' },
        { name: 'Backpack', description: 'Ba lô học sinh', tokenPrice: 500, stockQuantity: 20, category: 'accessories' }
    ]);

    // Chèn token deposits mẫu
    await TokenDeposit.bulkCreate([
        { userId: 12345, walletAddress: '0x1234567890abcdef1234567890abcdef12345678', txHash: '0xabc123...', tokenAddress: '0xtoken123', fromAddress: '0xfrom456', toAddress: '0xto789', amountRaw: '1000000000000000000', amountTokens: 1000, blockNumber: 12345, status: 'confirmed' },
        { userId: 67890, walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12', txHash: '0xdef456...', tokenAddress: '0xtoken123', fromAddress: '0xfrom789', toAddress: '0xto123', amountRaw: '500000000000000000', amountTokens: 500, blockNumber: 12346, 'status': 'confirmed' }
    ]);

    // Chèn token withdrawals mẫu
    await TokenWithdrawal.bulkCreate([
        { userId: 12345, walletAddress: '0x1234567890abcdef1234567890abcdef12345678', amount: 200, status: 'requested' },
        { userId: 13579, walletAddress: '0x567890abcdef1234567890abcdef1234567890ab', amount: 100, status: 'requested' }
    ]);

    console.log('✅ Hoàn tất chèn dữ liệu mẫu!');
}

// Chạy script
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('🎉 Database initialization completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase };
