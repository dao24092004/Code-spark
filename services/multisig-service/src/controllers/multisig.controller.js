const multisigService = require('../services/multisig.service');

const getInfo = async (req, res, next) => {
    try {
        const info = await multisigService.getWalletInfo();
        res.json(info);
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await multisigService.getTransactions();
        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

const submitTransaction = async (req, res, next) => {
    try {
        const { to, value, data } = req.body;
        const txHash = await multisigService.submitTransaction(to, value, data);
        res.status(201).json({ message: 'Transaction submitted', txHash });
    } catch (error) {
        next(error);
    }
};

const confirmTransaction = async (req, res, next) => {
    try {
        const { txIndex } = req.body;
        const txHash = await multisigService.confirmTransaction(txIndex);
        res.json({ message: 'Transaction confirmed', txHash });
    } catch (error) {
        next(error);
    }
};

const executeTransaction = async (req, res, next) => {
    try {
        const { txIndex } = req.body;
        const txHash = await multisigService.executeTransaction(txIndex);
        res.json({ message: 'Transaction executed', txHash });
    } catch (error) {
        next(error);
    }
};

const revokeConfirmation = async (req, res, next) => {
    try {
        const { txIndex } = req.body;
        const txHash = await multisigService.revokeConfirmation(txIndex);
        res.json({ message: 'Confirmation revoked', txHash });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInfo,
    getTransactions,
    submitTransaction,
    confirmTransaction,
    executeTransaction,
    revokeConfirmation
};