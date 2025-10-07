const Copyright = require('../models/copyright.model.js');
const DocumentSimilarity = require('../models/documentSimilarity.model.js');
const blockchainService = require('../services/blockchain.service');
const fileService = require('../services/file.service');
const similarityService = require('../services/similarity.service');
const serviceCommunication = require('../services/communication');
const dataSynchronizer = require('../services/synchronizer');
const { account } = require('../config/web3');
const { Op } = require('sequelize');

// CREATE: Register a new document
const createCopyright = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const hash = fileService.calculateHash(req.file.path);

        // Check if hash exists in DB (exact duplicate)
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

        // Get all existing documents for similarity check
        const existingDocuments = await Copyright.findAll({
            where: {
                storedFilename: {
                    [Op.not]: null
                }
            }
        });

        // Check content similarity
        const similarityResult = await similarityService.checkSimilarity(req.file.path, existingDocuments);

        if (similarityResult.isSimilar) {
            return res.status(409).json({
                message: 'This document content is very similar to existing registered documents.',
                similarityInfo: {
                    similarDocuments: similarityResult.similarDocuments,
                    threshold: similarityService.similarityThreshold,
                    message: `Document has ${similarityResult.similarityScore * 100}% similarity with existing content.`
                }
            });
        }

        // 1. Interact with Ethereum Smart Contract
        const transactionHash = await blockchainService.registerDocumentOnChain(hash);

        // 2. Save copyright info to PostgreSQL
        const newCopyright = await Copyright.create({
            filename: req.file.originalname,  // Keep original name for display
            hash: hash,
            ownerAddress: account.address,
            transactionHash: transactionHash ? String(transactionHash) : null,
            storedFilename: req.file.filename  // Store actual filename for file access
        });

        // 3. Save similarity records if needed
        if (similarityResult.similarDocuments.length > 0) {
            for (const similarDoc of similarityResult.similarDocuments) {
                await DocumentSimilarity.create({
                    sourceDocumentId: newCopyright.id,
                    targetDocumentId: similarDoc.id,
                    similarityScore: similarDoc.similarityScore
                });
            }
        }

        // 4. Synchronize data with other microservices
        const syncResult = await dataSynchronizer.syncCopyrightRegistration({
            id: newCopyright.id,
            hash: newCopyright.hash,
            filename: newCopyright.filename,
            ownerAddress: newCopyright.ownerAddress,
            transactionHash: newCopyright.transactionHash,
            similarityChecked: similarityResult.isSimilar,
            similarDocuments: similarityResult.similarDocuments
        });

        const blockchainRegistered = transactionHash !== null;
        res.status(201).json({
            message: blockchainRegistered
                ? 'File uploaded, hashed, and successfully registered on blockchain!'
                : 'File uploaded and hashed. Blockchain registration skipped (blockchain unavailable).',
            copyright: newCopyright,
            blockchainRegistered: blockchainRegistered,
            filePath: req.file.path,
            similarityChecked: true,
            wasSimilar: similarityResult.isSimilar,
            similarDocuments: similarityResult.similarDocuments,
            syncResult: syncResult
        });

    } catch (error) {
        console.error('Error during copyright registration:', error);
        res.status(500).send(error.message || 'An internal server error occurred.');
        // Don't cleanup file on error - let user know file is still there
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
const checkSimilarity = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Get all existing documents for similarity check
        const existingDocuments = await Copyright.findAll({
            where: {
                storedFilename: {
                    [Op.not]: null
                }
            }
        });

        // Check content similarity
        const similarityResult = await similarityService.checkSimilarity(req.file.path, existingDocuments);

        res.status(200).json({
            message: similarityResult.isSimilar
                ? 'Document has similar content to existing registered documents.'
                : 'Document content is unique.',
            similarityInfo: {
                isSimilar: similarityResult.isSimilar,
                similarDocuments: similarityResult.similarDocuments,
                threshold: similarityService.similarityThreshold,
                totalDocumentsChecked: existingDocuments.length,
                message: similarityResult.isSimilar
                    ? `Document has ${similarityResult.similarityScore * 100}% similarity with existing content.`
                    : 'No significant similarity found.'
            },
            filePath: req.file.path
        });

    } catch (error) {
        console.error('Error checking similarity:', error);
        res.status(500).send('An internal server error occurred while checking similarity.');
    } finally {
        // Clean up uploaded file since this is just a check
        fileService.cleanupFile(req.file.path);
    }
};

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
    checkSimilarity,
    searchCopyrights,
    getCopyrightByHash,
    verifyCopyright,
    getCopyrightStats,
};