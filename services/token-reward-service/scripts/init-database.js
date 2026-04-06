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
    console.log('📝 Chèn dữ liệu mẫu...');
    const { User, CryptoAccount, Reward, Gift, TokenDeposit, TokenWithdrawal } = models;

    // Kiểm tra xem đã có dữ liệu chưa
    const userCount = await User.count();
    if (userCount > 0) {
        console.log('ℹ️  Database đã có dữ liệu, bỏ qua chèn dữ liệu mẫu.');
        return;
    }

    const PROFILE_ID_1 = '00000000-0000-0000-0000-000000000001';
    const PROFILE_ID_2 = '00000000-0000-0000-0000-000000000002';
    const PROFILE_ID_3 = '00000000-0000-0000-0000-000000000003';
    const PROVIDER_ID  = '00000000-0000-0000-0000-000000000001';
    const ACCOUNT_ID_1 = '00000000-0000-0000-0000-000000000011';
    const ACCOUNT_ID_2 = '00000000-0000-0000-0000-000000000012';
    const ACCOUNT_ID_3 = '00000000-0000-0000-0000-000000000013';

    await User.bulkCreate([
        { id: 12345n, tokenBalance: 1000 },
        { id: 67890n, tokenBalance: 500 },
        { id: 13579n, tokenBalance: 2500 },
    ]);

    await CryptoAccount.bulkCreate([
        { id: ACCOUNT_ID_1, profileId: PROFILE_ID_1, providerId: PROVIDER_ID, address: '0x1234567890abcdef1234567890abcdef12345678', status: 'ACTIVE', isPrimary: true },
        { id: ACCOUNT_ID_2, profileId: PROFILE_ID_2, providerId: PROVIDER_ID, address: '0xabcdef1234567890abcdef1234567890abcdef12', status: 'ACTIVE', isPrimary: true },
        { id: ACCOUNT_ID_3, profileId: PROFILE_ID_3, providerId: PROVIDER_ID, address: '0x567890abcdef1234567890abcdef1234567890ab', status: 'ACTIVE', isPrimary: true },
    ]);

    await Reward.bulkCreate([
        { studentId: 12345n, tokensAwarded: 100n, reasonCode: 'HOMEWORK', relatedId: 'HW001', transaction_type: 'EARN' },
        { studentId: 67890n, tokensAwarded: 50n, reasonCode: 'QUIZ', relatedId: 'QZ001', transaction_type: 'EARN' },
        { studentId: 13579n, tokensAwarded: 200n, reasonCode: 'PROJECT', relatedId: 'PJ001', transaction_type: 'EARN' },
    ]);

    await Gift.bulkCreate([
        { senderId: PROFILE_ID_1, recipientId: PROFILE_ID_2, cryptoAccountId: ACCOUNT_ID_1, amount: 1000000000000000000n, tokenSymbol: 'ETH', message: 'Chúc mừng sinh nhật!', status: 'COMPLETED', txHash: '0xgift000000000000000000000000000000000000000000000000000000001' },
        { senderId: PROFILE_ID_2, recipientId: PROFILE_ID_3, cryptoAccountId: ACCOUNT_ID_2, amount: 500000000000000000n, tokenSymbol: 'ETH', message: 'Quà tặng từ lớp 10A!', status: 'PENDING' },
    ]);

    await TokenDeposit.bulkCreate([
        { profileId: PROFILE_ID_1, cryptoAccountId: ACCOUNT_ID_1, txHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd', fromAddress: '0xfrom000000000000000000000000000000000001', amount: 1000000000000000000n, tokenSymbol: 'ETH', status: 'CONFIRMED', blockNumber: 12345n, confirmations: 12 },
        { profileId: PROFILE_ID_2, cryptoAccountId: ACCOUNT_ID_2, txHash: '0xdef456789abc123def456789abc123def456789abc123def456789abcdef01', fromAddress: '0xfrom000000000000000000000000000000000002', amount: 500000000000000000n, tokenSymbol: 'ETH', status: 'CONFIRMED', blockNumber: 12346n, confirmations: 18 },
    ]);

    await TokenWithdrawal.bulkCreate([
        { profileId: PROFILE_ID_1, cryptoAccountId: ACCOUNT_ID_1, toAddress: '0xto000000000000000000000000000000000001', amount: 200000000000000000n, tokenSymbol: 'ETH', status: 'PENDING' },
        { profileId: PROFILE_ID_3, cryptoAccountId: ACCOUNT_ID_3, toAddress: '0xto000000000000000000000000000000000003', amount: 100000000000000000n, tokenSymbol: 'ETH', status: 'PENDING' },
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
