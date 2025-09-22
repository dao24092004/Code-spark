const crypto = require('crypto');
const fs = require('fs');

const calculateHash = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

const cleanupFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

module.exports = {
    calculateHash,
    cleanupFile,
};