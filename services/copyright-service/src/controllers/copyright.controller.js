const Copyright = require('../models/copyright.model.js');
const blockchainService = require('../services/blockchain.service');
const fileService = require('../services/file.service');
const { account } = require('../config/web3');
const { Op } = require('sequelize');

// CREATE: Register a new document
const createCopyright = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const hash = fileService.calculateHash(req.file.path);

        // Check if hash exists in DB
        const existingCopyright = await Copyright.findOne({ where: { hash: hash } });
        if (existingCopyright) {
            return res.status(409).json({
                message: 'This document has already been registered in the database.',
                copyright: existingCopyright
            });
        }

        // Check if hash exists on Blockchain
        const chainInfo = await blockchainService.getDocumentInfoFromChain(hash);
        if (chainInfo && chainInfo.owner) {
            return res.status(409).json({
                message: `This document hash has already been registered on the blockchain by ${chainInfo.owner}`,
            });
        }

        // 1. Interact with Ethereum Smart Contract
        const transactionHash = await blockchainService.registerDocumentOnChain(hash);

        // 2. Save copyright info to PostgreSQL
        const newCopyright = await Copyright.create({
            filename: req.file.originalname,
            hash: hash,
            ownerAddress: account.address,
            transactionHash: transactionHash ? String(transactionHash) : null
        });

        const blockchainRegistered = transactionHash !== null;
        res.status(201).json({
            message: blockchainRegistered
                ? 'File uploaded, hashed, and successfully registered on blockchain!'
                : 'File uploaded and hashed. Blockchain registration skipped (blockchain unavailable).',
            copyright: newCopyright,
            blockchainRegistered: blockchainRegistered
        });

    } catch (error) {
        console.error('Error during copyright registration:', error);
        res.status(500).send(error.message || 'An internal server error occurred.');
    } finally {
        fileService.cleanupFile(req.file.path);
    }
};

// READ: Get all copyrights
const getAllCopyrights = async (req, res) => {
    try {
        const copyrights = await Copyright.findAll();
        res.status(200).json(copyrights);
    } catch (error) {
        console.error('Error fetching copyrights:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// READ: Get a single copyright by ID
const getCopyrightById = async (req, res) => {
    try {
        const copyright = await Copyright.findByPk(req.params.id);
        if (copyright) {
            res.status(200).json(copyright);
        } else {
            res.status(404).send('Copyright not found.');
        }
    } catch (error) {
        console.error('Error fetching copyright:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// UPDATE: Update a copyright's filename
const updateCopyright = async (req, res) => {
    try {
        const copyright = await Copyright.findByPk(req.params.id);
        if (!copyright) {
            return res.status(404).send('Copyright not found.');
        }
        // For this example, we only allow updating the filename
        const { filename } = req.body;
        if (filename) {
            copyright.filename = filename;
            await copyright.save();
        }
        res.status(200).json(copyright);
    } catch (error) {
        console.error('Error updating copyright:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// DELETE: Delete a copyright
const deleteCopyright = async (req, res) => {
    try {
        const copyright = await Copyright.findByPk(req.params.id);
        if (!copyright) {
            return res.status(404).send('Copyright not found.');
        }
        await copyright.destroy();
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting copyright:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// --- New API Controllers ---

// SEARCH: Find copyrights by criteria
const searchCopyrights = async (req, res) => {
    try {
        const { filename, hash, ownerAddress } = req.query;
        const where = {};
        if (filename) where.filename = { [Op.iLike]: `%${filename}%` };
        if (hash) where.hash = hash;
        if (ownerAddress) where.ownerAddress = ownerAddress;

        const copyrights = await Copyright.findAll({ where });
        res.status(200).json(copyrights);
    } catch (error) {
        console.error('Error searching copyrights:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// READ: Get a single copyright by its hash
const getCopyrightByHash = async (req, res) => {
    try {
        const copyright = await Copyright.findOne({ where: { hash: req.params.hash } });
        if (copyright) {
            res.status(200).json(copyright);
        } else {
            res.status(404).send('Copyright not found for the given hash.');
        }
    } catch (error) {
        console.error('Error fetching copyright by hash:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// VERIFY: Verify copyright on the blockchain
const verifyCopyright = async (req, res) => {
    try {
        const copyright = await Copyright.findByPk(req.params.id);
        if (!copyright) {
            return res.status(404).send('Copyright not found in database.');
        }

        const chainInfo = await blockchainService.getDocumentInfoFromChain(copyright.hash);

        if (!chainInfo) {
            return res.status(404).json({ 
                message: 'Copyright hash not found on the blockchain.', 
                verified: false 
            });
        }

        const isOwnerMatch = chainInfo.owner.toLowerCase() === copyright.ownerAddress.toLowerCase();

        res.status(200).json({
            message: 'Verification result',
            verified: true,
            onChainOwner: chainInfo.owner,
            dbOwner: copyright.ownerAddress,
            isOwnerMatch: isOwnerMatch,
            registeredAt: new Date(Number(chainInfo.timestamp) * 1000).toISOString(),
        });

    } catch (error) {
        console.error('Error verifying copyright:', error);
        res.status(500).send('An internal server error occurred.');
    }
};

// STATS: Get copyright statistics
const getCopyrightStats = async (req, res) => {
    try {
        const total = await Copyright.count();
        res.status(200).json({ totalCopyrights: total });
    } catch (error) {
        console.error('Error getting copyright stats:', error);
        res.status(500).send('An internal server error occurred.');
    }
};


module.exports = {
    createCopyright,
    getAllCopyrights,
    getCopyrightById,
    updateCopyright,
    deleteCopyright,
    searchCopyrights,
    getCopyrightByHash,
    verifyCopyright,
    getCopyrightStats,
};