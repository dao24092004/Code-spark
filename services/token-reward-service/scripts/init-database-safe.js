const { Sequelize } = require('sequelize');
const config = require('../src/config/db.js').development;

async function initDatabase() {
    let sequelize;
    try {
        console.log('🔧 Bắt đầu khởi tạo database...');
        
        // Kết nối đến database
        sequelize = new Sequelize(config.database, config.username, config.password, {
            host: config.host,
            dialect: 'postgres',
            logging: false
        });
        
        // Test kết nối
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công!');
        
        // 1. Tạo bảng (nếu chưa có)
        await createTables(sequelize);
        
        // 2. Thêm các cột còn thiếu (nếu chưa có)
        await addMissingColumns(sequelize);
        
        // 3. Thêm foreign keys (nếu chưa có)
        await addForeignKeys(sequelize);
        
        // 4. Chèn dữ liệu mẫu (nếu database rỗng)
        await insertSampleData(sequelize);
        
        console.log('✅ Khởi tạo database hoàn tất!');
        
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo database:', error);
        throw error;
    } finally {
        if (sequelize) await sequelize.close();
    }
}

async function createTables(sequelize) {
    console.log('📋 Kiểm tra và tạo bảng...');

    // Tạo bảng cm_users
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_users (
            id BIGINT PRIMARY KEY,
            token_balance INTEGER DEFAULT 0 NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Tạo bảng cm_wallet_accounts
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_wallet_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id BIGINT NOT NULL,
            address VARCHAR(255) NOT NULL UNIQUE,
            status VARCHAR(32) DEFAULT 'linked' NOT NULL,
            signature TEXT,
            linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            last_seen_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `);

    // Tạo bảng cm_rewards (đã có transaction_type)
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_rewards (
            id BIGSERIAL PRIMARY KEY,
            student_id BIGINT NOT NULL,
            tokens_awarded BIGINT NOT NULL,
            reason_code VARCHAR(255),
            related_id VARCHAR(255),
            awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            transaction_type VARCHAR(10) DEFAULT 'EARN' NOT NULL
        );
    `);

    // Tạo bảng cm_gifts
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_gifts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(255),
            token_price INTEGER NOT NULL CHECK (token_price >= 1),
            stock_quantity INTEGER DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Tạo bảng cm_token_deposits
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_token_deposits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id BIGINT,
            wallet_address VARCHAR(255),
            tx_hash VARCHAR(80) NOT NULL UNIQUE,
            token_address VARCHAR(255) NOT NULL,
            from_address VARCHAR(255) NOT NULL,
            to_address VARCHAR(255) NOT NULL,
            amount_raw DECIMAL(78,0) NOT NULL,
            amount_tokens BIGINT NOT NULL,
            block_number BIGINT NOT NULL,
            block_timestamp TIMESTAMP,
            status VARCHAR(32) DEFAULT 'pending' NOT NULL,
            metadata JSONB,
            confirmed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `);

    // Tạo bảng cm_token_withdrawals
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS cm_token_withdrawals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id BIGINT,
            wallet_address VARCHAR(255) NOT NULL,
            amount BIGINT NOT NULL,
            token_address VARCHAR(255),
            tx_hash VARCHAR(80),
            escrow_request_id VARCHAR(80),
            status VARCHAR(32) DEFAULT 'requested' NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            completed_at TIMESTAMP
        );
    `);

    console.log('✅ Hoàn tất kiểm tra bảng!');
}

async function addForeignKeys(sequelize) {
    console.log('🔗 Thêm foreign key constraints...');

    // Kiểm tra và thêm foreign key cho cm_wallet_accounts -> cm_users
    try {
        await sequelize.query(`
            ALTER TABLE cm_wallet_accounts 
            ADD CONSTRAINT fk_wallet_accounts_user_id 
            FOREIGN KEY (user_id) REFERENCES cm_users(id) ON DELETE CASCADE;
        `);
        console.log('➕ Thêm FK cm_wallet_accounts -> cm_users');
    } catch (error) {
        // Bỏ qua nếu đã tồn tại
        if (!error.message.includes('already exists')) {
            console.log('⚠️  FK cm_wallet_accounts -> cm_users đã tồn tại hoặc lỗi:', error.message);
        }
    }

    // Kiểm tra và thêm foreign key cho cm_token_withdrawals -> cm_wallet_accounts
    try {
        await sequelize.query(`
            ALTER TABLE cm_token_withdrawals 
            ADD CONSTRAINT cm_token_withdrawals_wallet_address_fkey 
            FOREIGN KEY (wallet_address) REFERENCES cm_wallet_accounts(address) ON DELETE CASCADE;
        `);
        console.log('➕ Thêm FK cm_token_withdrawals -> cm_wallet_accounts');
    } catch (error) {
        // Bỏ qua nếu đã tồn tại
        if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.log('⚠️  FK cm_token_withdrawals -> cm_wallet_accounts đã tồn tại hoặc lỗi:', error.message);
        }
    }

    // Kiểm tra và thêm foreign key cho cm_token_deposits -> cm_wallet_accounts
    try {
        await sequelize.query(`
            ALTER TABLE cm_token_deposits 
            ADD CONSTRAINT cm_token_deposits_wallet_address_fkey 
            FOREIGN KEY (wallet_address) REFERENCES cm_wallet_accounts(address) ON DELETE CASCADE;
        `);
        console.log('➕ Thêm FK cm_token_deposits -> cm_wallet_accounts');
    } catch (error) {
        // Bỏ qua nếu đã tồn tại
        if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.log('⚠️  FK cm_token_deposits -> cm_wallet_accounts đã tồn tại hoặc lỗi:', error.message);
        }
    }

    console.log('✅ Hoàn tất foreign keys!');
}

async function addMissingColumns(sequelize) {
    console.log('🔍 Kiểm tra các cột còn thiếu...');

    // Kiểm tra và thêm cột transaction_type vào cm_rewards nếu chưa có
    const [transactionTypeExists] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cm_rewards' 
        AND column_name = 'transaction_type';
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!transactionTypeExists) {
        console.log('➕ Thêm cột transaction_type vào cm_rewards...');
        await sequelize.query(`
            ALTER TABLE cm_rewards 
            ADD COLUMN transaction_type VARCHAR(10) DEFAULT 'EARN' NOT NULL;
        `);
    }

    // Kiểm tra và thêm cột related_id vào cm_rewards nếu chưa có
    const [relatedIdExists] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'cm_rewards' 
        AND column_name = 'related_id';
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!relatedIdExists) {
        console.log('➕ Thêm cột related_id vào cm_rewards...');
        await sequelize.query(`
            ALTER TABLE cm_rewards 
            ADD COLUMN related_id VARCHAR(255);
        `);
    }

    // Kiểm tra và thêm các cột cho cm_gifts
    const giftColumns = [
        { name: 'image_url', sql: 'image_url VARCHAR(255)' },
        { name: 'created_at', sql: 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', sql: 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of giftColumns) {
        const [exists] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cm_gifts' 
            AND column_name = '${col.name}';
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!exists) {
            console.log(`➕ Thêm cột ${col.name} vào cm_gifts...`);
            await sequelize.query(`
                ALTER TABLE cm_gifts 
                ADD COLUMN ${col.sql};
            `);
        }
    }

    // Kiểm tra và thêm các cột cho cm_token_deposits
    const depositColumns = [
        { name: 'from_address', sql: 'from_address VARCHAR(255) NOT NULL' },
        { name: 'amount_raw', sql: 'amount_raw DECIMAL(78,0) NOT NULL' },
        { name: 'amount_tokens', sql: 'amount_tokens BIGINT NOT NULL' },
        { name: 'block_number', sql: 'block_number BIGINT NOT NULL' },
        { name: 'block_timestamp', sql: 'block_timestamp TIMESTAMP' },
        { name: 'metadata', sql: 'metadata JSONB' },
        { name: 'confirmed_at', sql: 'confirmed_at TIMESTAMP' },
        { name: 'created_at', sql: 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL' },
        { name: 'updated_at', sql: 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL' }
    ];

    for (const col of depositColumns) {
        const [exists] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cm_token_deposits' 
            AND column_name = '${col.name}';
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!exists) {
            console.log(`➕ Thêm cột ${col.name} vào cm_token_deposits...`);
            await sequelize.query(`
                ALTER TABLE cm_token_deposits 
                ADD COLUMN ${col.sql};
            `);
        }
    }

    // Kiểm tra và thêm các cột cho cm_token_withdrawals
    const withdrawalColumns = [
        { name: 'token_address', sql: 'token_address VARCHAR(255)' },
        { name: 'tx_hash', sql: 'tx_hash VARCHAR(80)' },
        { name: 'escrow_request_id', sql: 'escrow_request_id VARCHAR(80)' },
        { name: 'metadata', sql: 'metadata JSONB' },
        { name: 'completed_at', sql: 'completed_at TIMESTAMP' },
        { name: 'created_at', sql: 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL' },
        { name: 'updated_at', sql: 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL' }
    ];

    for (const col of withdrawalColumns) {
        const [exists] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cm_token_withdrawals' 
            AND column_name = '${col.name}';
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!exists) {
            console.log(`➕ Thêm cột ${col.name} vào cm_token_withdrawals...`);
            await sequelize.query(`
                ALTER TABLE cm_token_withdrawals 
                ADD COLUMN ${col.sql};
            `);
        }
    }

    // Kiểm tra và thêm các cột cho cm_users
    const userColumns = [
        { name: 'created_at', sql: 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', sql: 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of userColumns) {
        const [exists] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cm_users' 
            AND column_name = '${col.name}';
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!exists) {
            console.log(`➕ Thêm cột ${col.name} vào cm_users...`);
            await sequelize.query(`
                ALTER TABLE cm_users 
                ADD COLUMN ${col.sql};
            `);
        }
    }

    console.log('✅ Hoàn tất kiểm tra cột!');
}

async function insertSampleData(sequelize) {
    console.log('📝 Chèn dữ liệu mẫu...');

    // Kiểm tra xem đã có dữ liệu chưa
    const [userCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM cm_users;
    `, { type: Sequelize.QueryTypes.SELECT });

    if (parseInt(userCount.count) > 0) {
        console.log('ℹ️  Database đã có dữ liệu, bỏ qua chèn dữ liệu mẫu.');
        return;
    }

    // Chèn user mẫu
    await sequelize.query(`
        INSERT INTO cm_users (id, token_balance) VALUES 
        (12345, 1000),
        (67890, 500),
        (13579, 2500);
    `);

    // Chèn wallet accounts mẫu
    await sequelize.query(`
        INSERT INTO cm_wallet_accounts (user_id, address, status) VALUES 
        (12345, '0x1234567890abcdef1234567890abcdef12345678', 'linked'),
        (67890, '0xabcdef1234567890abcdef1234567890abcdef12', 'linked'),
        (13579, '0x567890abcdef1234567890abcdef1234567890ab', 'linked');
    `);

    // Chèn rewards mẫu
    await sequelize.query(`
        INSERT INTO cm_rewards (student_id, tokens_awarded, reason_code, related_id, transaction_type) VALUES 
        (12345, 100, 'HOMEWORK', 'HW001', 'EARN'),
        (67890, 50, 'QUIZ', 'QZ001', 'EARN'),
        (13579, 200, 'PROJECT', 'PJ001', 'EARN');
    `);

    // Chèn gifts mẫu
    await sequelize.query(`
        INSERT INTO cm_gifts (name, description, token_price, stock_quantity, category) VALUES 
        ('Notebook', 'Sổ tay cao cấp', 100, 50, 'stationery'),
        ('Pen', 'Bút bi chất lượng', 50, 100, 'stationery'),
        ('Backpack', 'Ba lô học sinh', 500, 20, 'accessories');
    `);

    // Chèn token deposits mẫu
    await sequelize.query(`
        INSERT INTO cm_token_deposits (user_id, wallet_address, tx_hash, token_address, from_address, to_address, amount_raw, amount_tokens, block_number, status) VALUES 
        (12345, '0x1234567890abcdef1234567890abcdef12345678', '0xabc123...', '0xtoken123', '0xfrom456', '0xto789', '1000000000000000000', 1000, 12345, 'confirmed'),
        (67890, '0xabcdef1234567890abcdef1234567890abcdef12', '0xdef456...', '0xtoken123', '0xfrom789', '0xto123', '500000000000000000', 500, 12346, 'confirmed');
    `);

    // Chèn token withdrawals mẫu
    await sequelize.query(`
        INSERT INTO cm_token_withdrawals (user_id, wallet_address, amount, status) VALUES 
        (12345, '0x1234567890abcdef1234567890abcdef12345678', 200, 'requested'),
        (13579, '0x567890abcdef1234567890abcdef1234567890ab', 100, 'requested');
    `);

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
