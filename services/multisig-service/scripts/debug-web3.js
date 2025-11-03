#!/usr/bin/env node
require('dotenv').config();
const path = require('path');

// Ensure we load the project's web3 bootstrap (which compiles contract and prepares account)
const web3ModulePath = path.resolve(__dirname, '../src/config/web3');
let web3Module;
try {
    web3Module = require(web3ModulePath);
} catch (err) {
    console.error('Không thể load web3 module:', err.message || err);
    process.exit(1);
}

const { web3, account, compiledContract } = web3Module;

async function run() {
    try {
        console.log('Service account:', account.address);
        const balance = await web3.eth.getBalance(account.address);
        console.log('Balance (wei):', balance);
        console.log('Balance (ether):', web3.utils.fromWei(balance, 'ether'));

        if (!compiledContract || !compiledContract.bytecode) {
            console.error('Compiled contract or bytecode missing');
            process.exit(1);
        }

        console.log('Compiled bytecode length (chars):', compiledContract.bytecode.length);

        // Owners / threshold from args or sensible defaults
        const ownersArg = process.argv[2];
        const thresholdArg = process.argv[3];
        const owners = ownersArg ? ownersArg.split(',') : [account.address];
        const threshold = thresholdArg ? Number(thresholdArg) : 1;

        console.log('Estimating gas for deploy with owners:', owners, 'threshold:', threshold);

        const contract = new web3.eth.Contract(compiledContract.abi);
        const deployTx = contract.deploy({ data: '0x' + compiledContract.bytecode, arguments: [owners, threshold] });

        try {
            const estimatedGas = await deployTx.estimateGas({ from: account.address });
            console.log('Estimated gas:', estimatedGas.toString());
        } catch (estErr) {
            console.error('Estimate gas failed:', estErr && (estErr.message || estErr));
        }

        console.log('\nTips:');
        console.log('- Nếu estimateGas thất bại hoặc deploy lỗi như "code couldn\'t be stored":');
        console.log('  * Kiểm tra balance của account');
        console.log('  * Kiểm tra RPC_URL có phải Ganache / Testnet / Local node và chấp nhận txs được ký');
        console.log('  * Nếu bytecode rất lớn, contract có thể vượt giới hạn kích thước hợp đồng');
        console.log('\nRun e.g.: node scripts/debug-web3.js "0xabc...,0xdef..." 2');

    } catch (error) {
        console.error('Lỗi khi chạy debug:', error && (error.message || error));
        process.exit(1);
    }
}

run();
