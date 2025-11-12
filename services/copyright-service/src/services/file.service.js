const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const Copyright = require('../models/copyright.model');

// Directory to store uploaded files
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
const ensureUploadDir = async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
};

// Calculate SHA-256 hash of file content
const calculateHash = async (filePath) => {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Calculate MD5 hash of file content (for quick comparison)
const calculateContentHash = async (filePath) => {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
};

// Check for duplicate content in the database
const findDuplicateByContent = async (filePath) => {
    try {
        const contentHash = await calculateContentHash(filePath);
        
        // Check if a document with the same content hash exists
        const existingDoc = await Copyright.findOne({
            where: { contentHash }
        });

        if (existingDoc) {
            return {
                isDuplicate: true,
                existingDoc,
                contentHash,
                message: 'Document with identical content already exists'
            };
        }

        return { isDuplicate: false, contentHash };
    } catch (error) {
        console.error('Error checking for duplicate content:', error);
        throw error;
    }
};

/**
 * Save uploaded file with unique name
 * @param {Object} file - Multer file object (from memory storage)
 * @returns {Object} File information
 */
const saveUploadedFile = async (file) => {
    if (!file) {
        throw new Error('Không có file được tải lên');
    }

    try {
        const uploadDir = await ensureUploadDir();
        
        // Get file extension from original name or mimetype
        let ext = path.extname(file.originalname).toLowerCase();
        if (!ext) {
            // If no extension, try to determine from mimetype
            const mimeToExt = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'application/pdf': '.pdf',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'text/plain': '.txt'
            };
            ext = mimeToExt[file.mimetype] || '';
        }
        
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        
        // Ensure we have buffer data
        if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
            throw new Error('Dữ liệu file không hợp lệ (buffer rỗng hoặc không đúng định dạng)');
        }
        
        // Write buffer to file
        await fs.writeFile(filePath, file.buffer);
        
        // Verify file was written
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            await fs.unlink(filePath).catch(console.error);
            throw new Error('Không thể ghi file (kích thước file bằng 0)');
        }
        
        return {
            originalName: file.originalname,
            storedName: uniqueName,
            path: filePath,
            size: file.size,
            mimetype: file.mimetype,
            extension: ext
        };
    } catch (error) {
        console.error('Lỗi khi lưu file:', error);
        throw new Error(`Không thể lưu file: ${error.message}`);
    }
};

// Clean up temporary files
const cleanupFile = async (filePath) => {
    try {
        if (filePath && await fs.access(filePath).then(() => true).catch(() => false)) {
            await fs.unlink(filePath);
        }
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
};

module.exports = {
    calculateHash,
    calculateContentHash,
    findDuplicateByContent,
    saveUploadedFile,
    cleanupFile,
    UPLOAD_DIR
};