// src/utils/streamingFallback.js
// Fallback mechanisms for streaming when WebRTC fails

const { compressImage } = require('./imageCompression');

/**
 * Streaming fallback manager
 * Handles fallback from WebRTC to WebSocket streaming when P2P connection fails
 */
class StreamingFallbackManager {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 2000,
      fallbackTimeout: 15000,
      compressionQuality: 0.6,
      frameRate: 10, // Lower frame rate for WebSocket fallback
      maxFrameSize: 50000, // 50KB max per frame
      ...options
    };

    this.currentMode = 'webrtc'; // 'webrtc' | 'websocket' | 'failed'
    this.retryCount = 0;
    this.isRetrying = false;
    this.fallbackActive = false;
    
    // Event handlers
    this.onModeChange = null;
    this.onFallbackActivated = null;
    this.onConnectionRestored = null;
    this.onError = null;
  }

  /**
   * Attempt WebRTC connection with fallback support
   */
  async attemptConnection(webrtcConfig, websocketConfig) {
    try {
      console.log('[StreamingFallback] Attempting WebRTC connection...');
      
      const webrtcResult = await this.tryWebRTC(webrtcConfig);
      
      if (webrtcResult.success) {
        this.currentMode = 'webrtc';
        this.retryCount = 0;
        this.fallbackActive = false;
        
        console.log('[StreamingFallback] WebRTC connection successful');
        this.onModeChange?.('webrtc');
        
        return {
          mode: 'webrtc',
          connection: webrtcResult.connection,
          stream: webrtcResult.stream
        };
      } else {
        console.warn('[StreamingFallback] WebRTC failed, attempting fallback...');
        return await this.activateFallback(websocketConfig, webrtcResult.error);
      }
      
    } catch (error) {
      console.error('[StreamingFallback] Connection attempt failed:', error);
      return await this.activateFallback(websocketConfig, error);
    }
  }

  /**
   * Try WebRTC connection
   */
  async tryWebRTC(config) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: new Error('WebRTC connection timeout')
        });
      }, this.options.fallbackTimeout);

      try {
        const pc = new RTCPeerConnection(config.iceServers);
        let connectionEstablished = false;

        // Connection state monitoring
        pc.onconnectionstatechange = () => {
          console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
          
          if (pc.connectionState === 'connected' && !connectionEstablished) {
            connectionEstablished = true;
            clearTimeout(timeout);
            resolve({
              success: true,
              connection: pc,
              stream: config.stream
            });
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            if (!connectionEstablished) {
              clearTimeout(timeout);
              resolve({
                success: false,
                error: new Error(`WebRTC connection ${pc.connectionState}`)
              });
            }
          }
        };

        // ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log(`[WebRTC] ICE connection state: ${pc.iceConnectionState}`);
          
          if (pc.iceConnectionState === 'failed' && !connectionEstablished) {
            clearTimeout(timeout);
            resolve({
              success: false,
              error: new Error('ICE connection failed')
            });
          }
        };

        // Add stream and create offer/answer
        if (config.stream) {
          config.stream.getTracks().forEach(track => {
            pc.addTrack(track, config.stream);
          });
        }

        // Start connection process
        if (config.isOfferer) {
          pc.createOffer(config.offerOptions || {})
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              // Send offer through signaling
              config.onOffer?.(pc.localDescription);
            })
            .catch(error => {
              clearTimeout(timeout);
              resolve({
                success: false,
                error
              });
            });
        }

        // Store reference for cleanup
        this.currentWebRTCConnection = pc;

      } catch (error) {
        clearTimeout(timeout);
        resolve({
          success: false,
          error
        });
      }
    });
  }

  /**
   * Activate WebSocket fallback
   */
  async activateFallback(websocketConfig, originalError) {
    try {
      console.log('[StreamingFallback] Activating WebSocket fallback...');
      
      this.currentMode = 'websocket';
      this.fallbackActive = true;
      
      const fallbackConnection = await this.setupWebSocketStreaming(websocketConfig);
      
      console.log('[StreamingFallback] WebSocket fallback activated');
      this.onModeChange?.('websocket');
      this.onFallbackActivated?.(originalError);
      
      return {
        mode: 'websocket',
        connection: fallbackConnection,
        originalError
      };
      
    } catch (fallbackError) {
      console.error('[StreamingFallback] Fallback also failed:', fallbackError);
      
      this.currentMode = 'failed';
      this.onError?.(fallbackError);
      
      return {
        mode: 'failed',
        error: fallbackError,
        originalError
      };
    }
  }

  /**
   * Setup WebSocket streaming as fallback
   */
  async setupWebSocketStreaming(config) {
    const { socket, stream } = config;
    
    if (!socket || !stream) {
      throw new Error('WebSocket or stream not provided for fallback');
    }

    const fallbackStreamer = new WebSocketVideoStreamer(socket, {
      compressionQuality: this.options.compressionQuality,
      frameRate: this.options.frameRate,
      maxFrameSize: this.options.maxFrameSize
    });

    await fallbackStreamer.startStreaming(stream);
    
    return {
      type: 'websocket',
      streamer: fallbackStreamer,
      socket
    };
  }

  /**
   * Retry WebRTC connection
   */
  async retryWebRTC(webrtcConfig, websocketConfig) {
    if (this.isRetrying || this.retryCount >= this.options.maxRetries) {
      return false;
    }

    this.isRetrying = true;
    this.retryCount++;

    console.log(`[StreamingFallback] Retrying WebRTC connection (attempt ${this.retryCount}/${this.options.maxRetries})`);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));

    try {
      const result = await this.attemptConnection(webrtcConfig, websocketConfig);
      
      if (result.mode === 'webrtc') {
        console.log('[StreamingFallback] WebRTC connection restored');
        this.onConnectionRestored?.();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StreamingFallback] Retry failed:', error);
      return false;
    } finally {
      this.isRetrying = false;
    }
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      mode: this.currentMode,
      fallbackActive: this.fallbackActive,
      retryCount: this.retryCount,
      isRetrying: this.isRetrying,
      maxRetries: this.options.maxRetries
    };
  }

  /**
   * Cleanup connections
   */
  cleanup() {
    if (this.currentWebRTCConnection) {
      this.currentWebRTCConnection.close();
      this.currentWebRTCConnection = null;
    }
    
    this.currentMode = 'failed';
    this.fallbackActive = false;
    this.retryCount = 0;
    this.isRetrying = false;
  }
}

/**
 * WebSocket video streamer for fallback
 */
class WebSocketVideoStreamer {
  constructor(socket, options = {}) {
    this.socket = socket;
    this.options = {
      compressionQuality: 0.6,
      frameRate: 10,
      maxFrameSize: 50000,
      ...options
    };
    
    this.isStreaming = false;
    this.frameInterval = null;
    this.canvas = null;
    this.context = null;
    this.video = null;
  }

  /**
   * Start streaming video over WebSocket
   */
  async startStreaming(stream) {
    try {
      if (this.isStreaming) {
        this.stopStreaming();
      }

      // Setup video element and canvas for frame capture
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;
      this.video.muted = true;
      
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
        this.video.onerror = reject;
      });

      // Start frame capture
      this.isStreaming = true;
      const frameDelay = 1000 / this.options.frameRate;
      
      this.frameInterval = setInterval(() => {
        this.captureAndSendFrame();
      }, frameDelay);

      console.log(`[WebSocketStreamer] Started streaming at ${this.options.frameRate} FPS`);
      
    } catch (error) {
      console.error('[WebSocketStreamer] Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Capture and send video frame
   */
  async captureAndSendFrame() {
    try {
      if (!this.isStreaming || !this.video || !this.canvas) {
        return;
      }

      // Draw current video frame to canvas
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Convert to blob
      this.canvas.toBlob(async (blob) => {
        if (blob && this.isStreaming) {
          try {
            // Convert blob to buffer
            const arrayBuffer = await blob.arrayBuffer();
            const frameBuffer = new Uint8Array(arrayBuffer);
            
            // Compress frame
            const compressedFrame = await compressImage(
              frameBuffer, 
              this.options.compressionQuality,
              {
                maxWidth: this.canvas.width,
                maxHeight: this.canvas.height,
                format: 'jpeg'
              }
            );

            // Check frame size
            if (compressedFrame.length > this.options.maxFrameSize) {
              console.warn(`[WebSocketStreamer] Frame too large: ${compressedFrame.length} bytes`);
              return;
            }

            // Send frame via WebSocket
            this.socket.emit('video_frame', {
              frameBuffer: compressedFrame,
              timestamp: Date.now(),
              width: this.canvas.width,
              height: this.canvas.height,
              format: 'jpeg'
            });

          } catch (error) {
            console.error('[WebSocketStreamer] Error processing frame:', error);
          }
        }
      }, 'image/jpeg', this.options.compressionQuality);

    } catch (error) {
      console.error('[WebSocketStreamer] Error capturing frame:', error);
    }
  }

  /**
   * Stop streaming
   */
  stopStreaming() {
    this.isStreaming = false;
    
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    
    this.canvas = null;
    this.context = null;
    
    console.log('[WebSocketStreamer] Streaming stopped');
  }

  /**
   * Get streaming statistics
   */
  getStats() {
    return {
      isStreaming: this.isStreaming,
      frameRate: this.options.frameRate,
      compressionQuality: this.options.compressionQuality,
      maxFrameSize: this.options.maxFrameSize,
      canvasSize: this.canvas ? {
        width: this.canvas.width,
        height: this.canvas.height
      } : null
    };
  }
}

/**
 * Utility functions for fallback management
 */
const FallbackUtils = {
  /**
   * Detect if WebRTC is likely to fail
   */
  detectWebRTCIssues() {
    const issues = [];
    
    // Check browser support
    if (!window.RTCPeerConnection) {
      issues.push('WebRTC not supported');
    }
    
    // Check network type
    if (navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        issues.push('Slow network connection');
      }
      if (connection.saveData) {
        issues.push('Data saver mode enabled');
      }
    }
    
    // Check if behind restrictive firewall (heuristic)
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('corporate') || userAgent.includes('enterprise')) {
      issues.push('Possible corporate firewall');
    }
    
    return issues;
  },

  /**
   * Test WebSocket connectivity
   */
  async testWebSocketConnection(url, timeout = 5000) {
    return new Promise((resolve) => {
      const socket = new WebSocket(url);
      const timer = setTimeout(() => {
        socket.close();
        resolve(false);
      }, timeout);

      socket.onopen = () => {
        clearTimeout(timer);
        socket.close();
        resolve(true);
      };

      socket.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
    });
  },

  /**
   * Get recommended fallback strategy
   */
  getRecommendedStrategy(networkInfo, capabilities) {
    const strategy = {
      preferWebRTC: true,
      enableFallback: true,
      fallbackDelay: 15000,
      maxRetries: 3
    };

    // Adjust based on network conditions
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.downlink < 0.5) {
      strategy.preferWebRTC = false;
      strategy.fallbackDelay = 5000;
    } else if (networkInfo.effectiveType === '2g' || networkInfo.downlink < 1.5) {
      strategy.fallbackDelay = 10000;
      strategy.maxRetries = 2;
    }

    // Adjust based on capabilities
    if (!capabilities.webrtc) {
      strategy.preferWebRTC = false;
      strategy.enableFallback = true;
    }

    return strategy;
  }
};

module.exports = {
  StreamingFallbackManager,
  WebSocketVideoStreamer,
  FallbackUtils
};
