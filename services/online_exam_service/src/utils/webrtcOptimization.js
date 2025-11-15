// src/utils/webrtcOptimization.js
// WebRTC optimization utilities for adaptive streaming and quality control

/**
 * Get optimal WebRTC constraints based on network conditions
 */
function getOptimalConstraints(networkInfo = {}, deviceCapabilities = {}) {
  const {
    effectiveType = '4g',
    downlink = 10,
    rtt = 100,
    saveData = false
  } = networkInfo;

  const {
    maxResolution = { width: 1920, height: 1080 },
    maxFrameRate = 60,
    supportsH264 = true,
    supportsVP8 = true,
    supportsVP9 = false
  } = deviceCapabilities;

  // Base constraints
  let constraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  };

  // Adjust based on network conditions
  if (saveData || effectiveType === 'slow-2g' || downlink < 0.5) {
    // Very low quality for poor connections
    constraints.video = {
      width: { ideal: 320, max: 480 },
      height: { ideal: 240, max: 360 },
      frameRate: { ideal: 15, max: 20 },
      facingMode: 'user'
    };
    constraints.audio.sampleRate = 16000;
  } else if (effectiveType === '2g' || downlink < 1.5) {
    // Low quality
    constraints.video = {
      width: { ideal: 480, max: 640 },
      height: { ideal: 360, max: 480 },
      frameRate: { ideal: 20, max: 25 },
      facingMode: 'user'
    };
    constraints.audio.sampleRate = 24000;
  } else if (effectiveType === '3g' || downlink < 5) {
    // Medium quality
    constraints.video = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 25, max: 30 },
      facingMode: 'user'
    };
  }
  // 4g and above use default high quality settings

  return constraints;
}

/**
 * Adaptive bitrate controller for WebRTC streams
 */
class AdaptiveBitrateController {
  constructor(peerConnection, options = {}) {
    this.pc = peerConnection;
    this.options = {
      minBitrate: 100000, // 100 kbps
      maxBitrate: 2000000, // 2 Mbps
      targetBitrate: 800000, // 800 kbps
      adaptationInterval: 5000, // 5 seconds
      qualityThreshold: 0.8,
      ...options
    };
    
    this.currentBitrate = this.options.targetBitrate;
    this.stats = {
      packetsLost: 0,
      packetsReceived: 0,
      bytesReceived: 0,
      timestamp: Date.now()
    };
    
    this.isAdapting = false;
    this.adaptationTimer = null;
  }

  /**
   * Start adaptive bitrate monitoring
   */
  start() {
    if (this.adaptationTimer) {
      this.stop();
    }

    this.adaptationTimer = setInterval(() => {
      this.adaptBitrate();
    }, this.options.adaptationInterval);

    console.log('[WebRTC] Adaptive bitrate controller started');
  }

  /**
   * Stop adaptive bitrate monitoring
   */
  stop() {
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer);
      this.adaptationTimer = null;
    }
    console.log('[WebRTC] Adaptive bitrate controller stopped');
  }

  /**
   * Adapt bitrate based on network statistics
   */
  async adaptBitrate() {
    if (this.isAdapting) return;
    
    try {
      this.isAdapting = true;
      const stats = await this.getConnectionStats();
      
      if (stats) {
        const quality = this.calculateQuality(stats);
        const newBitrate = this.calculateOptimalBitrate(quality, stats);
        
        if (Math.abs(newBitrate - this.currentBitrate) > 50000) { // 50 kbps threshold
          await this.setBitrate(newBitrate);
          console.log(`[WebRTC] Bitrate adapted: ${this.currentBitrate} -> ${newBitrate} (quality: ${quality.toFixed(2)})`);
        }
      }
    } catch (error) {
      console.error('[WebRTC] Error adapting bitrate:', error);
    } finally {
      this.isAdapting = false;
    }
  }

  /**
   * Get WebRTC connection statistics
   */
  async getConnectionStats() {
    try {
      const stats = await this.pc.getStats();
      let inboundStats = null;
      let outboundStats = null;

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          inboundStats = report;
        } else if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          outboundStats = report;
        }
      });

      return { inbound: inboundStats, outbound: outboundStats };
    } catch (error) {
      console.error('[WebRTC] Error getting stats:', error);
      return null;
    }
  }

  /**
   * Calculate connection quality score (0-1)
   */
  calculateQuality(stats) {
    if (!stats.inbound) return 0.5;

    const { packetsLost = 0, packetsReceived = 0, jitter = 0 } = stats.inbound;
    const totalPackets = packetsLost + packetsReceived;
    
    if (totalPackets === 0) return 0.5;

    // Calculate packet loss ratio
    const lossRatio = packetsLost / totalPackets;
    
    // Calculate quality based on packet loss and jitter
    let quality = 1.0;
    
    // Penalize packet loss (0-10% loss)
    quality -= Math.min(lossRatio * 10, 1.0) * 0.6;
    
    // Penalize high jitter (>50ms is bad)
    if (jitter > 0.05) {
      quality -= Math.min((jitter - 0.05) * 10, 1.0) * 0.3;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Calculate optimal bitrate based on quality
   */
  calculateOptimalBitrate(quality, stats) {
    const { minBitrate, maxBitrate, targetBitrate } = this.options;
    
    if (quality >= this.options.qualityThreshold) {
      // Good quality - can increase bitrate
      return Math.min(maxBitrate, this.currentBitrate * 1.2);
    } else if (quality < 0.5) {
      // Poor quality - decrease bitrate significantly
      return Math.max(minBitrate, this.currentBitrate * 0.7);
    } else {
      // Moderate quality - slight decrease
      return Math.max(minBitrate, this.currentBitrate * 0.9);
    }
  }

  /**
   * Set new bitrate for the connection
   */
  async setBitrate(bitrate) {
    try {
      const sender = this.pc.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        const params = sender.getParameters();
        
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = bitrate;
          await sender.setParameters(params);
          this.currentBitrate = bitrate;
        }
      }
    } catch (error) {
      console.error('[WebRTC] Error setting bitrate:', error);
    }
  }

  /**
   * Get current statistics
   */
  getCurrentStats() {
    return {
      currentBitrate: this.currentBitrate,
      targetBitrate: this.options.targetBitrate,
      minBitrate: this.options.minBitrate,
      maxBitrate: this.options.maxBitrate,
      isAdapting: this.isAdapting
    };
  }
}

/**
 * WebRTC connection optimizer
 */
class WebRTCOptimizer {
  constructor(options = {}) {
    this.options = {
      enableAdaptiveBitrate: true,
      enableBandwidthProbing: true,
      enableCongestionControl: true,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      ...options
    };
    
    this.bitrateController = null;
    this.networkMonitor = null;
  }

  /**
   * Create optimized peer connection
   */
  createPeerConnection() {
    const config = {
      iceServers: this.options.iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    const pc = new RTCPeerConnection(config);

    // Enable adaptive bitrate if requested
    if (this.options.enableAdaptiveBitrate) {
      this.bitrateController = new AdaptiveBitrateController(pc, {
        minBitrate: this.options.minBitrate,
        maxBitrate: this.options.maxBitrate
      });
    }

    // Add connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
      
      if (pc.connectionState === 'connected') {
        this.bitrateController?.start();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.bitrateController?.stop();
      }
    };

    return pc;
  }

  /**
   * Optimize media stream for transmission
   */
  async optimizeStream(stream, constraints) {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // Apply constraints to video track
        await videoTrack.applyConstraints(constraints.video);
        
        // Enable advanced video settings if supported
        if (videoTrack.getSettings) {
          const settings = videoTrack.getSettings();
          console.log('[WebRTC] Video track settings:', settings);
        }
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && constraints.audio) {
        await audioTrack.applyConstraints(constraints.audio);
      }

      return stream;
    } catch (error) {
      console.error('[WebRTC] Error optimizing stream:', error);
      return stream;
    }
  }

  /**
   * Monitor network conditions
   */
  startNetworkMonitoring(callback) {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      
      const updateNetworkInfo = () => {
        const networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
        
        callback(networkInfo);
      };

      // Initial call
      updateNetworkInfo();

      // Listen for changes
      connection.addEventListener('change', updateNetworkInfo);
      
      this.networkMonitor = {
        connection,
        updateNetworkInfo,
        stop: () => connection.removeEventListener('change', updateNetworkInfo)
      };
    }
  }

  /**
   * Stop network monitoring
   */
  stopNetworkMonitoring() {
    if (this.networkMonitor) {
      this.networkMonitor.stop();
      this.networkMonitor = null;
    }
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      bitrateController: this.bitrateController?.getCurrentStats(),
      networkMonitor: this.networkMonitor ? {
        effectiveType: this.networkMonitor.connection.effectiveType,
        downlink: this.networkMonitor.connection.downlink,
        rtt: this.networkMonitor.connection.rtt
      } : null
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.bitrateController?.stop();
    this.stopNetworkMonitoring();
  }
}

/**
 * Utility functions for WebRTC optimization
 */
const WebRTCUtils = {
  /**
   * Check browser WebRTC capabilities
   */
  checkCapabilities() {
    const capabilities = {
      webrtc: !!window.RTCPeerConnection,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      networkInfo: !!navigator.connection
    };

    // Check codec support
    if (capabilities.webrtc) {
      const pc = new RTCPeerConnection();
      capabilities.codecs = {
        h264: pc.canTrickleIceCandidates !== undefined,
        vp8: true, // Usually supported
        vp9: true, // Usually supported
        av1: false // Check if needed
      };
      pc.close();
    }

    return capabilities;
  },

  /**
   * Get device media capabilities
   */
  async getDeviceCapabilities() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getSupportedConstraints) {
        return {};
      }

      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
      
      // Try to get device info
      let devices = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (error) {
        console.warn('[WebRTC] Cannot enumerate devices:', error);
      }

      return {
        supportedConstraints,
        videoDevices: devices.filter(d => d.kind === 'videoinput'),
        audioDevices: devices.filter(d => d.kind === 'audioinput'),
        hasMultipleVideoDevices: devices.filter(d => d.kind === 'videoinput').length > 1
      };
    } catch (error) {
      console.error('[WebRTC] Error getting device capabilities:', error);
      return {};
    }
  },

  /**
   * Test WebRTC connectivity
   */
  async testConnectivity(iceServers) {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers });
      const results = {
        canConnect: false,
        iceConnectionState: 'new',
        gatheringState: 'new',
        candidates: []
      };

      const timeout = setTimeout(() => {
        pc.close();
        resolve(results);
      }, 10000); // 10 second timeout

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          results.candidates.push(event.candidate.type);
        }
      };

      pc.onicegatheringstatechange = () => {
        results.gatheringState = pc.iceGatheringState;
        if (pc.iceGatheringState === 'complete') {
          results.canConnect = results.candidates.length > 0;
          clearTimeout(timeout);
          pc.close();
          resolve(results);
        }
      };

      // Create a dummy data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
    });
  }
};

module.exports = {
  getOptimalConstraints,
  AdaptiveBitrateController,
  WebRTCOptimizer,
  WebRTCUtils
};
