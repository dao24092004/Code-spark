 // file: src/config/web3.js
const { Web3 } = require('web3');
const config = require('./index');

const web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.providerUrl));

module.exports = web3;
