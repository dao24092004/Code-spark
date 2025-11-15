const { Op } = require('sequelize');
const db = require('../models');

const normalizeAddress = (address) => (address ? address.toLowerCase() : address);

const resolveUserId = (req) => {
    if (!req.user) return null;
    return req.user.userId || req.user.id || req.user.sub || req.user.uid || null;
};

const walletController = {
    async getLinkedWallet(req, res) {
        try {
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: missing user context' });
            }

            const wallet = await db.WalletAccount.findOne({
                where: { userId },
                order: [['linked_at', 'DESC']]
            });

            if (!wallet) {
                return res.status(404).json({ message: 'No wallet linked' });
            }

            return res.json({
                id: wallet.id,
                userId: wallet.userId,
                address: wallet.address,
                status: wallet.status,
                linkedAt: wallet.linkedAt,
                lastSeenAt: wallet.lastSeenAt,
                signature: wallet.signature
            });
        } catch (error) {
            console.error('Error fetching linked wallet:', error);
            return res.status(500).json({ message: 'Failed to fetch wallet' });
        }
    },

    async linkWallet(req, res) {
        try {
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: missing user context' });
            }

            const { address, signature } = req.body || {};
            if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length !== 42) {
                return res.status(400).json({ message: 'Invalid wallet address' });
            }

            const normalizedAddress = normalizeAddress(address);

            const existingForAddress = await db.WalletAccount.findOne({
                where: {
                    address: normalizedAddress,
                    userId: { [Op.ne]: userId }
                }
            });

            if (existingForAddress) {
                return res.status(409).json({ message: 'Wallet address already linked to another user' });
            }

            const [wallet, created] = await db.WalletAccount.findOrCreate({
                where: { userId },
                defaults: {
                    address: normalizedAddress,
                    signature: signature || null,
                    status: 'linked',
                    linkedAt: new Date(),
                    lastSeenAt: new Date()
                }
            });

            if (!created) {
                wallet.address = normalizedAddress;
                wallet.signature = signature || wallet.signature;
                wallet.status = 'linked';
                wallet.lastSeenAt = new Date();
                await wallet.save();
            }

            return res.status(created ? 201 : 200).json({
                id: wallet.id,
                userId: wallet.userId,
                address: wallet.address,
                status: wallet.status,
                linkedAt: wallet.linkedAt,
                lastSeenAt: wallet.lastSeenAt,
                signature: wallet.signature
            });
        } catch (error) {
            console.error('Error linking wallet:', error);
            return res.status(500).json({ message: 'Failed to link wallet' });
        }
    },

    async unlinkWallet(req, res) {
        try {
            const userId = resolveUserId(req);
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized: missing user context' });
            }

            const wallet = await db.WalletAccount.findOne({ where: { userId } });
            if (!wallet) {
                return res.status(404).json({ message: 'No wallet linked' });
            }

            await wallet.destroy();

            return res.status(204).send();
        } catch (error) {
            console.error('Error unlinking wallet:', error);
            return res.status(500).json({ message: 'Failed to unlink wallet' });
        }
    }
};

module.exports = walletController;

