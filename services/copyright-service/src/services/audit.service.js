const { Op } = require('sequelize');
const AdminAuditLog = require('../models/adminAuditLog.model');
const blockchainService = require('./blockchain.service');

/**
 * Record an admin action in the audit log and on the blockchain
 * @param {Object} params - Action parameters
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.action - Description of the action
 * @param {string|null} params.targetId - ID of the target entity (if any)
 * @param {Object} params.details - Additional details about the action
 * @returns {Promise<Object>} The created audit log entry
 */
const recordAdminAction = async ({ adminId, action, targetId, details = {} }) => {
    const t = await sequelize.transaction();
    
    try {
        // Create audit log in database
        const auditLog = await AdminAuditLog.create({
            adminId,
            action,
            targetId,
            details,
            ipAddress: details.ipAddress || null,
            userAgent: details.userAgent || null
        }, { transaction: t });

        // Record action on blockchain
        try {
            await blockchainService.recordAuditAction({
                logId: auditLog.id,
                adminId,
                action,
                targetId,
                timestamp: new Date().toISOString(),
                txHash: null // Will be updated when blockchain tx is confirmed
            });
        } catch (blockchainError) {
            console.error('Failed to record audit action on blockchain:', blockchainError);
            // Continue with the database transaction even if blockchain recording fails
        }

        await t.commit();
        return auditLog;
    } catch (error) {
        await t.rollback();
        console.error('Error recording admin action:', error);
        throw error;
    }
};

/**
 * Get audit logs with pagination and filtering
 */
const getAuditLogs = async ({
    page = 1,
    limit = 50,
    adminId,
    action,
    targetId,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
}) => {
    const offset = (page - 1) * limit;
    const where = {};
    
    if (adminId) where.adminId = adminId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (targetId) where.targetId = targetId;
    
    // Date range filter
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const { count, rows } = await AdminAuditLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
            // You can include admin user details if you have a User model
            // {
            //     model: User,
            //     as: 'admin',
            //     attributes: ['id', 'username', 'email']
            // }
        ]
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            limit: parseInt(limit)
        }
    };
};

module.exports = {
    recordAdminAction,
    getAuditLogs
};
