const { Op } = require('sequelize');
const Copyright = require('../models/copyright.model');
const DocumentSimilarity = require('../models/documentSimilarity.model');
const blockchainService = require('../services/blockchain.service');
const { recordAdminAction } = require('../services/audit.service');

// Nhúng 3 báu vật từ thư viện chung
const { asyncHandler, ApiResponse, AppException } = require('common-node');

/**
 * Get all copyrights with admin filters
 */
const getAllCopyrights = asyncHandler(async (req, res) => {
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

    res.status(200).json(ApiResponse.success("Lấy danh sách thành công", {
        items: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            limit: parseInt(limit)
        }
    }));
});

/**
 * Update copyright status (approve/reject/suspend)
 */
const updateCopyrightStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason, adminNotes, isFeatured, adminTags } = req.body;
    
    // Hỗ trợ cả 2 chuẩn tùy theo cách JWT decode
    const adminId = req.user?.userId || req.user?.id; 

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
        throw new AppException('Trạng thái không hợp lệ. Phải là một trong: approved, rejected, suspended', 400);
    }

    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
        throw new AppException('Không tìm thấy bản quyền', 404);
    }

    const previousStatus = copyright.status;
    
    // GIỮ NGUYÊN TRY...CATCH Ở ĐÂY: Vì nếu Blockchain lỗi, ta vẫn muốn cập nhật DB
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

    res.status(200).json(ApiResponse.success(`Đã cập nhật trạng thái bản quyền thành ${status}`, copyright));
});

/**
 * Bulk update copyright status
 */
const bulkUpdateCopyrightStatus = asyncHandler(async (req, res) => {
    const { ids, status, reason } = req.body;
    const adminId = req.user?.userId || req.user?.id;

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppException('Danh sách ID không hợp lệ', 400);
    }

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
        throw new AppException('Trạng thái không hợp lệ. Phải là một trong: approved, rejected, suspended', 400);
    }

    // Thay thế 'sequelize' bằng 'Copyright.sequelize' để tránh lỗi undefined
    const result = await Copyright.sequelize.transaction(async (t) => {
        const copyrights = await Copyright.findAll({
            where: { id: { [Op.in]: ids } },
            transaction: t
        });

        if (copyrights.length === 0) {
            throw new AppException('Không tìm thấy bản quyền nào để cập nhật', 404);
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

    res.status(200).json(ApiResponse.success(`Đã cập nhật trạng thái ${result.length} bản quyền thành ${status}`, { count: result.length }));
});

/**
 * Get copyright statistics for admin dashboard
 */
const getAdminDashboardStats = asyncHandler(async (req, res) => {
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

    // Thay thế 'sequelize' bằng 'Copyright.sequelize'
    const dailySubmissions = await Copyright.findAll({
        where: {
            createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
            [Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt')), 'date'],
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'count']
        ],
        group: [Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt'))],
        order: [[Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt')), 'ASC']],
        raw: true
    });

    res.status(200).json(ApiResponse.success("Lấy thống kê thành công", {
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        suspendedCount,
        featuredCount,
        recentSubmissions,
        dailySubmissions
    }));
});

/**
 * Update copyright details (admin only)
 */
const updateCopyrightDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, author, description, category, isFeatured, adminNotes, adminTags } = req.body;
    const adminId = req.user?.userId || req.user?.id;

    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
        throw new AppException('Không tìm thấy bản quyền', 404);
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

    res.status(200).json(ApiResponse.success('Cập nhật thông tin bản quyền thành công', copyright));
});

/**
 * Get similar documents for a given document (admin view)
 */
const getDocumentSimilarities = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { threshold = 0.7 } = req.query;

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

    res.status(200).json(ApiResponse.success("Lấy danh sách tương đồng thành công", formatted));
});

module.exports = {
    getAllCopyrights,
    updateCopyrightStatus,
    bulkUpdateCopyrightStatus,
    getAdminDashboardStats,
    updateCopyrightDetails,
    getDocumentSimilarities
};