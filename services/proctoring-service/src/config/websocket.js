// src/config/websocket.js
const { Server } = require('socket.io');
const config = require('./index');
const proctoringService = require('../services/proctoring.service');
const { compressImage, getAdaptiveCompressionSettings } = require('../utils/imageCompression');

let io;

// Helper function to get optimal video constraints
function getOptimalVideoConstraints(networkInfo = {}, preferredQuality = 'auto') {
  const { effectiveType = '4g', downlink = 10, saveData = false } = networkInfo;
  
  let constraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    }
  };

  // Adjust based on network conditions or user preference
  if (preferredQuality === 'low' || saveData || effectiveType === 'slow-2g' || downlink < 0.5) {
    constraints.video = {
      width: { ideal: 320, max: 480 },
      height: { ideal: 240, max: 360 },
      frameRate: { ideal: 15, max: 20 }
    };
  } else if (preferredQuality === 'medium' || effectiveType === '2g' || downlink < 1.5) {
    constraints.video = {
      width: { ideal: 480, max: 640 },
      height: { ideal: 360, max: 480 },
      frameRate: { ideal: 20, max: 25 }
    };
  } else if (preferredQuality === 'high' || effectiveType === '3g' || downlink < 5) {
    constraints.video = {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 25, max: 30 }
    };
  }
  
  return constraints;
}

function initializeWebSocket(httpServer) {
  const corsOptions = Array.isArray(config.websocket.cors.origin) || config.websocket.cors.origin === '*'
    ? {
        origin: config.websocket.cors.origin,
        methods: config.websocket.cors.methods || ['GET', 'POST']
      }
    : {
        origin: [config.websocket.cors.origin],
        methods: config.websocket.cors.methods || ['GET', 'POST']
      };

  io = new Server(httpServer, {
    path: config.websocket.path,
    cors: corsOptions
  });

  // Lắng nghe kết nối
  io.on('connection', (socket) => {
    // === BƯỚC 1: XÁC THỰC VÀ THAM GIA PHÒNG THI ===
    // Client (cả Student và Proctor) phải gửi thông tin này khi kết nối
    const { examId, userId, userType } = socket.handshake.query;

    if (!examId || !userId || !userType) {
      console.error('[WebSocket] Kết nối bị từ chối: Thiếu examId, userId, hoặc userType.');
      socket.disconnect();
      return;
    }

    // Lưu trữ thông tin trên socket
    socket.data.userId = userId;
    socket.data.userType = userType;
    socket.data.examId = examId;

    // Cho socket tham gia vào "room" của kỳ thi
    // Tất cả sinh viên và giám thị của kỳ thi này sẽ ở chung 1 room
    socket.join(examId);
    console.log(`[WebSocket] User ${userId} (loại: ${userType}) đã tham gia phòng thi ${examId}. Socket ID: ${socket.id}`);

    // Gửi thông báo cho những người khác trong phòng
    socket.to(examId).emit('user_joined', { userId, userType });


    // === BƯỚC 2: NHẬN FRAME ẢNH TỪ SINH VIÊN (CHO AI) - OPTIMIZED ===
    socket.on('student_frame_for_ai', async (frameData) => {
      try {
        const { frameBuffer, sessionId, timestamp, networkInfo } = frameData;
        
        if (!sessionId) {
          console.error("Thiếu sessionId khi nhận frame_for_ai");
          return;
        }

        // Get adaptive compression settings based on network conditions
        const compressionSettings = getAdaptiveCompressionSettings(networkInfo);
        
        // Compress frame before processing (if not already compressed)
        let processedFrame = frameBuffer;
        if (frameBuffer && frameBuffer.length > 100000) { // Only compress if > 100KB
          try {
            processedFrame = await compressImage(frameBuffer, compressionSettings.quality, {
              maxWidth: compressionSettings.maxWidth,
              maxHeight: compressionSettings.maxHeight,
              format: compressionSettings.format
            });
            
            const compressionRatio = processedFrame.length / frameBuffer.length;
            console.log(`[WebSocket] Frame compressed: ${frameBuffer.length} -> ${processedFrame.length} bytes (${(compressionRatio * 100).toFixed(1)}%)`);
          } catch (compressionError) {
            console.warn('[WebSocket] Frame compression failed, using original:', compressionError.message);
            processedFrame = frameBuffer;
          }
        }

        // Process with AI service
        await proctoringService.handleProctoringData(sessionId, socket.data.userId, processedFrame);
        
        // Send compression stats back to client for optimization
        socket.emit('frame_processed', {
          sessionId,
          timestamp,
          originalSize: frameBuffer?.length || 0,
          processedSize: processedFrame?.length || 0,
          processingTime: Date.now() - (timestamp || Date.now())
        });

      } catch (error) {
        console.error('[WebSocket] Error processing AI frame:', error);
        socket.emit('frame_error', {
          sessionId: frameData.sessionId,
          error: error.message
        });
      }
    });


    // === BƯỚC 3: XỬ LÝ LIVE STREAMING (WEBRTC SIGNALING) - OPTIMIZED ===
    
    // 3a. Giám thị yêu cầu xem stream của một sinh viên
    socket.on('proctor_request_stream', (data) => {
      const { studentIdToView, networkInfo, preferredQuality } = data;
      console.log(`[WebSocket] Giám thị ${socket.data.userId} yêu cầu xem SV ${studentIdToView}`);
      
      // Get optimal constraints based on network conditions
      const constraints = getOptimalVideoConstraints(networkInfo, preferredQuality);
      
      // Gửi yêu cầu với optimization settings
      socket.to(examId).emit('webrtc_offer_request', {
        proctorSocketId: socket.id,
        studentIdToView: studentIdToView,
        constraints: constraints,
        fallbackEnabled: true,
        timestamp: Date.now()
      });
    });

    // 3b. Sinh viên gửi "offer" (lời mời P2P) đến cho giám thị
    socket.on('webrtc_offer', (data) => {
      const { offer, targetSocketId } = data;
      console.log(`[WebSocket] SV ${socket.data.userId} gửi offer đến ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc_offer_received', {
        offer: offer,
        senderSocketId: socket.id,
        studentId: socket.data.userId // Gửi kèm ID sinh viên
      });
    });

    // 3c. Giám thị gửi "answer" (phản hồi) lại cho sinh viên
    socket.on('webrtc_answer', (data) => {
      const { answer, targetSocketId } = data;
      console.log(`[WebSocket] Giám thị ${socket.data.userId} gửi answer đến ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc_answer_received', {
        answer: answer,
        senderSocketId: socket.id
      });
    });
    
    // 3d. Cả hai bên trao đổi ICE candidates
    socket.on('webrtc_ice_candidate', (data) => {
      const { candidate, targetSocketId } = data;
      io.to(targetSocketId).emit('webrtc_ice_candidate_received', {
        candidate: candidate,
        senderSocketId: socket.id
      });
    });

    // 3e. WebRTC connection failed - activate fallback
    socket.on('webrtc_connection_failed', (data) => {
      const { targetSocketId, error, studentId } = data;
      console.log(`[WebSocket] WebRTC failed for ${studentId}, activating fallback`);
      
      // Notify both parties about fallback activation
      io.to(targetSocketId).emit('webrtc_fallback_activated', {
        reason: error,
        fallbackMode: 'websocket_streaming',
        senderSocketId: socket.id
      });
      
      socket.emit('webrtc_fallback_activated', {
        reason: error,
        fallbackMode: 'websocket_streaming',
        targetSocketId: targetSocketId
      });
    });

    // 3f. WebSocket video streaming fallback
    socket.on('video_frame', async (frameData) => {
      try {
        const { frameBuffer, timestamp, targetSocketId, width, height, format } = frameData;
        
        if (!targetSocketId) {
          console.error('[WebSocket] Missing targetSocketId for video frame');
          return;
        }

        // Compress frame for transmission
        let compressedFrame = frameBuffer;
        if (frameBuffer && frameBuffer.length > 50000) { // Compress if > 50KB
          try {
            compressedFrame = await compressImage(frameBuffer, 0.6, {
              maxWidth: Math.min(width || 640, 640),
              maxHeight: Math.min(height || 480, 480),
              format: format || 'jpeg'
            });
          } catch (compressionError) {
            console.warn('[WebSocket] Video frame compression failed:', compressionError.message);
          }
        }

        // Forward compressed frame to target
        io.to(targetSocketId).emit('video_frame_received', {
          frameBuffer: compressedFrame,
          timestamp,
          senderSocketId: socket.id,
          originalSize: frameBuffer?.length || 0,
          compressedSize: compressedFrame?.length || 0,
          width: width || 640,
          height: height || 480,
          format: format || 'jpeg'
        });

      } catch (error) {
        console.error('[WebSocket] Error processing video frame:', error);
      }
    });

    // 3g. Connection quality monitoring
    socket.on('connection_quality_update', (data) => {
      const { quality, stats, targetSocketId } = data;
      
      // Forward quality info to peer for adaptive streaming
      if (targetSocketId) {
        io.to(targetSocketId).emit('peer_quality_update', {
          quality,
          stats,
          senderSocketId: socket.id
        });
      }
    });


    // === BƯỚC 4: XỬ LÝ NGẮT KẾT NỐI ===
    socket.on('disconnect', () => {
      console.log(`[WebSocket] User ${socket.data.userId} đã ngắt kết nối khỏi phòng ${examId}.`);
      // Thông báo cho những người còn lại
      socket.to(examId).emit('user_left', { userId: socket.data.userId });
    });
  });

  console.log('[Socket.IO] Server đã khởi tạo và sẵn sàng nhận kết nối.');
}

module.exports = {
  initializeWebSocket,
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};