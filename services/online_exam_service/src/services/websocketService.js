// src/services/websocketService.js
const { getIO, emitToExam, emitToUser } = require('../config/websocket');
const { compressImage, getAdaptiveCompressionSettings } = require('../utils/imageCompression');
const { getOptimalConstraints } = require('../utils/webrtcOptimization');

/**
 * WebSocket Service để gửi real-time notifications
 */
class WebSocketService {
  
  /**
   * Thông báo khi exam được tạo mới
   */
  static notifyExamCreated(examData) {
    try {
      const io = getIO();
      
      // Broadcast to all connected users (instructors/admins)
      io.emit('exam_created', {
        examId: examData.id,
        title: examData.title,
        createdBy: examData.createdBy,
        scheduledTime: examData.scheduledTime,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam created notification sent: ${examData.id}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying exam created:', error);
    }
  }

  /**
   * Thông báo khi exam được cập nhật
   */
  static notifyExamUpdated(examId, updates, updatedBy) {
    try {
      emitToExam(examId, 'exam_updated', {
        examId,
        updates,
        updatedBy,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam updated notification sent: ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying exam updated:', error);
    }
  }

  /**
   * Thông báo khi exam bị xóa
   */
  static notifyExamDeleted(examId, deletedBy, reason) {
    try {
      emitToExam(examId, 'exam_deleted', {
        examId,
        deletedBy,
        reason,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam deleted notification sent: ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying exam deleted:', error);
    }
  }

  /**
   * Thông báo khi có student mới join exam
   */
  static notifyStudentJoined(examId, studentData) {
    try {
      emitToExam(examId, 'student_joined', {
        examId,
        studentId: studentData.id,
        studentName: studentData.name,
        joinTime: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Student joined notification sent: ${studentData.id} -> ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying student joined:', error);
    }
  }

  /**
   * Thông báo khi student submit bài thi
   */
  static notifyExamSubmitted(examId, studentId, submissionData) {
    try {
      emitToExam(examId, 'exam_submitted', {
        examId,
        studentId,
        submissionTime: submissionData.submittedAt,
        totalQuestions: submissionData.totalQuestions,
        answeredQuestions: submissionData.answeredQuestions,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam submission notification sent: ${studentId} -> ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying exam submitted:', error);
    }
  }

  /**
   * Gửi cảnh báo thời gian cho exam
   */
  static sendTimeWarning(examId, timeRemaining, warningType) {
    try {
      emitToExam(examId, 'time_warning', {
        examId,
        timeRemaining, // in seconds
        warningType, // '15min', '5min', '1min', 'overtime'
        message: this.getTimeWarningMessage(timeRemaining, warningType),
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Time warning sent to exam ${examId}: ${warningType}`);
    } catch (error) {
      console.error('[WebSocket] Error sending time warning:', error);
    }
  }

  /**
   * Gửi thông báo vi phạm từ proctoring system
   */
  static sendViolationAlert(examId, studentId, violationData) {
    try {
      emitToExam(examId, 'violation_detected', {
        examId,
        studentId,
        violationType: violationData.type,
        severity: violationData.severity,
        description: violationData.description,
        evidence: violationData.evidence, // screenshot, etc.
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Violation alert sent: ${violationData.type} by ${studentId} in ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error sending violation alert:', error);
    }
  }

  /**
   * Gửi cảnh báo trực tiếp đến student
   */
  static sendWarningToStudent(studentId, message, severity = 'medium', sentBy) {
    try {
      const success = emitToUser(studentId, 'warning_received', {
        message,
        severity,
        sentBy,
        timestamp: new Date().toISOString()
      });
      
      if (success) {
        console.log(`[WebSocket] Warning sent to student ${studentId}: ${message}`);
      } else {
        console.warn(`[WebSocket] Student ${studentId} not found or offline`);
      }
      
      return success;
    } catch (error) {
      console.error('[WebSocket] Error sending warning to student:', error);
      return false;
    }
  }

  /**
   * Thông báo khi exam bị terminate
   */
  static notifyExamTerminated(examId, reason, terminatedBy) {
    try {
      emitToExam(examId, 'exam_terminated', {
        examId,
        reason,
        terminatedBy,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam terminated notification sent: ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error notifying exam terminated:', error);
    }
  }

  /**
   * Broadcast system maintenance notification
   */
  static broadcastSystemNotification(message, type = 'info', targetRole = null) {
    try {
      const io = getIO();
      
      const notification = {
        message,
        type, // 'info', 'warning', 'error', 'success'
        targetRole, // null = all users, 'student', 'instructor', 'admin'
        timestamp: new Date().toISOString()
      };
      
      if (targetRole) {
        // Send to specific role only
        for (let [socketId, socket] of io.sockets.sockets) {
          if (socket.userRole === targetRole) {
            socket.emit('system_notification', notification);
          }
        }
      } else {
        // Broadcast to all
        io.emit('system_notification', notification);
      }
      
      console.log(`[WebSocket] System notification broadcasted: ${message}`);
    } catch (error) {
      console.error('[WebSocket] Error broadcasting system notification:', error);
    }
  }

  /**
   * Get exam room statistics
   */
  static async getExamRoomStats(examId) {
    try {
      const { getRoomUsers } = require('../config/websocket');
      const users = await getRoomUsers(`exam_${examId}`);
      
      const stats = {
        totalUsers: users.length,
        students: users.filter(u => u.role === 'student').length,
        instructors: users.filter(u => u.role === 'instructor').length,
        admins: users.filter(u => u.role === 'admin').length,
        users: users
      };
      
      return stats;
    } catch (error) {
      console.error('[WebSocket] Error getting exam room stats:', error);
      return null;
    }
  }

  /**
   * Helper method to generate time warning messages
   */
  static getTimeWarningMessage(timeRemaining, warningType) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    switch (warningType) {
      case '15min':
        return 'Còn 15 phút để hoàn thành bài thi';
      case '5min':
        return 'Còn 5 phút để hoàn thành bài thi';
      case '1min':
        return 'Còn 1 phút để hoàn thành bài thi';
      case 'overtime':
        return 'Thời gian làm bài đã hết. Bài thi sẽ được nộp tự động.';
      default:
        if (minutes > 0) {
          return `Còn ${minutes} phút ${seconds} giây`;
        } else {
          return `Còn ${seconds} giây`;
        }
    }
  }

  /**
   * Send real-time exam progress update
   */
  static sendExamProgress(examId, studentId, progress) {
    try {
      emitToExam(examId, 'exam_progress_updated', {
        examId,
        studentId,
        progress: {
          currentQuestion: progress.currentQuestion,
          totalQuestions: progress.totalQuestions,
          answeredQuestions: progress.answeredQuestions,
          timeSpent: progress.timeSpent,
          timeRemaining: progress.timeRemaining
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`[WebSocket] Exam progress updated: ${studentId} -> ${examId}`);
    } catch (error) {
      console.error('[WebSocket] Error sending exam progress:', error);
    }
  }

  /**
   * Send optimized streaming configuration to client
   */
  static sendStreamingConfig(userId, networkInfo, deviceCapabilities) {
    try {
      const constraints = getOptimalConstraints(networkInfo, deviceCapabilities);
      const compressionSettings = getAdaptiveCompressionSettings(networkInfo);
      
      const config = {
        webrtc: {
          constraints,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          enableAdaptiveBitrate: true,
          fallbackEnabled: true
        },
        compression: compressionSettings,
        fallback: {
          enabled: true,
          frameRate: networkInfo.effectiveType === 'slow-2g' ? 5 : 10,
          maxFrameSize: 50000
        },
        timestamp: new Date().toISOString()
      };

      const success = emitToUser(userId, 'streaming_config', config);
      
      if (success) {
        console.log(`[WebSocket] Streaming config sent to user ${userId}`);
      } else {
        console.warn(`[WebSocket] User ${userId} not found for streaming config`);
      }
      
      return success;
    } catch (error) {
      console.error('[WebSocket] Error sending streaming config:', error);
      return false;
    }
  }

  /**
   * Handle compressed frame data from client
   */
  static async handleCompressedFrame(examId, studentId, frameData) {
    try {
      const { frameBuffer, sessionId, timestamp, networkInfo } = frameData;
      
      // Get adaptive compression settings
      const compressionSettings = getAdaptiveCompressionSettings(networkInfo);
      
      // Re-compress if needed for AI processing
      let processedFrame = frameBuffer;
      if (frameBuffer && frameBuffer.length > 100000) {
        processedFrame = await compressImage(frameBuffer, compressionSettings.quality, {
          maxWidth: compressionSettings.maxWidth,
          maxHeight: compressionSettings.maxHeight,
          format: compressionSettings.format
        });
        
        console.log(`[WebSocket] Frame recompressed: ${frameBuffer.length} -> ${processedFrame.length} bytes`);
      }

      // Forward to proctoring service or AI processing
      emitToExam(examId, 'ai_frame_processed', {
        studentId,
        sessionId,
        frameBuffer: processedFrame,
        originalSize: frameBuffer?.length || 0,
        processedSize: processedFrame?.length || 0,
        timestamp,
        processingTime: Date.now() - (timestamp || Date.now())
      });

      return {
        success: true,
        originalSize: frameBuffer?.length || 0,
        processedSize: processedFrame?.length || 0
      };
    } catch (error) {
      console.error('[WebSocket] Error handling compressed frame:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate streaming fallback for failed WebRTC connections
   */
  static activateStreamingFallback(examId, studentId, proctorId, reason) {
    try {
      const fallbackConfig = {
        mode: 'websocket_streaming',
        reason,
        studentId,
        proctorId,
        settings: {
          frameRate: 10,
          quality: 0.6,
          maxFrameSize: 50000,
          format: 'jpeg'
        },
        timestamp: new Date().toISOString()
      };

      // Notify both student and proctor
      emitToUser(studentId, 'fallback_activated', fallbackConfig);
      emitToUser(proctorId, 'fallback_activated', fallbackConfig);
      
      // Notify exam room
      emitToExam(examId, 'streaming_fallback_activated', {
        studentId,
        proctorId,
        reason,
        timestamp: new Date().toISOString()
      });

      console.log(`[WebSocket] Streaming fallback activated: ${studentId} <-> ${proctorId}`);
      return true;
    } catch (error) {
      console.error('[WebSocket] Error activating streaming fallback:', error);
      return false;
    }
  }

  /**
   * Send network quality update
   */
  static sendNetworkQualityUpdate(examId, userId, qualityInfo) {
    try {
      emitToExam(examId, 'network_quality_update', {
        userId,
        quality: qualityInfo.quality,
        effectiveType: qualityInfo.effectiveType,
        downlink: qualityInfo.downlink,
        rtt: qualityInfo.rtt,
        timestamp: new Date().toISOString()
      });

      console.log(`[WebSocket] Network quality update: ${userId} -> ${qualityInfo.quality}`);
    } catch (error) {
      console.error('[WebSocket] Error sending network quality update:', error);
    }
  }

  /**
   * Get optimization statistics for monitoring
   */
  static async getOptimizationStats(examId) {
    try {
      const { getRoomUsers } = require('../config/websocket');
      const users = await getRoomUsers(`exam_${examId}`);
      
      const stats = {
        examId,
        totalUsers: users.length,
        userBreakdown: {
          students: users.filter(u => u.role === 'student').length,
          instructors: users.filter(u => u.role === 'instructor').length,
          admins: users.filter(u => u.role === 'admin').length
        },
        optimizationMetrics: {
          compressionEnabled: true,
          webrtcOptimizationEnabled: true,
          fallbackEnabled: true,
          adaptiveBitrateEnabled: true
        },
        timestamp: new Date().toISOString()
      };
      
      return stats;
    } catch (error) {
      console.error('[WebSocket] Error getting optimization stats:', error);
      return null;
    }
  }
}

module.exports = WebSocketService;
