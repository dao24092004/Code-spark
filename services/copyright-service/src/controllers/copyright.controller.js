const Copyright = require('../models/copyright.model.js');
const DocumentSimilarity = require('../models/documentSimilarity.model.js');
const blockchainService = require('../services/blockchain.service');
const fileService = require('../services/file.service');
const { similarityService } = require('../services/similarity.service');
const serviceCommunication = require('../services/communication');
const dataSynchronizer = require('../services/synchronizer');
const { account } = require('../config/web3');
const { Op } = require('sequelize');
const fs = require('fs'); // Thêm thư viện fs để đọc file thành buffer

// Nhúng báu vật từ thư viện chung (Thêm FileServiceClient)
const { asyncHandler, ApiResponse, AppException, FileServiceClient } = require('common-node');

// Khởi tạo FileServiceClient để gọi sang Java
const fileServiceClient = new FileServiceClient();

// CREATE: Register a new document
const createCopyright = asyncHandler(async (req, res) => {
    // The file is already saved to disk by the upload middleware
    // req.file contains the file information
    const file = req.file;
    
    if (!file) {
        throw new AppException('Không tìm thấy file tải lên. Vui lòng thử lại.', 400);
    }
    
    // Log file information
    console.log('Processing uploaded file:', {
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
    });
    
    // Prepare file info for further processing
    const fileInfo = {
        originalName: file.originalname,
        storedName: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
    };
    
    try {
        let similarityResult = { isSimilar: false };
        // 2. Kiểm tra trùng lặp nội dung (sử dụng MD5 hash)
        const { isDuplicate, existingDoc, contentHash } = await fileService.findDuplicateByContent(fileInfo.path);
        
        if (isDuplicate) {
            return res.status(409).json(ApiResponse.error('Tài liệu đã tồn tại trong hệ thống (nội dung giống hệt)', {
                existingDocument: {
                    id: existingDoc.id,
                    filename: existingDoc.filename,
                    registeredAt: existingDoc.createdAt,
                    owner: existingDoc.ownerAddress
                },
                contentHash: contentHash
            }));
        }

        // 3. Tính SHA-256 hash cho bảo mật
        const hash = await fileService.calculateHash(fileInfo.path);

        // 4. Kiểm tra hash trong database
        const existingCopyright = await Copyright.findOne({ 
            where: { 
                [Op.or]: [
                    { hash },
                    { contentHash: contentHash || '' }
                ]
            } 
        });

        if (existingCopyright) {
            return res.status(409).json(ApiResponse.error('Tài liệu này đã được đăng ký bản quyền trước đó.', {
                copyright: {
                    id: existingCopyright.id,
                    filename: existingCopyright.filename,
                    registeredAt: existingCopyright.createdAt,
                    owner: existingCopyright.ownerAddress
                }
            }));
        }

        // 5. Kiểm tra trên blockchain
        const chainInfo = await blockchainService.getDocumentInfoFromChain(hash);
        if (chainInfo && chainInfo.owner) {
            return res.status(409).json(ApiResponse.error(`Tài liệu này đã được đăng ký trên blockchain bởi ${chainInfo.owner}`, {
                blockchainInfo: {
                    owner: chainInfo.owner,
                    blockNumber: chainInfo.blockNumber,
                    transactionHash: chainInfo.transactionHash
                }
            }));
        }

        // 6. Kiểm tra tương đồng nội dung
        const existingDocuments = await Copyright.findAll({
            where: { 
                storedFilename: { [Op.not]: null },
                // Chỉ kiểm tra các tài liệu đã đăng ký trong vòng 1 năm gần đây
                createdAt: { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            },
            order: [['createdAt', 'DESC']],
            limit: 1000 // Giới hạn số lượng tài liệu kiểm tra
        });

        if (existingDocuments.length > 0) {
            similarityResult = await similarityService.checkSimilarity(
                fileInfo.path, 
                existingDocuments
            );

            if (similarityResult.isSimilar) {
                // Dọn dẹp file tạm nếu có lỗi
                await fileService.cleanupFile(fileInfo.path);
                
                return res.status(409).json(ApiResponse.error('Phát hiện nội dung tương tự với tài liệu đã có trong hệ thống.', {
                    similarityInfo: {
                        isSimilar: true,
                        similarityScore: similarityResult.similarityScore,
                        similarDocuments: similarityResult.similarDocuments.map(doc => ({
                            id: doc.id,
                            filename: doc.filename,
                            similarity: doc.similarityScore,
                            matchedSections: doc.matchedSections || []
                        })),
                        threshold: similarityService.similarityThreshold,
                        message: `Nội dung có ${(similarityResult.similarityScore * 100).toFixed(1)}% tương đồng với tài liệu đã có.`
                    }
                }));
            }
        }

        // 7. Đăng ký lên blockchain
        const transactionHash = await blockchainService.registerDocumentOnChain(hash);

        // ======================================================
        // 🔥 GỌI FILE SERVICE CLIENT ĐỂ ĐẨY FILE SANG JAVA 🔥
        // ======================================================
        console.log("Bắt đầu đẩy file sang Java File Service...");
        const fileBuffer = fs.readFileSync(fileInfo.path);
        
        const fileUrl = await fileServiceClient.uploadFile(
            fileBuffer, 
            fileInfo.originalName, 
            fileInfo.mimetype
        );
        console.log("Đã lưu file thành công trên Java! Link URL:", fileUrl);
        // ======================================================

        // 8. Lưu thông tin bản quyền vào database
        const { title, author, description, category } = req.body;
        
        // Get owner information from authenticated user (JWT token)
        // Priority: req.user (from JWT) > account (blockchain)
        const ownerAddress = req.user?.userId || req.user?.username || account.address;
        const ownerUsername = req.user?.username || null;
        const ownerEmail = req.user?.email || null;
        
        console.log('Creating copyright with owner info:', {
            ownerAddress,
            ownerUsername,
            ownerEmail
        });
        
        const newCopyright = await Copyright.create({
            filename: fileInfo.originalName,
            storedFilename: fileUrl, // <--- CẬP NHẬT: Lưu URL của Java trả về
            hash: hash,
            contentHash: contentHash,
            ownerAddress: ownerAddress,
            ownerUsername: ownerUsername,
            ownerEmail: ownerEmail,
            transactionHash: transactionHash ? String(transactionHash) : null,
            fileSize: fileInfo.size,
            mimeType: fileInfo.mimetype,
            title: title,
            author: author,
            description: description,
            category: category
        });

        // 9. Lưu thông tin tương đồng nếu có
        if (similarityResult?.similarDocuments?.length > 0) {
            await Promise.all(
                similarityResult.similarDocuments.map(doc => 
                    DocumentSimilarity.create({
                        sourceDocumentId: newCopyright.id,
                        targetDocumentId: doc.id,
                        similarityScore: doc.similarityScore,
                        matchedSections: doc.matchedSections || []
                    })
                )
            );
        }

        // 10. Đồng bộ hóa với các dịch vụ khác
        const syncResult = await dataSynchronizer.syncCopyrightRegistration({
            id: newCopyright.id,
            filename: newCopyright.filename,
            hash: newCopyright.hash,
            contentHash: newCopyright.contentHash,
            ownerAddress: newCopyright.ownerAddress,
            transactionHash: newCopyright.transactionHash,
            fileSize: newCopyright.fileSize,
            mimeType: newCopyright.mimeType,
            similarityChecked: true,
            similarDocuments: similarityResult?.similarDocuments || []
        });

        // 🔥 GỬI THÔNG BÁO REALTIME QUA KAFKA 🔥
        if (req.notifier) {
            await req.notifier.sendNotification({
                recipientUserId: ownerAddress,
                type: 'COPYRIGHT_SUCCESS',
                content: transactionHash 
                    ? `Tài liệu "${fileInfo.originalName}" đã đăng ký bản quyền thành công và xác nhận trên blockchain.`
                    : `Tài liệu "${fileInfo.originalName}" đã đăng ký thành công.`
            });
        }

        // 11. Dọn dẹp file rác ở ổ cứng Node.js vì Java đã giữ file thật
        if (fileInfo?.path) {
            await fileService.cleanupFile(fileInfo.path);
        }

        // 12. Trả về kết quả thành công
        return res.status(201).json(ApiResponse.success(
            transactionHash 
                ? 'Đăng ký bản quyền thành công và đã được xác nhận trên blockchain.'
                : 'Đăng ký bản quyền thành công nhưng chưa được xác nhận trên blockchain.',
            {
                copyright: {
                    id: newCopyright.id,
                    filename: newCopyright.filename,
                    hash: newCopyright.hash,
                    contentHash: newCopyright.contentHash,
                    ownerAddress: newCopyright.ownerAddress,
                    transactionHash: newCopyright.transactionHash,
                    fileSize: newCopyright.fileSize,
                    mimeType: newCopyright.mimeType,
                    createdAt: newCopyright.createdAt
                },
                similarityInfo: similarityResult || { isSimilar: false },
                syncStatus: syncResult
            }
        ));

    } catch (error) {
        console.error('Lỗi khi xử lý đăng ký bản quyền:', error);
        
        // Dọn dẹp file tạm nếu có lỗi
        if (fileInfo?.path) {
            await fileService.cleanupFile(fileInfo.path);
        }
        
        // Return appropriate error response
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw new AppException(`Tài liệu đã tồn tại trong hệ thống: ${error.errors?.map(e => e.message).join(', ')}`, 409);
        }
        
        // Handle blockchain errors
        if (error.message && (error.message.includes('blockchain') || error.message.includes('transaction'))) {
            throw new AppException('Lỗi kết nối đến mạng blockchain. Vui lòng thử lại sau.', 502);
        }
        
        throw error; // Let globalExceptionHandler handle other errors
    }
});

// READ: Get all copyrights with filtering and pagination
const getAllCopyrights = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        category, 
        ownerAddress,
        verified,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    } = req.query;
    
    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (ownerAddress) where.ownerAddress = ownerAddress;
    if (verified !== undefined) {
        where.transactionHash = verified === 'true' ? { [Op.not]: null } : null;
    }
    
    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch copyrights with pagination
    const { count, rows } = await Copyright.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        attributes: { exclude: ['storedFilename'] } // Don't expose internal file paths
    });
    
    res.status(200).json(ApiResponse.success("Lấy danh sách thành công", {
        items: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit))
        }
    }));
});

// READ: Get a single copyright by ID
const getCopyrightById = asyncHandler(async (req, res) => {
    const copyright = await Copyright.findByPk(req.params.id);
    if (copyright) {
        res.status(200).json(ApiResponse.success(copyright));
    } else {
        throw new AppException('Copyright not found.', 404);
    }
});

// UPDATE: Update a copyright's filename
const updateCopyright = asyncHandler(async (req, res) => {
    const copyright = await Copyright.findByPk(req.params.id);
    if (!copyright) {
        throw new AppException('Copyright not found.', 404);
    }
    
    const { filename, title, author, description, category } = req.body;
    
    if (filename) copyright.filename = filename;
    if (title) copyright.title = title;
    if (author) copyright.author = author;
    if (description) copyright.description = description;
    if (category) copyright.category = category;

    await copyright.save();
    
    res.status(200).json(ApiResponse.success("Cập nhật thành công", copyright));
});

// DELETE: Delete a copyright
const deleteCopyright = asyncHandler(async (req, res) => {
    const copyright = await Copyright.findByPk(req.params.id);
    if (!copyright) {
        throw new AppException('Copyright not found.', 404);
    }
    await copyright.destroy();
    res.status(200).json(ApiResponse.success("Xóa thành công"));
});

// DOWNLOAD: Download/view document file
// CẬP NHẬT: Hỗ trợ URL từ Java File Service (Cloudinary)
const downloadDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    console.log('Download request for document ID:', id);
    
    // Find document
    const copyright = await Copyright.findByPk(id);
    
    if (!copyright) {
        console.log('Document not found:', id);
        throw new AppException('Không tìm thấy tài liệu', 404);
    }
    
    console.log('Document found:', {
        id: copyright.id,
        filename: copyright.filename,
        storedFilename: copyright.storedFilename,
        mimeType: copyright.mimeType
    });
    
    if (!copyright.storedFilename) {
        console.log('No storedFilename for document:', id);
        throw new AppException('File không tồn tại trên hệ thống', 404);
    }
    
    // NẾU LÀ LINK TỪ JAVA CLOUDINARY (bắt đầu bằng http hoặc https) -> Chuyển hướng trình duyệt
    if (copyright.storedFilename.startsWith('http')) {
        console.log('Redirecting to external URL:', copyright.storedFilename);
        return res.redirect(copyright.storedFilename);
    }
    
    // NẾU LÀ FILE LOCAL CŨ (Giữ nguyên logic cũ của bạn để tương thích ngược)
    const path = require('path');
    const fsSync = require('fs');
    const fsPromises = require('fs').promises;
    const filePath = path.join(__dirname, '../../uploads', copyright.storedFilename);
    
    console.log('Attempting to read local file from:', filePath);
    
    // Check if file exists
    try {
        await fsPromises.access(filePath);
        const stats = await fsPromises.stat(filePath);
        console.log('File found, size:', stats.size, 'bytes');
    } catch (err) {
        console.error('File not found or inaccessible:', filePath);
        throw new AppException('File không tồn tại trên server: ' + err.message, 404);
    }
    
    let contentType = copyright.mimeType;
    
    if (!contentType || contentType === 'application/octet-stream') {
        const ext = path.extname(copyright.filename).toLowerCase();
        const mimeMap = {
            '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
            '.txt': 'text/plain', '.html': 'text/html', '.htm': 'text/html',
            '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        contentType = mimeMap[ext] || contentType || 'application/octet-stream';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(copyright.filename)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    const fileStream = fsSync.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
        if (!res.headersSent) {
            res.status(500).json(ApiResponse.error('Lỗi khi đọc file', error.message));
        }
    });
    
    fileStream.pipe(res);
});

const checkSimilarity = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppException('Vui lòng tải lên một tệp để kiểm tra', 400);
    }

    try {
        console.log(`Bắt đầu kiểm tra tương đồng cho file: ${req.file.originalname}`);
        
        // Lấy tất cả tài liệu hiện có để kiểm tra (tăng limit để kiểm tra nhiều hơn)
        const existingDocuments = await Copyright.findAll({
            where: {
                storedFilename: { [Op.not]: null }
            },
            order: [['createdAt', 'DESC']], // Ưu tiên kiểm tra các tài liệu mới nhất
            limit: 200 // Tăng số lượng tài liệu kiểm tra
        });

        if (existingDocuments.length === 0) {
            console.log('Không có tài liệu nào trong cơ sở dữ liệu để so sánh');
            return res.status(200).json(ApiResponse.success('Không có tài liệu nào trong cơ sở dữ liệu để so sánh', {
                similarityInfo: {
                    isSimilar: false,
                    similarDocuments: [],
                    totalDocumentsChecked: 0,
                    message: 'Không có tài liệu nào để so sánh'
                }
            }));
        }

        console.log(`Bắt đầu kiểm tra tương đồng với ${existingDocuments.length} tài liệu...`);
        
        // Kiểm tra nội dung
        const startTime = Date.now();
        const similarityResult = await similarityService.checkSimilarity(req.file.path, existingDocuments);
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`Hoàn thành kiểm tra trong ${processingTime} giây`);
        
        // Chuẩn bị phản hồi với thông tin chi tiết hơn
        const plagiarismLevel = _determinePlagiarismLevel(similarityResult.similarityScore);
        
        res.status(200).json(ApiResponse.success(
            similarityResult.isSimilar
                ? `Phát hiện nội dung tương tự (${(similarityResult.similarityScore * 100).toFixed(1)}%)`
                : 'Không tìm thấy nội dung tương tự',
            {
                similarityInfo: {
                    isSimilar: similarityResult.isSimilar,
                    similarityScore: similarityResult.similarityScore,
                    plagiarismLevel: plagiarismLevel.level,
                    plagiarismDescription: plagiarismLevel.description,
                    similarDocuments: await Promise.all(similarityResult.similarDocuments.map(async (doc) => {
                        // Get full document info from database to include owner details
                        let fullDoc = null;
                        try {
                            fullDoc = await Copyright.findByPk(doc.id);
                        } catch (err) {
                            console.warn(`Could not fetch document ${doc.id}:`, err.message);
                        }
                        
                        return {
                            id: doc.id,
                            filename: doc.filename,
                            similarityScore: doc.similarityScore,
                            similarityPercentage: (doc.similarityScore * 100).toFixed(1),
                            owner: fullDoc?.ownerUsername || fullDoc?.ownerEmail || fullDoc?.ownerAddress || 'Không xác định',
                            ownerUsername: fullDoc?.ownerUsername,
                            ownerEmail: fullDoc?.ownerEmail,
                            ownerAddress: fullDoc?.ownerAddress,
                            createdAt: fullDoc?.createdAt || null,
                            matchedSections: doc.matchedSections || [],
                            matchedSectionsCount: (doc.matchedSections || []).length,
                            details: {
                                ...doc.details,
                                plagiarismRisk: _getPlagiarismRisk(doc.similarityScore)
                            }
                        };
                    })),
                    threshold: similarityService.similarityThreshold,
                    warnThreshold: similarityService.warnThreshold,
                    totalDocumentsChecked: existingDocuments.length,
                    totalSimilarFound: similarityResult.similarDocuments.length,
                    message: similarityResult.isSimilar
                        ? `Phát hiện ${similarityResult.similarDocuments.length} tài liệu có độ tương đồng ${(similarityResult.similarityScore * 100).toFixed(1)}%`
                        : 'Không tìm thấy nội dung tương tự đáng kể'
                },
                filePath: req.file.path
            }
        ));

    } finally {
        // Clean up uploaded file since this is just a check
        fileService.cleanupFile(req.file.path);
    }
});

// SEARCH: Find copyrights by criteria
const searchCopyrights = asyncHandler(async (req, res) => {
    const { filename, hash, ownerAddress } = req.query;
    const where = {};
    if (filename) where.filename = { [Op.iLike]: `%${filename}%` };
    if (hash) where.hash = hash;
    if (ownerAddress) where.ownerAddress = ownerAddress;

    const copyrights = await Copyright.findAll({ where });
    res.status(200).json(ApiResponse.success(copyrights));
});

// READ: Get a single copyright by its hash
const getCopyrightByHash = asyncHandler(async (req, res) => {
    const copyright = await Copyright.findOne({ where: { hash: req.params.hash } });
    if (copyright) {
        res.status(200).json(ApiResponse.success(copyright));
    } else {
        throw new AppException('Copyright not found for the given hash.', 404);
    }
});

// VERIFY: Verify copyright on the blockchain
const verifyCopyright = asyncHandler(async (req, res) => {
    const copyright = await Copyright.findByPk(req.params.id);
    if (!copyright) {
        throw new AppException('Copyright not found in database.', 404);
    }

    const chainInfo = await blockchainService.getDocumentInfoFromChain(copyright.hash);

    if (!chainInfo) {
        throw new AppException('Copyright hash not found on the blockchain.', 404);
    }

    const isOwnerMatch = chainInfo.owner.toLowerCase() === copyright.ownerAddress.toLowerCase();

    res.status(200).json(ApiResponse.success('Verification result', {
        verified: true,
        onChainOwner: chainInfo.owner,
        dbOwner: copyright.ownerAddress,
        isOwnerMatch: isOwnerMatch,
        registeredAt: new Date(Number(chainInfo.timestamp) * 1000).toISOString(),
    }));
});

// STATS: Get copyright statistics
const getCopyrightStats = asyncHandler(async (req, res) => {
    // Total documents
    const totalDocuments = await Copyright.count();
    
    // Total verified (documents with transactionHash)
    const totalVerified = await Copyright.count({
        where: {
            transactionHash: { [Op.not]: null }
        }
    });
    
    // Total unique owners
    const owners = await Copyright.findAll({
        attributes: [[Copyright.sequelize.fn('DISTINCT', Copyright.sequelize.col('ownerAddress')), 'ownerAddress']],
        raw: true
    });
    const totalOwners = owners.length;
    
    // Contract balance (mock for now, would need blockchain integration)
    const contractBalance = '0.5';
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await Copyright.count({
        where: {
            createdAt: { [Op.gte]: sevenDaysAgo }
        }
    });
    
    res.status(200).json(ApiResponse.success({
        totalDocuments,
        totalVerified,
        totalOwners,
        contractBalance,
        recentRegistrations,
        verificationRate: totalDocuments > 0 ? ((totalVerified / totalDocuments) * 100).toFixed(1) : 0
    }));
});


// GET: Get documents by owner address
const getCopyrightsByOwner = asyncHandler(async (req, res) => {
    const { ownerAddress } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    if (!ownerAddress) {
        throw new AppException('Owner address is required', 400);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Copyright.findAndCountAll({
        where: { ownerAddress },
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        attributes: { exclude: ['storedFilename'] }
    });
    
    res.status(200).json(ApiResponse.success("Lấy danh sách thành công", {
        items: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit))
        }
    }));
});

// ANALYTICS: Get analytics data for dashboard
const getAnalytics = asyncHandler(async (req, res) => {
    // Category distribution
    const categoryDistribution = await Copyright.findAll({
        attributes: [
            'category',
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        raw: true
    });
    
    // Registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const registrationTrends = await Copyright.findAll({
        attributes: [
            [Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt')), 'date'],
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'count']
        ],
        where: {
            createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        group: [Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt'))],
        order: [[Copyright.sequelize.fn('DATE', Copyright.sequelize.col('createdAt')), 'ASC']],
        raw: true
    });
    
    // Top authors (most registered documents)
    const topAuthors = await Copyright.findAll({
        attributes: [
            'ownerAddress',
            'author',
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'documentCount']
        ],
        group: ['ownerAddress', 'author'],
        order: [[Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
    });
    
    // Monthly registration stats
    const monthlyStats = await Copyright.findAll({
        attributes: [
            [Copyright.sequelize.fn('DATE_TRUNC', 'month', Copyright.sequelize.col('createdAt')), 'month'],
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'count']
        ],
        group: [Copyright.sequelize.fn('DATE_TRUNC', 'month', Copyright.sequelize.col('createdAt'))],
        order: [[Copyright.sequelize.fn('DATE_TRUNC', 'month', Copyright.sequelize.col('createdAt')), 'DESC']],
        limit: 12,
        raw: true
    });
    
    // File type distribution
    const fileTypeDistribution = await Copyright.findAll({
        attributes: [
            'mimeType',
            [Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'count']
        ],
        group: ['mimeType'],
        order: [[Copyright.sequelize.fn('COUNT', Copyright.sequelize.col('id')), 'DESC']],
        raw: true
    });
    
    res.status(200).json(ApiResponse.success({
        categoryDistribution,
        registrationTrends,
        topAuthors,
        monthlyStats,
        fileTypeDistribution
    }));
});

// RECENT: Get recent documents
const getRecentCopyrights = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const copyrights = await Copyright.findAll({
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['storedFilename'] }
    });
    
    res.status(200).json(ApiResponse.success(copyrights));
});

// BLOCKCHAIN STATUS: Check blockchain connection and network info
const getBlockchainStatus = asyncHandler(async (req, res) => {
    const isConnected = await blockchainService.checkBlockchainConnection();
    
    let networkInfo = null;
    if (isConnected) {
        try {
            const { web3, account } = require('../config/web3');
            const blockNumber = await web3.eth.getBlockNumber();
            const chainId = await web3.eth.getChainId();
            const gasPrice = await web3.eth.getGasPrice();
            const balance = await web3.eth.getBalance(account.address);
            
            networkInfo = {
                blockNumber: blockNumber.toString(),
                chainId: chainId.toString(),
                gasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
                accountBalance: web3.utils.fromWei(balance, 'ether') + ' ETH',
                accountAddress: account.address,
                providerUrl: process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545'
            };
        } catch (err) {
            console.error('Error getting network info:', err);
        }
    }
    
    res.status(200).json(ApiResponse.success(
        isConnected ? 'Kết nối blockchain thành công' : 'Không thể kết nối đến blockchain',
        {
            connected: isConnected,
            network: networkInfo
        }
    ));
});

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
    getCopyrightsByOwner,
    getAnalytics,
    getRecentCopyrights,
    downloadDocument,
    getBlockchainStatus
};

// Helper function to determine plagiarism level
function _determinePlagiarismLevel(score) {
    if (score >= 0.9) {
        return {
            level: 'CRITICAL',
            description: 'Rất cao - Có khả năng đạo văn nghiêm trọng (>90%)'
        };
    } else if (score >= 0.7) {
        return {
            level: 'HIGH',
            description: 'Cao - Có dấu hiệu đạo văn (70-90%)'
        };
    } else if (score >= 0.5) {
        return {
            level: 'MEDIUM',
            description: 'Trung bình - Cần kiểm tra và trích dẫn nguồn (50-70%)'
        };
    } else if (score >= 0.3) {
        return {
            level: 'LOW',
            description: 'Thấp - Có thể là trùng hợp ngẫu nhiên (30-50%)'
        };
    } else {
        return {
            level: 'NONE',
            description: 'Không đáng kể - Tài liệu có tính độc đáo (<30%)'
        };
    }
}

// Helper function to get plagiarism risk for individual document
function _getPlagiarismRisk(score) {
    if (score >= 0.9) return 'Rất cao';
    if (score >= 0.7) return 'Cao';
    if (score >= 0.5) return 'Trung bình';
    if (score >= 0.3) return 'Thấp';
    return 'Không đáng kể';
}