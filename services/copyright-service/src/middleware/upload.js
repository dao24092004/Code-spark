const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer with disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Create directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err, uploadDir));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const filetypes = /jpe?g|png|pdf|docx?|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG), PDF, Word và text!'));
    }
};

// Create multer instance
// Increased file size limit to 100MB for larger documents
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: fileFilter
});

// Middleware to handle single file upload
const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const uploadSingleFile = upload.single(fieldName);
        
        uploadSingleFile(req, res, function(err) {
            if (err) {
                // Handle different types of errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: `Kích thước file quá lớn (tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB)`
                    });
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        message: `Vui lòng tải lên file với tên trường là '${fieldName}'`
                    });
                } else if (err.message.includes('Chỉ chấp nhận')) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tải lên file: ' + err.message
                });
            }
            
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn file để tải lên'
                });
            }
            
            next();
        });
    };
};

// Export middleware for different field names
module.exports = {
    uploadFile: uploadSingle('file'),
    uploadDocument: uploadSingle('document')
};
