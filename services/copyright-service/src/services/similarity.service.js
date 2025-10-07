const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class SimilarityService {
    constructor() {
        this.similarityThreshold = 0.8; // 80% similarity threshold
        this.textCache = new Map(); // Cache for extracted text
        this.cacheMaxSize = 1000; // Maximum cache entries
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    /**
     * Calculate similarity between two texts using cosine similarity
     */
    calculateSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;

        // Convert to lowercase and remove extra spaces
        const cleanText1 = this.cleanText(text1);
        const cleanText2 = this.cleanText(text2);

        if (cleanText1.length === 0 || cleanText2.length === 0) return 0;

        // Create word frequency maps
        const wordFreq1 = this.getWordFrequency(cleanText1);
        const wordFreq2 = this.getWordFrequency(cleanText2);

        // Calculate cosine similarity
        return this.cosineSimilarity(wordFreq1, wordFreq2);
    }

    /**
     * Clean text by removing punctuation, extra spaces, and converting to lowercase
     */
    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
            .trim();
    }

    /**
     * Get word frequency map from text
     */
    getWordFrequency(text) {
        const words = text.split(' ');
        const frequency = {};

        words.forEach(word => {
            if (word.length > 2) { // Ignore words shorter than 3 characters
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        return frequency;
    }

    /**
     * Calculate cosine similarity between two word frequency maps
     */
    cosineSimilarity(freq1, freq2) {
        const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (const word of allWords) {
            const freqA = freq1[word] || 0;
            const freqB = freq2[word] || 0;

            dotProduct += freqA * freqB;
            magnitude1 += freqA * freqA;
            magnitude2 += freqB * freqB;
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Get cached text or extract new one
     */
    async getCachedText(filePath) {
        const cacheKey = this.getCacheKey(filePath);

        // Check if cached and not expired
        if (this.textCache.has(cacheKey)) {
            const cached = this.textCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.text;
            } else {
                // Expired, remove from cache
                this.textCache.delete(cacheKey);
            }
        }

        // Extract text
        const text = await this.extractTextFromFile(filePath);

        // Cache the result
        this.textCache.set(cacheKey, {
            text: text,
            timestamp: Date.now()
        });

        // Manage cache size
        this.manageCacheSize();

        return text;
    }

    /**
     * Generate cache key for file path
     */
    getCacheKey(filePath) {
        // Use file path and modification time as cache key
        const stats = fs.statSync(filePath);
        return `${filePath}:${stats.mtime.getTime()}`;
    }

    /**
     * Manage cache size to prevent memory overflow
     */
    manageCacheSize() {
        if (this.textCache.size > this.cacheMaxSize) {
            // Remove oldest entries (simple LRU)
            const entries = Array.from(this.textCache.entries());
            const toRemove = entries.slice(0, Math.floor(this.cacheMaxSize * 0.1));

            for (const [key] of toRemove) {
                this.textCache.delete(key);
            }
        }
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.textCache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.textCache.delete(key);
            }
        }
    }

    /**
     * Extract text content from different file types
     */
    async extractTextFromFile(filePath) {
        const extension = path.extname(filePath).toLowerCase();

        try {
            if (extension === '.pdf') {
                return await this.extractTextFromPDF(filePath);
            } else if (extension === '.docx') {
                return await this.extractTextFromDocx(filePath);
            } else if (extension === '.txt') {
                return await this.extractTextFromTxt(filePath);
            } else {
                // For other file types, return empty string (can't extract text)
                return '';
            }
        } catch (error) {
            console.error('Error extracting text from file:', error);
            return '';
        }
    }

    /**
     * Extract text from PDF file
     */
    async extractTextFromPDF(filePath) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }

    /**
     * Extract text from DOCX file
     */
    async extractTextFromDocx(filePath) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }

    /**
     * Extract text from TXT file
     */
    async extractTextFromTxt(filePath) {
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * Smart filtering to reduce number of comparisons
     */
    filterDocumentsForComparison(uploadedFilePath, existingDocuments) {
        const uploadedFileName = path.basename(uploadedFilePath).toLowerCase();
        const uploadedFileExt = path.extname(uploadedFilePath).toLowerCase();
        const uploadedFileSize = fs.statSync(uploadedFilePath).size;

        return existingDocuments.filter(doc => {
            // Filter 1: Same file extension (PDF vs DOCX vs TXT)
            if (path.extname(doc.storedFilename).toLowerCase() !== uploadedFileExt) {
                return false;
            }

            // Filter 2: File size within 50% range (avoid comparing very different sizes)
            const existingFilePath = path.join('uploads', doc.storedFilename);
            if (fs.existsSync(existingFilePath)) {
                const existingFileSize = fs.statSync(existingFilePath).size;
                const sizeRatio = Math.max(uploadedFileSize, existingFileSize) / Math.min(uploadedFileSize, existingFileSize);

                // If files are too different in size, skip comparison
                if (sizeRatio > 2.0) {
                    return false;
                }
            }

            // Filter 3: File name similarity (basic keyword matching)
            const existingFileName = path.basename(doc.storedFilename).toLowerCase();
            const nameSimilarity = this.calculateNameSimilarity(uploadedFileName, existingFileName);

            // Only compare if names have some similarity
            return nameSimilarity > 0.3;
        }).sort((a, b) => {
            // Sort by file size similarity (closest first)
            const sizeA = fs.statSync(path.join('uploads', a.storedFilename)).size;
            const sizeB = fs.statSync(path.join('uploads', b.storedFilename)).size;
            const sizeDiffA = Math.abs(uploadedFileSize - sizeA);
            const sizeDiffB = Math.abs(uploadedFileSize - sizeB);

            return sizeDiffA - sizeDiffB;
        }).slice(0, 50); // Limit to top 50 candidates
    }

    /**
     * Check if uploaded content is similar to existing documents
     */
    async checkSimilarity(filePath, existingDocuments) {
        try {
            const uploadedText = await this.getCachedText(filePath);

            if (!uploadedText) {
                return {
                    isSimilar: false,
                    similarDocuments: [],
                    similarityScore: 0
                };
            }

            // Apply smart filtering to reduce comparisons
            const filteredDocuments = this.filterDocumentsForComparison(filePath, existingDocuments);

            const similarDocuments = [];

            for (const doc of filteredDocuments) {
                // For existing documents without storedFilename, we can't check similarity
                if (!doc.storedFilename) continue;

                const existingFilePath = path.join('uploads', doc.storedFilename);
                if (!fs.existsSync(existingFilePath)) continue;

                const existingText = await this.getCachedText(existingFilePath);
                const similarity = this.calculateSimilarity(uploadedText, existingText);

                if (similarity >= this.similarityThreshold) {
                    similarDocuments.push({
                        id: doc.id,
                        filename: doc.filename,
                        similarityScore: Math.round(similarity * 100) / 100, // Round to 2 decimal places
                        ownerAddress: doc.ownerAddress
                    });
                }
            }

            return {
                isSimilar: similarDocuments.length > 0,
                similarDocuments: similarDocuments,
                similarityScore: similarDocuments.length > 0 ? similarDocuments[0].similarityScore : 0,
                totalDocumentsChecked: filteredDocuments.length,
                totalDocumentsSkipped: existingDocuments.length - filteredDocuments.length
            };

        } catch (error) {
            console.error('Error checking similarity:', error);
            return {
                isSimilar: false,
                similarDocuments: [],
                similarityScore: 0
            };
        }
    }
}

module.exports = new SimilarityService();
