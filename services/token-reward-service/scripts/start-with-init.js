// scripts/start-with-init.js
const { initDatabase } = require('./init-database');
const { spawn } = require('child_process');

async function startWithInit() {
    try {
        console.log('🚀 Bắt đầu khởi động Token Reward Service...');
        
        // 1. Khởi tạo database
        await initDatabase();
        
        // 2. Khởi động server
        console.log('🌟 Khởi động server...');
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            env: process.env
        });
        
        server.on('close', (code) => {
            console.log(`Server exited with code ${code}`);
            process.exit(code);
        });
        
        // Handle termination
        process.on('SIGINT', () => {
            console.log('\n🛑 Đang tắt server...');
            server.kill('SIGINT');
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi khởi động:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startWithInit();
}

module.exports = { startWithInit };
