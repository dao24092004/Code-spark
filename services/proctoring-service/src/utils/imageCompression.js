// src/utils/imageCompression.js
// Utility for compressing images/frames before sending via WebSocket

/**
 * Compress image buffer for efficient WebSocket transmission
 * @param {Buffer|ArrayBuffer|Uint8Array} frameBuffer - Original frame data
 * @param {number} quality - Compression quality (0.1 - 1.0)
 * @param {Object} options - Additional compression options
 * @returns {Promise<Buffer>} Compressed frame buffer
 */
async function compressImage(frameBuffer, quality = 0.7, options = {}) {
  try {
    const {
      maxWidth = 640,
      maxHeight = 480,
      format = 'jpeg',
      enableResize = true,
      enableQualityAdjustment = true
    } = options;

    // Convert different buffer types to consistent format
    let buffer = frameBuffer;
    if (frameBuffer instanceof ArrayBuffer) {
      buffer = Buffer.from(frameBuffer);
    } else if (frameBuffer instanceof Uint8Array) {
      buffer = Buffer.from(frameBuffer);
    }

    // For browser environment, use Canvas API
    if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
      return await compressImageBrowser(buffer, quality, options);
    }
    
    // For Node.js environment, use sharp if available
    try {
      const sharp = require('sharp');
      return await compressImageNode(buffer, quality, options);
    } catch (error) {
      console.warn('[ImageCompression] Sharp not available, using fallback compression');
      return await compressImageFallback(buffer, quality, options);
    }

  } catch (error) {
    console.error('[ImageCompression] Error compressing image:', error);
    // Return original buffer if compression fails
    return frameBuffer;
  }
}

/**
 * Browser-based image compression using Canvas API
 */
async function compressImageBrowser(frameBuffer, quality, options) {
  return new Promise((resolve, reject) => {
    try {
      const { maxWidth = 640, maxHeight = 480, format = 'jpeg' } = options;
      
      // Create image from buffer
      const blob = new Blob([frameBuffer], { type: 'image/jpeg' });
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions
          let { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob((compressedBlob) => {
            if (compressedBlob) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(Buffer.from(reader.result));
              };
              reader.readAsArrayBuffer(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, `image/${format}`, quality);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Node.js-based image compression using Sharp
 */
async function compressImageNode(frameBuffer, quality, options) {
  const sharp = require('sharp');
  const { maxWidth = 640, maxHeight = 480, format = 'jpeg' } = options;
  
  let pipeline = sharp(frameBuffer);
  
  // Resize if needed
  if (options.enableResize !== false) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Apply compression based on format
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ 
      quality: Math.round(quality * 100),
      progressive: true,
      mozjpeg: true
    });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ 
      quality: Math.round(quality * 100),
      effort: 4
    });
  } else if (format === 'png') {
    pipeline = pipeline.png({ 
      compressionLevel: Math.round((1 - quality) * 9),
      progressive: true
    });
  }
  
  return await pipeline.toBuffer();
}

/**
 * Fallback compression method (basic resize and quality reduction)
 */
async function compressImageFallback(frameBuffer, quality, options) {
  // Simple fallback - just reduce buffer size by sampling
  const compressionRatio = Math.max(0.1, quality);
  const targetSize = Math.floor(frameBuffer.length * compressionRatio);
  
  if (targetSize >= frameBuffer.length) {
    return frameBuffer;
  }
  
  // Simple downsampling
  const step = Math.floor(frameBuffer.length / targetSize);
  const compressed = Buffer.alloc(targetSize);
  
  for (let i = 0; i < targetSize; i++) {
    compressed[i] = frameBuffer[i * step];
  }
  
  return compressed;
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Adaptive compression based on network conditions
 */
function getAdaptiveCompressionSettings(networkInfo = {}) {
  const {
    effectiveType = '4g',
    downlink = 10,
    rtt = 100
  } = networkInfo;
  
  // Adjust compression based on network quality
  if (effectiveType === 'slow-2g' || downlink < 0.5) {
    return {
      quality: 0.3,
      maxWidth: 320,
      maxHeight: 240,
      format: 'jpeg'
    };
  } else if (effectiveType === '2g' || downlink < 1.5) {
    return {
      quality: 0.5,
      maxWidth: 480,
      maxHeight: 360,
      format: 'jpeg'
    };
  } else if (effectiveType === '3g' || downlink < 5) {
    return {
      quality: 0.7,
      maxWidth: 640,
      maxHeight: 480,
      format: 'jpeg'
    };
  } else {
    return {
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 720,
      format: 'webp'
    };
  }
}

module.exports = {
  compressImage,
  getAdaptiveCompressionSettings,
  calculateDimensions
};
