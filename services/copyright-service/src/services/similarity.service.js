// similarityService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const { PorterStemmer, WordTokenizer } = natural;
const stopwords = new Set(require('natural').stopwords);
const { LRUCache } = require('lru-cache');

// Get absolute upload directory path
const getUploadDir = () => {
  return path.join(__dirname, '../../uploads');
};

// Simple concurrency limiter
class ConcurrencyLimiter {
    constructor(concurrency) {
        this.queue = [];
        this.active = 0;
        this.concurrency = concurrency;
    }

    async run(fn) {
        return new Promise((resolve, reject) => {
            const execute = async () => {
                this.active++;
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.active--;
                    this.next();
                }
            };

            if (this.active < this.concurrency) {
                execute();
            } else {
                this.queue.push(execute);
            }
        });
    }

    next() {
        if (this.queue.length > 0 && this.active < this.concurrency) {
            const nextFn = this.queue.shift();
            nextFn();
        }
    }
}

// Create a concurrency limiter with max 5 concurrent operations
const CONCURRENCY_LIMIT = new ConcurrencyLimiter(5);

/**
 * @typedef {Object} ExistingDoc
 * @property {string} id
 * @property {string} filename
 * @property {string} storedFilename
 * @property {string} [ownerAddress]
 *
 * @typedef {Object} SimilarDoc
 * @property {string} id
 * @property {string} filename
 * @property {number} similarityScore
 * @property {string[]} matchedSections
 * @property {Object} details
 *
 * @typedef {Object} SimilarityReport
 * @property {boolean} isSimilar
 * @property {number} similarityScore
 * @property {SimilarDoc[]} similarDocuments
 * @property {number} totalChecked
 * @property {number} totalSkipped
 * @property {string} message
 */

class SimilarityService {
  /**
   * @param {Object} [options]
   * @param {number} [options.threshold=0.70]
   * @param {number} [options.warnThreshold=0.50]
   * @param {number} [options.shingleSize=3]
   * @param {number} [options.maxCandidates=50]
   * @param {string} [options.uploadDir='uploads']
   * @param {number} [options.cacheMax=1000]
   * @param {number} [options.cacheTTL=24*60*60*1000]
   */
  constructor(options = {}) {
    this.threshold = options.threshold ?? 0.70;
    this.warnThreshold = options.warnThreshold ?? 0.50;
    this.shingleSize = options.shingleSize ?? 3;
    this.maxCandidates = options.maxCandidates ?? 50;
    // Use absolute path for upload directory
    this.uploadDir = options.uploadDir ? 
      (path.isAbsolute(options.uploadDir) ? options.uploadDir : path.join(__dirname, '../../', options.uploadDir)) :
      getUploadDir();

    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    
    // Initialize the concurrency limiter
    this.concurrencyLimiter = new ConcurrencyLimiter(5);

    // Từ đồng nghĩa (có thể mở rộng) - Vietnamese synonyms
    this.synonyms = new Map(
      Object.entries({
        'học sinh': ['sinh viên', 'học trò', 'học viên', 'student'],
        'giáo viên': ['thầy giáo', 'cô giáo', 'giảng viên', 'teacher', 'instructor'],
        'trường học': ['trường', 'học viện', 'đại học', 'university', 'school'],
        'tài liệu': ['document', 'file', 'văn bản', 'bài viết'],
        'nghiên cứu': ['research', 'study', 'khảo sát', 'điều tra'],
        'phương pháp': ['method', 'cách', 'kỹ thuật', 'technique'],
        'kết quả': ['result', 'outcome', 'kết luận'],
        'phân tích': ['analysis', 'analyze', 'đánh giá'],
        'ứng dụng': ['application', 'app', 'chương trình'],
        'hệ thống': ['system', 'platform', 'nền tảng'],
      }).map(([k, v]) => [k, new Set(v)])
    );

    // Cache: key = contentHash, value = { text, timestamp }
    this.cache = new LRUCache({
      max: options.cacheMax ?? 1000,
      ttl: options.cacheTTL ?? 24 * 60 * 60 * 1000,
    });
  }

  // ==================================================================
  // PUBLIC API
  // ==================================================================

  /**
   * Kiểm tra file mới có giống với tài liệu nào trong hệ thống không
   * @param {string} filePath
   * @param {ExistingDoc[]} existingDocs
   * @returns {Promise<SimilarityReport>}
   */
  async checkSimilarity(filePath, existingDocs) {
    try {
      const { text: newText, hash: newHash } = await this._extractAndCache(filePath);
      if (!newText || newText.trim().length < 30) {
        return this._failReport('Tài liệu quá ngắn hoặc không thể đọc nội dung');
      }

      // Bước 1: Kiểm tra 100% trùng (hash)
      const exactMatch = existingDocs.find(doc => {
        const cached = this.cache.get(this._hashKey(doc.storedFilename));
        return cached?.hash === newHash;
      });
      if (exactMatch) {
        return this._exactMatchReport(exactMatch, newHash);
      }

      const preprocessed = this._preprocess(newText);
      if (preprocessed.length === 0) {
        return this._failReport('Không tìm thấy từ khóa hợp lệ sau khi làm sạch');
      }

      // Kiểm tra với tất cả tài liệu, không chỉ filter candidates
      // Vì filter có thể bỏ sót các tài liệu tương tự
      let candidates = this._filterCandidates(filePath, existingDocs);
      
      // Nếu filter quá ít candidates, kiểm tra thêm các tài liệu khác
      if (candidates.length < 20 && existingDocs.length > candidates.length) {
        const remaining = existingDocs.filter(doc => 
          !candidates.some(c => c.id === doc.id)
        );
        // Thêm một số tài liệu ngẫu nhiên để kiểm tra (ưu tiên các tài liệu gần đây)
        const additional = remaining.slice(0, Math.min(50, remaining.length));
        candidates = [...candidates, ...additional];
      }
      
      console.log(`Kiểm tra với ${candidates.length} tài liệu candidates từ ${existingDocs.length} tài liệu tổng cộng`);
      const similarDocs = [];

      const jobs = candidates.map(doc => this.concurrencyLimiter.run(async () => {
        const docPath = path.join(this.uploadDir, doc.storedFilename);
        
        // Kiểm tra file có tồn tại không
        try {
          await fs.access(docPath);
        } catch (err) {
          console.warn(`File không tồn tại: ${docPath}, bỏ qua tài liệu ${doc.id}`);
          return null;
        }
        
        const { text: docText } = await this._extractAndCache(docPath);
        if (!docText) return null;

        const docPrep = this._preprocess(docText);
        if (docPrep.length === 0) return null;

        const scores = this._computeAllScores(preprocessed, docPrep);
        const combined = this._combineScores(scores, preprocessed.length, docPrep.length);

        if (combined >= this.warnThreshold) {
          const sections = this._findMatchingSections(preprocessed, docPrep);
          return {
            id: doc.id,
            filename: doc.filename,
            similarityScore: Number(combined.toFixed(4)),
            matchedSections: sections,
            details: scores,
          };
        }
        return null;
      }));

      const results = (await Promise.all(jobs)).filter(Boolean);
      
      // If no results but we have candidates, return a no-match report
      if (results.length === 0 && candidates.length > 0) {
        return {
          isSimilar: false,
          similarityScore: 0,
          similarDocuments: [],
          totalChecked: candidates.length,
          totalSkipped: existingDocs.length - candidates.length,
          message: 'Không tìm thấy tài liệu tương tự'
        };
      }
      results.sort((a, b) => b.similarityScore - a.similarityScore);

      const maxScore = results[0]?.similarityScore ?? 0;
      
      // Nếu có bất kỳ tài liệu nào trong danh sách (đã vượt warnThreshold), coi như có tương đồng
      // Threshold chính chỉ dùng để phân loại mức độ nghiêm trọng
      const isSimilar = results.length > 0 && maxScore >= this.warnThreshold;
      
      // Nếu có tài liệu tương tự nhưng điểm số thấp hơn threshold chính, vẫn báo có tương đồng
      // nhưng với mức độ cảnh báo thấp hơn
      const isHighSimilarity = maxScore >= this.threshold;

      return {
        isSimilar,
        similarityScore: maxScore,
        similarDocuments: results.slice(0, 10), // Tăng số lượng tài liệu trả về
        totalChecked: candidates.length,
        totalSkipped: existingDocs.length - candidates.length,
        isHighSimilarity, // Thêm flag để phân biệt mức độ
        message: isSimilar
          ? isHighSimilarity
            ? `Phát hiện ${results.length} tài liệu tương tự (mức độ cao: ${(maxScore * 100).toFixed(1)}%)`
            : `Phát hiện ${results.length} tài liệu tương tự (mức độ trung bình: ${(maxScore * 100).toFixed(1)}%)`
          : 'Không tìm thấy nội dung tương tự',
      };
    } catch (error) {
      console.error('Lỗi kiểm tra tương đồng:', error);
      return this._failReport(error.message);
    }
  }

  // ==================================================================
  // INTERNAL: Extraction & Caching
  // ==================================================================

  async _extractAndCache(absPath) {
    const contentHash = await this._computeFileHash(absPath);
    const cacheKey = this._hashKey(contentHash);

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return { text: cached.text, hash: contentHash };
    }

    const text = await this._extractText(absPath);
    this.cache.set(cacheKey, { text, hash: contentHash, timestamp: Date.now() });
    return { text, hash: contentHash };
  }

  async _computeFileHash(filePath) {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  _hashKey(hash) {
    return `hash:${hash}`;
  }

  async _extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const buffer = await fs.readFile(filePath);

    try {
      switch (ext) {
        case '.pdf':
          const pdfData = await pdf(buffer);
          return pdfData.text || '';
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value || '';
        case '.doc':
          // For .doc files, try to extract as text (basic approach)
          // Note: For better .doc support, you might need a library like 'textract' or 'antiword'
          try {
            const text = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
            // Try to extract readable text from binary .doc
            return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
          } catch (e) {
            console.warn('Could not extract .doc file, trying basic text extraction');
            return '';
          }
        case '.txt':
        case '.rtf':
          return buffer.toString('utf8');
        case '.html':
        case '.htm':
          // Extract text from HTML (remove tags)
          const htmlText = buffer.toString('utf8');
          return htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        default:
          // Try to read as text for unknown formats
          try {
            return buffer.toString('utf8');
          } catch (e) {
            console.warn(`Unsupported file format: ${ext}`);
            return '';
          }
      }
    } catch (err) {
      console.error(`Lỗi trích xuất ${filePath}:`, err.message);
      return '';
    }
  }

  // ==================================================================
  // INTERNAL: Preprocessing
  // ==================================================================

  _preprocess(rawText) {
    if (!rawText) return [];

    // Step 1: Normalize Vietnamese text (keep diacritics for better accuracy)
    let cleaned = rawText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Remove punctuation but keep letters and numbers
      .replace(/\s+/g, ' ')
      .trim();

    // Step 2: Tokenize
    const tokens = this.tokenizer.tokenize(cleaned) || [];
    
    // Step 3: Filter and normalize
    return tokens
      .filter(t => {
        // Keep tokens with at least 2 characters
        if (t.length < 2) return false;
        // Remove common stopwords
        if (stopwords.has(t)) return false;
        // Remove pure numbers (unless they're part of important context)
        if (/^\d+$/.test(t) && t.length < 4) return false;
        return true;
      })
      .map(t => {
        // Apply synonym normalization
        for (const [base, set] of this.synonyms) {
          if (set.has(t)) return base;
        }
        // Stem the word for better matching
        return this.stemmer.stem(t);
      })
      .filter(t => t && t.length > 0);
  }

  // ==================================================================
  // INTERNAL: Scoring
  // ==================================================================

  _computeAllScores(tokensA, tokensB) {
    const freqA = this._buildFrequency(tokensA);
    const freqB = this._buildFrequency(tokensB);

    // Calculate multiple similarity metrics
    const cosine = this._cosine(freqA, freqB);
    const jaccard = this._jaccard(tokensA, tokensB);
    const lcs = this._lcsRatio(tokensA.join(' '), tokensB.join(' '));
    
    // Additional metrics for better plagiarism detection
    const ngram = this._ngramSimilarity(tokensA, tokensB);
    const tfidf = this._tfidfSimilarity(tokensA, tokensB, freqA, freqB);
    const wordOrder = this._wordOrderSimilarity(tokensA, tokensB);

    return {
      cosine,
      jaccard,
      lcs,
      ngram,
      tfidf,
      wordOrder,
    };
  }

  // N-gram similarity (for detecting copied phrases)
  _ngramSimilarity(tokensA, tokensB, n = 3) {
    const ngramsA = this._getNgrams(tokensA, n);
    const ngramsB = this._getNgrams(tokensB, n);
    
    if (ngramsA.size === 0 || ngramsB.size === 0) return 0;
    
    const intersection = new Set([...ngramsA].filter(x => ngramsB.has(x)));
    const union = new Set([...ngramsA, ...ngramsB]);
    
    return intersection.size / union.size;
  }

  _getNgrams(tokens, n) {
    const ngrams = new Set();
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.add(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  // TF-IDF based similarity
  _tfidfSimilarity(tokensA, tokensB, freqA, freqB) {
    // Simple TF-IDF implementation
    const allTerms = new Set([...freqA.keys(), ...freqB.keys()]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const term of allTerms) {
      const tfA = freqA.get(term) || 0;
      const tfB = freqB.get(term) || 0;
      
      // Simple IDF (inverse document frequency) - in real implementation, 
      // this would consider all documents in corpus
      const idf = 1; // Simplified for now
      
      const tfidfA = tfA * idf;
      const tfidfB = tfB * idf;
      
      dotProduct += tfidfA * tfidfB;
      normA += tfidfA * tfidfA;
      normB += tfidfB * tfidfB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Word order similarity (detects if words are in similar order)
  _wordOrderSimilarity(tokensA, tokensB) {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    
    // Create position maps
    const posA = new Map();
    const posB = new Map();
    
    tokensA.forEach((token, idx) => {
      if (!posA.has(token)) posA.set(token, []);
      posA.get(token).push(idx);
    });
    
    tokensB.forEach((token, idx) => {
      if (!posB.has(token)) posB.set(token, []);
      posB.get(token).push(idx);
    });
    
    // Calculate average position difference for common words
    const commonWords = new Set([...posA.keys()].filter(k => posB.has(k)));
    if (commonWords.size === 0) return 0;
    
    let totalDiff = 0;
    let count = 0;
    
    for (const word of commonWords) {
      const positionsA = posA.get(word);
      const positionsB = posB.get(word);
      const avgA = positionsA.reduce((a, b) => a + b, 0) / positionsA.length;
      const avgB = positionsB.reduce((a, b) => a + b, 0) / positionsB.length;
      totalDiff += Math.abs(avgA - avgB);
      count++;
    }
    
    const avgDiff = totalDiff / count;
    const maxLen = Math.max(tokensA.length, tokensB.length);
    
    // Normalize: similarity is higher when positions are closer
    return Math.max(0, 1 - (avgDiff / maxLen));
  }

  _buildFrequency(tokens) {
    const freq = new Map();
    const total = tokens.length || 1;
    for (const t of tokens) {
      const stem = this.stemmer.stem(t);
      freq.set(stem, (freq.get(stem) || 0) + 1 / total);
    }
    return freq;
  }

  _cosine(mapA, mapB) {
    let dot = 0, magA = 0, magB = 0;
    const all = new Set([...mapA.keys(), ...mapB.keys()]);
    for (const w of all) {
      const a = mapA.get(w) || 0;
      const b = mapB.get(w) || 0;
      dot += a * b;
      magA += a * a;
      magB += b * b;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  _jaccard(tokensA, tokensB) {
    const setA = this._shingles(tokensA);
    const setB = this._shingles(tokensB);
    if (setA.size === 0 || setB.size === 0) return 0;
    const inter = new Set([...setA].filter(x => setB.has(x)));
    return inter.size / (setA.size + setB.size - inter.size);
  }

  _shingles(tokens) {
    const set = new Set();
    for (let i = 0; i <= tokens.length - this.shingleSize; i++) {
      set.add(tokens.slice(i, i + this.shingleSize).join(' '));
    }
    return set;
  }

  _lcsRatio(a, b) {
    const m = a.length, n = b.length;
    if (m === 0 || n === 0) return 0;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1] + 1
          : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    return (2 * dp[m][n]) / (m + n);
  }

  _combineScores({ cosine, jaccard, lcs, ngram, tfidf, wordOrder }, lenA, lenB) {
    const lengthRatio = Math.min(lenA, lenB) / Math.max(lenA, lenB);
    // Giảm weight của length để không bỏ sót các tài liệu có độ dài khác nhau nhưng nội dung tương tự
    const lengthWeight = Math.min(1.0, 0.8 + (lengthRatio * 0.2)); // Range: 0.8 - 1.0

    // Weighted combination of multiple metrics
    // N-gram và Jaccard quan trọng nhất cho phát hiện đạo văn
    const raw = 
      cosine * 0.15 +      // Overall word frequency similarity
      jaccard * 0.30 +     // Set-based similarity (tăng trọng số)
      lcs * 0.15 +         // Longest common subsequence
      ngram * 0.30 +       // Phrase-level similarity (tăng trọng số - rất quan trọng)
      tfidf * 0.08 +       // Term importance similarity
      wordOrder * 0.02;    // Word order similarity

    // Apply length weight (nhẹ hơn để không bỏ sót)
    const finalScore = raw * lengthWeight;
    
    // Đảm bảo điểm số không bị giảm quá nhiều do length difference
    // Nếu raw score cao nhưng length khác nhau, vẫn giữ một phần điểm số
    return Math.min(1.0, Math.max(raw * 0.7, finalScore));
  }

  // ==================================================================
  // INTERNAL: Matching Sections
  // ==================================================================

  _findMatchingSections(tokensA, tokensB, minWords = 5) {
    const matches = [];
    const usedIndices = new Set();
    let i = 0;
    
    while (i < tokensA.length) {
      if (usedIndices.has(i)) {
        i++;
        continue;
      }
      
      let bestLen = 0, bestJ = -1;
      for (let j = 0; j < tokensB.length; j++) {
        let k = 0;
        while (
          i + k < tokensA.length &&
          j + k < tokensB.length &&
          this._wordsMatch(tokensA[i + k], tokensB[j + k])
        ) k++;
        if (k > bestLen) { 
          bestLen = k; 
          bestJ = j; 
        }
      }
      
      if (bestLen >= minWords) {
        const matchedText = tokensA.slice(i, i + bestLen).join(' ');
        matches.push({
          text: matchedText,
          length: bestLen,
          startIndex: i,
          similarity: bestLen / Math.max(tokensA.length, tokensB.length)
        });
        
        // Mark indices as used to avoid overlapping matches
        for (let idx = i; idx < i + bestLen; idx++) {
          usedIndices.add(idx);
        }
        
        i += bestLen;
      } else {
        i++;
      }
    }
    
    // Sort by length and similarity, return top matches
    return matches
      .sort((a, b) => (b.length * b.similarity) - (a.length * a.similarity))
      .slice(0, 10)
      .map(m => m.text);
  }

  _wordsMatch(w1, w2) {
    if (w1 === w2) return true;
    const set = this.synonyms.get(w1);
    return set ? set.has(w2) : false;
  }

  // ==================================================================
  // INTERNAL: Filtering
  // ==================================================================

  _filterCandidates(uploadedPath, docs) {
    const name = path.basename(uploadedPath).toLowerCase();
    const ext = path.extname(uploadedPath).toLowerCase();
    let size;
    try { size = require('fs').statSync(uploadedPath).size; } catch { size = 0; }

    // Lọc candidates nhưng không quá strict để không bỏ sót
    const candidates = docs
      .filter(d => {
        const fullPath = path.join(this.uploadDir, d.storedFilename);
        // Kiểm tra file có tồn tại không
        if (!require('fs').existsSync(fullPath)) {
          console.warn(`File không tồn tại trong filter: ${fullPath}`);
          return false;
        }
        
        // Không filter theo extension - có thể cùng nội dung nhưng khác format
        // Không filter theo size quá strict - có thể có metadata khác nhau
        const s = require('fs').statSync(fullPath).size;
        const sizeRatio = Math.max(size, s) / Math.min(size, s);
        
        // Chỉ loại bỏ nếu size chênh lệch quá lớn (có thể là file khác hoàn toàn)
        if (sizeRatio > 5.0) return false;
        
        // Ưu tiên các file có tên tương tự hoặc cùng extension
        const nameSim = this._nameSimilarity(name, path.basename(d.storedFilename).toLowerCase());
        const sameExt = path.extname(d.storedFilename).toLowerCase() === ext;
        
        // Chấp nhận nếu: cùng extension HOẶC tên tương tự HOẶC size tương đương
        return sameExt || nameSim > 0.1 || sizeRatio < 1.5;
      })
      .sort((a, b) => {
        // Ưu tiên: cùng extension > tên tương tự > size gần
        const aExt = path.extname(a.storedFilename).toLowerCase() === ext;
        const bExt = path.extname(b.storedFilename).toLowerCase() === ext;
        if (aExt !== bExt) return aExt ? -1 : 1;
        
        const aNameSim = this._nameSimilarity(name, path.basename(a.storedFilename).toLowerCase());
        const bNameSim = this._nameSimilarity(name, path.basename(b.storedFilename).toLowerCase());
        if (Math.abs(aNameSim - bNameSim) > 0.1) return bNameSim - aNameSim;
        
        const sa = require('fs').statSync(path.join(this.uploadDir, a.storedFilename)).size;
        const sb = require('fs').statSync(path.join(this.uploadDir, b.storedFilename)).size;
        return Math.abs(size - sa) - Math.abs(size - sb);
      })
      .slice(0, this.maxCandidates);
    
    return candidates;
  }

  _nameSimilarity(a, b) {
    const sa = new Set(a.split(/[^a-z0-9]/));
    const sb = new Set(b.split(/[^a-z0-9]/));
    const inter = new Set([...sa].filter(x => sb.has(x)));
    return inter.size / (sa.size + sb.size - inter.size + 1);
  }

  // ==================================================================
  // REPORT HELPERS
  // ==================================================================

  _exactMatchReport(doc, hash) {
    return {
      isSimilar: true,
      similarityScore: 1.0,
      similarDocuments: [{
        id: doc.id,
        filename: doc.filename,
        similarityScore: 1.0,
        matchedSections: ['Toàn bộ nội dung giống hệt (100% trùng)'],
        details: { method: 'exact_hash_match', hash },
      }],
      totalChecked: 1,
      totalSkipped: 0,
      message: 'Phát hiện tài liệu trùng 100% (cùng nội dung, khác tên)',
    };
  }

  _failReport(message) {
    return {
      isSimilar: false,
      similarityScore: 0,
      similarDocuments: [],
      totalChecked: 0,
      totalSkipped: 0,
      message,
    };
  }
}

// Create and export a pre-configured instance
const similarityService = new SimilarityService({
  threshold: 0.7,          // 70% similarity threshold (high similarity - serious plagiarism)
  warnThreshold: 0.3,      // 30% similarity warning threshold (lowered to detect more cases)
  shingleSize: 3,          // Shingle size for comparison
  maxCandidates: 100,      // Increased to check more documents
  uploadDir: getUploadDir(), // Use absolute path for upload directory
  cacheMax: 1000,          // Maximum number of items in cache
  cacheTTL: 24 * 60 * 60 * 1000 // 24 hours cache TTL
});

// Export both the class and the instance
module.exports = {
  SimilarityService,    // The class itself
  similarityService     // Pre-configured instance
};