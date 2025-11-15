// src/config/websocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./index');

let io;

/**
 * Khởi tạo WebSocket server cho Online Exam Service
 * @param {http.Server} httpServer - HTTP server instance
 */
function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:4173", 
        "http://localhost:5173", 
        "http://localhost:8083",
        "http://localhost:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware xác thực JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.userId || decoded.id;
      socket.userRole = decoded.role;
      
      console.log(`[WebSocket] User ${socket.userId} (${socket.userRole}) authenticated`);
      next();
    } catch (error) {
      console.error('[WebSocket] Authentication failed:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Xử lý kết nối
  io.on('connection', (socket) => {
    console.log(`[WebSocket] User ${socket.userId} connected. Socket ID: ${socket.id}`);

    // === EXAM ROOM MANAGEMENT ===
    
    // Join exam room
    socket.on('join_exam', async (data) => {
      try {
        const { examId, role } = data; // role: 'student' | 'instructor' | 'admin'
        
        if (!examId) {
          socket.emit('error', { message: 'Exam ID is required' });
          return;
        }

        const roomName = `exam_${examId}`;
        socket.join(roomName);
        socket.currentExam = examId;
        socket.examRole = role || 'student';

        console.log(`[WebSocket] User ${socket.userId} joined exam ${examId} as ${role}`);
        
        // Thông báo cho những người khác trong phòng
        socket.to(roomName).emit('user_joined_exam', {
          userId: socket.userId,
          role: socket.examRole,
          timestamp: new Date().toISOString()
        });

        // Confirm join success
        socket.emit('exam_joined', {
          examId,
          role: socket.examRole,
          roomUsers: await getRoomUsers(roomName)
        });

      } catch (error) {
        console.error('[WebSocket] Error joining exam:', error);
        socket.emit('error', { message: 'Failed to join exam' });
      }
    });

    // Leave exam room
    socket.on('leave_exam', () => {
      if (socket.currentExam) {
        const roomName = `exam_${socket.currentExam}`;
        socket.leave(roomName);
        
        // Thông báo cho những người khác
        socket.to(roomName).emit('user_left_exam', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });

        console.log(`[WebSocket] User ${socket.userId} left exam ${socket.currentExam}`);
        socket.currentExam = null;
        socket.examRole = null;
      }
    });

    // === EXAM EVENTS ===

    // Exam started by instructor
    socket.on('start_exam', (data) => {
      if (socket.userRole !== 'instructor' && socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Unauthorized to start exam' });
        return;
      }

      const { examId, startTime, duration } = data;
      const roomName = `exam_${examId}`;
      
      io.to(roomName).emit('exam_started', {
        examId,
        startTime: startTime || new Date().toISOString(),
        duration,
        startedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`[WebSocket] Exam ${examId} started by user ${socket.userId}`);
    });

    // Exam ended by instructor
    socket.on('end_exam', (data) => {
      if (socket.userRole !== 'instructor' && socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Unauthorized to end exam' });
        return;
      }

      const { examId, reason } = data;
      const roomName = `exam_${examId}`;
      
      io.to(roomName).emit('exam_ended', {
        examId,
        reason: reason || 'Exam completed',
        endedBy: socket.userId,
        timestamp: new Date().toISOString()
      });

      console.log(`[WebSocket] Exam ${examId} ended by user ${socket.userId}`);
    });

    // Student submission
    socket.on('submit_answer', (data) => {
      const { examId, questionId, answer, timeRemaining } = data;
      
      if (socket.currentExam !== examId) {
        socket.emit('error', { message: 'Not joined to this exam' });
        return;
      }

      // Broadcast to instructors in the same exam
      const roomName = `exam_${examId}`;
      socket.to(roomName).emit('student_answer_submitted', {
        studentId: socket.userId,
        examId,
        questionId,
        timeRemaining,
        timestamp: new Date().toISOString()
      });

      // Confirm submission to student
      socket.emit('answer_submitted', {
        questionId,
        timestamp: new Date().toISOString()
      });
    });

    // === REAL-TIME NOTIFICATIONS ===

    // Send warning to student
    socket.on('send_warning', (data) => {
      if (socket.userRole !== 'instructor' && socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Unauthorized to send warnings' });
        return;
      }

      const { targetStudentId, examId, message, severity } = data;
      
      // Find target student socket
      const targetSocket = findUserSocket(targetStudentId);
      if (targetSocket) {
        targetSocket.emit('warning_received', {
          message,
          severity: severity || 'medium',
          sentBy: socket.userId,
          examId,
          timestamp: new Date().toISOString()
        });

        socket.emit('warning_sent', { targetStudentId, message });
        console.log(`[WebSocket] Warning sent from ${socket.userId} to ${targetStudentId}`);
      } else {
        socket.emit('error', { message: 'Target student not found or offline' });
      }
    });

    // Exam time warning (auto-generated)
    socket.on('time_warning', (data) => {
      const { examId, timeRemaining, warningType } = data;
      const roomName = `exam_${examId}`;
      
      io.to(roomName).emit('time_warning_broadcast', {
        examId,
        timeRemaining,
        warningType, // '15min', '5min', '1min'
        timestamp: new Date().toISOString()
      });
    });

    // === EXAM STATUS UPDATES ===

    // Student status update (online/offline, active/inactive)
    socket.on('update_status', (data) => {
      const { examId, status, metadata } = data;
      
      if (socket.currentExam !== examId) {
        socket.emit('error', { message: 'Not joined to this exam' });
        return;
      }

      const roomName = `exam_${examId}`;
      socket.to(roomName).emit('student_status_updated', {
        studentId: socket.userId,
        examId,
        status, // 'active', 'inactive', 'away', 'suspicious'
        metadata,
        timestamp: new Date().toISOString()
      });
    });

    // === DISCONNECT HANDLING ===
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] User ${socket.userId} disconnected. Reason: ${reason}`);
      
      if (socket.currentExam) {
        const roomName = `exam_${socket.currentExam}`;
        socket.to(roomName).emit('user_disconnected', {
          userId: socket.userId,
          examId: socket.currentExam,
          reason,
          timestamp: new Date().toISOString()
        });
      }
    });

    // === ERROR HANDLING ===
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('[WebSocket] Online Exam Service WebSocket server initialized');
}

/**
 * Get IO instance for use in other parts of the application
 */
function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
}

/**
 * Emit event to specific exam room
 */
function emitToExam(examId, event, data) {
  if (!io) {
    console.error('[WebSocket] IO not initialized');
    return;
  }
  
  const roomName = `exam_${examId}`;
  io.to(roomName).emit(event, data);
}

/**
 * Emit event to specific user
 */
function emitToUser(userId, event, data) {
  if (!io) {
    console.error('[WebSocket] IO not initialized');
    return;
  }

  const userSocket = findUserSocket(userId);
  if (userSocket) {
    userSocket.emit(event, data);
    return true;
  }
  return false;
}

/**
 * Find socket by user ID
 */
function findUserSocket(userId) {
  if (!io) return null;
  
  for (let [socketId, socket] of io.sockets.sockets) {
    if (socket.userId === userId) {
      return socket;
    }
  }
  return null;
}

/**
 * Get all users in a room
 */
async function getRoomUsers(roomName) {
  if (!io) return [];
  
  try {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room) return [];
    
    const users = [];
    for (let socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        users.push({
          userId: socket.userId,
          role: socket.examRole,
          socketId: socket.id
        });
      }
    }
    return users;
  } catch (error) {
    console.error('[WebSocket] Error getting room users:', error);
    return [];
  }
}

module.exports = {
  initializeWebSocket,
  getIO,
  emitToExam,
  emitToUser,
  getRoomUsers
};
