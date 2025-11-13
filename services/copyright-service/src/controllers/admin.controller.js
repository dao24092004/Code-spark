const { Op } = require('sequelize');
const Copyright = require('../models/copyright.model');
const DocumentSimilarity = require('../models/documentSimilarity.model');
const blockchainService = require('../services/blockchain.service');
const { recordAdminAction } = require('../services/audit.service');

/**
 * Get all copyrights with admin filters
 */
const getAllCopyrights = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'DESC',
            dateFrom,
            dateTo,
            ownerAddress,
            isFeatured
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};
        
        // Status filter
        if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            where.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
            if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
        }

        // Owner filter
        if (ownerAddress) {
            where.ownerAddress = ownerAddress;
        }

        // Featured filter
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured === 'true';
        }

        // Search filter
        if (search) {
            where[Op.or] = [
                { filename: { [Op.iLike]: `%${search}%` } },
                { title: { [Op.iLike]: `%${search}%` } },
                { author: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { ownerUsername: { [Op.iLike]: `%${search}%` } },
                { ownerEmail: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Copyright.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]],
            include: [
                {
                    model: DocumentSimilarity,
                    as: 'sourceSimilarities',
                    required: false,
                    attributes: ['id', 'similarityScore', 'status']
                }
            ]
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching copyrights:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bản quyền',
            error: error.message
        });
    }
};

/**
 * Update copyright status (approve/reject/suspend)
 */
const updateCopyrightStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reason, adminNotes, isFeatured, adminTags } = req.body;
    const adminId = req.user.id; // Assuming user ID is available in req.user

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ. Phải là một trong: approved, rejected, suspended'
        });
    }

    try {
        const copyright = await Copyright.findByPk(id);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản quyền'
            });
        }

        const previousStatus = copyright.status;
        
        // Record the action on blockchain
        try {
            await blockchainService.recordStatusChange({
                documentId: id,
                previousStatus,
                newStatus: status,
                reason,
                adminId,
                timestamp: new Date().toISOString()
            });
        } catch (blockchainError) {
            console.error('Error recording on blockchain:', blockchainError);
            // Continue with the update even if blockchain recording fails
            // You might want to implement a retry mechanism or queue for failed blockchain operations
        }

        // Update copyright status
        const updateData = {
            status,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNotes: adminNotes || copyright.adminNotes,
            isFeatured: isFeatured !== undefined ? isFeatured : copyright.isFeatured,
            adminTags: adminTags || copyright.adminTags
        };

        if (status === 'rejected' && reason) {
            updateData.rejectionReason = reason;
        }

        await copyright.update(updateData);

        // Record admin action in audit log
        await recordAdminAction({
            adminId,
            action: `Updated copyright status to ${status}`,
            targetId: id,
            details: {
                previousStatus,
                newStatus: status,
                reason
            }
        });

        res.json({
            success: true,
            message: `Đã cập nhật trạng thái bản quyền thành ${status}`,
            data: copyright
        });
    } catch (error) {
        console.error('Error updating copyright status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái bản quyền',
            error: error.message
        });
    }
};

/**
 * Bulk update copyright status
 */
const bulkUpdateCopyrightStatus = async (req, res) => {
    const { ids, status, reason } = req.body;
    const adminId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Danh sách ID không hợp lệ'
        });
    }

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ. Phải là một trong: approved, rejected, suspended'
        });
    }

    try {
        const result = await sequelize.transaction(async (t) => {
            const copyrights = await Copyright.findAll({
                where: { id: { [Op.in]: ids } },
                transaction: t
            });

            if (copyrights.length === 0) {
                throw new Error('Không tìm thấy bản quyền nào để cập nhật');
            }

            // Record blockchain transactions
            const blockchainPromises = copyrights.map(copyright => 
                blockchainService.recordStatusChange({
                    documentId: copyright.id,
                    previousStatus: copyright.status,
                    newStatus: status,
                    reason,
                    adminId,
                    timestamp: new Date().toISOString()
                }).catch(err => {
                    console.error(`Error recording on blockchain for document ${copyright.id}:`, err);
                    // Continue with other updates even if one fails
                })
            );

            // Wait for all blockchain operations to complete
            await Promise.all(blockchainPromises);

            // Update all copyrights
            await Copyright.update(
                {
                    status,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    ...(status === 'rejected' && reason ? { rejectionReason: reason } : {})
                },
                {
                    where: { id: { [Op.in]: ids } },
                    transaction: t
                }
            );

            // Record admin action in audit log
            await recordAdminAction({
                adminId,
                action: `Bulk updated ${copyrights.length} copyrights to ${status}`,
                targetId: null,
                details: {
                    count: copyrights.length,
                    status,
                    reason
                }
            });

            return copyrights;
        });

        res.json({
            success: true,
            message: `Đã cập nhật trạng thái ${result.length} bản quyền thành ${status}`,
            count: result.length
        });
    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hàng loạt bản quyền',
            error: error.message
        });
    }
};

/**
 * Get copyright statistics for admin dashboard
 */
const getAdminDashboardStats = async (req, res) => {
    try {
        const [
            totalCount,
            pendingCount,
            approvedCount,
            rejectedCount,
            suspendedCount,
            featuredCount,
            recentSubmissions
        ] = await Promise.all([
            Copyright.count(),
            Copyright.count({ where: { status: 'pending' } }),
            Copyright.count({ where: { status: 'approved' } }),
            Copyright.count({ where: { status: 'rejected' } }),
            Copyright.count({ where: { status: 'suspended' } }),
            Copyright.count({ where: { isFeatured: true } }),
            Copyright.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'filename', 'status', 'createdAt', 'ownerUsername']
            })
        ]);

        // Get daily submission counts for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailySubmissions = await Copyright.findAll({
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        res.json({
            success: true,
            data: {
                totalCount,
                pendingCount,
                approvedCount,
                rejectedCount,
                suspendedCount,
                featuredCount,
                recentSubmissions,
                dailySubmissions
            }
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê bảng điều khiển',
            error: error.message
        });
    }
};

/**
 * Update copyright details (admin only)
 */
const updateCopyrightDetails = async (req, res) => {
    const { id } = req.params;
    const { title, author, description, category, isFeatured, adminNotes, adminTags } = req.body;
    const adminId = req.user.id;

    try {
        const copyright = await Copyright.findByPk(id);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản quyền'
            });
        }

        const updateData = {
            title: title !== undefined ? title : copyright.title,
            author: author !== undefined ? author : copyright.author,
            description: description !== undefined ? description : copyright.description,
            category: category !== undefined ? category : copyright.category,
            isFeatured: isFeatured !== undefined ? isFeatured : copyright.isFeatured,
            adminNotes: adminNotes !== undefined ? adminNotes : copyright.adminNotes,
            adminTags: adminTags !== undefined ? adminTags : copyright.adminTags,
            updatedBy: adminId
        };

        await copyright.update(updateData);

        // Record admin action
        await recordAdminAction({
            adminId,
            action: 'Updated copyright details',
            targetId: id,
            details: updateData
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin bản quyền thành công',
            data: copyright
        });
    } catch (error) {
        console.error('Error updating copyright details:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin bản quyền',
            error: error.message
        });
    }
};

/**
 * Get similar documents for a given document (admin view)
 */
const getDocumentSimilarities = async (req, res) => {
    const { id } = req.params;
    const { threshold = 0.7 } = req.query;

    try {
        const similarities = await DocumentSimilarity.findAll({
            where: {
                [Op.or]: [
                    { sourceDocumentId: id },
                    { targetDocumentId: id }
                ],
                similarityScore: { [Op.gte]: parseFloat(threshold) }
            },
            include: [
                {
                    model: Copyright,
                    as: 'sourceDocument',
                    attributes: ['id', 'filename', 'title', 'ownerUsername', 'status']
                },
                {
                    model: Copyright,
                    as: 'targetDocument',
                    attributes: ['id', 'filename', 'title', 'ownerUsername', 'status']
                }
            ],
            order: [['similarityScore', 'DESC']]
        });

        // Format the response to show both source and target documents
        const formatted = similarities.map(sim => ({
            id: sim.id,
            similarityScore: sim.similarityScore,
            status: sim.status,
            sourceDocument: sim.sourceDocument.id === id ? null : sim.sourceDocument,
            targetDocument: sim.targetDocument.id === id ? null : sim.targetDocument,
            matchedDocument: sim.sourceDocument.id === id ? sim.targetDocument : sim.sourceDocument,
            isSource: sim.sourceDocument.id === id,
            createdAt: sim.createdAt,
            updatedAt: sim.updatedAt
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Error fetching document similarities:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tài liệu tương tự',
            error: error.message
        });
    }
};

module.exports = {
    getAllCopyrights,
    updateCopyrightStatus,
    bulkUpdateCopyrightStatus,
    getAdminDashboardStats,
    updateCopyrightDetails,
    getDocumentSimilarities
};
