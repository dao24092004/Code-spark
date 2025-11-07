// Script tự động fund contract wallet từ transaction ID
// Usage: node scripts/auto-fund-contract.js <transactionId> [amountInEth]

const { Sequelize } = require('sequelize');
const { Web3 } = require('web3');
require('dotenv').config();

const transactionId = process.argv[2];
const amountInEth = parseFloat(process.argv[3]) || 100;
const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';

if (!transactionId) {
    console.error('❌ Vui lòng cung cấp transaction ID');
    console.log('Usage: node scripts/auto-fund-contract.js <transactionId> [amountInEth]');
    process.exit(1);
}

async function main() {
    try {
        // 1. Kết nối database
        const sequelize = new Sequelize(
            process.env.DB_NAME || 'multisig_db',
            process.env.DB_USER || 'postgres',
            process.env.DB_PASS || 'password',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5433,
                dialect: 'postgres',
                logging: false
            }
        );

        console.log('📡 Đang kết nối database...');
        await sequelize.authenticate();
        console.log('✅ Đã kết nối database');

        // 2. Query transaction
        const results = await sequelize.query(`
            SELECT 
                t.id,
                t.value,
                w."contractAddress",
                w.id as "walletId"
            FROM "MultisigTransactions" t
            INNER JOIN "MultisigWallets" w ON t."walletId" = w.id
            WHERE t.id = :transactionId
        `, {
            replacements: { transactionId },
            type: Sequelize.QueryTypes.SELECT
        });

        if (!results || results.length === 0) {
            console.error('❌ Không tìm thấy transaction với ID:', transactionId);
            process.exit(1);
        }

        const tx = results[0];
        const contractAddress = tx.contractAddress;
        const valueEth = parseFloat(Web3.utils.fromWei(tx.value, 'ether'));

        console.log('');
        console.log('✅ Tìm thấy transaction:');
        console.log('   Transaction ID:', transactionId);
        console.log('   Wallet ID:', tx.walletId);
        console.log('   Contract Address:', contractAddress);
        console.log('   Transaction Value:', valueEth, 'ETH');
        console.log('');

        // 3. Kết nối Web3
        const web3 = new Web3(rpcUrl);
        console.log('📡 Đang kết nối blockchain...');
        console.log('   RPC URL:', rpcUrl);

        // 4. Kiểm tra balance hiện tại
        const currentBalance = await web3.eth.getBalance(contractAddress);
        const currentBalanceEth = parseFloat(Web3.utils.fromWei(currentBalance.toString(), 'ether'));
        console.log('   Current Balance:', currentBalanceEth, 'ETH');
        console.log('');

        // 5. Lấy accounts từ Ganache
        const accounts = await web3.eth.getAccounts();
        const fromAccount = accounts[0];
        console.log('📋 Từ account:', fromAccount);
        console.log('📋 Đến contract:', contractAddress);
        console.log('');

        // 6. Fund contract wallet
        const amountWei = Web3.utils.toWei(amountInEth.toString(), 'ether');
        console.log('💰 Đang chuyển', amountInEth, 'ETH...');

        // Dùng eth_sendTransaction qua RPC để tránh revert
        const txHash = await web3.eth.sendTransaction({
            from: fromAccount,
            to: contractAddress,
            value: amountWei,
            gas: 21000,  // Gas limit cho simple transfer
            gasPrice: await web3.eth.getGasPrice()
        });

        console.log('✅ Transaction Hash:', txHash.transactionHash || txHash);
        console.log('');

        // 7. Kiểm tra balance mới
        console.log('⏳ Đợi transaction được xử lý...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newBalance = await web3.eth.getBalance(contractAddress);
        const newBalanceEth = parseFloat(Web3.utils.fromWei(newBalance.toString(), 'ether'));
        console.log('✅ New Balance:', newBalanceEth, 'ETH');
        console.log('');

        if (newBalanceEth >= valueEth) {
            console.log('✅ Contract wallet đã có đủ ETH để execute transaction!');
        } else {
            console.log('⚠️  Vẫn thiếu ETH, cần fund thêm!');
        }

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();

