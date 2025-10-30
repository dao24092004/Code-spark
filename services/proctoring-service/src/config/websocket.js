// src/config/websocket.js
const { Server } = require('socket.io');
const proctoringService = require('../services/proctoring.service');

let io;

function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // << Sau này thay bằng domain frontend của bạn
      methods: ["GET", "POST"]
    }
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


    // === BƯỚC 2: NHẬN FRAME ẢNH TỪ SINH VIÊN (CHO AI) ===
    // Đây là logic cũ của bạn, được giữ nguyên để phục vụ AI
    socket.on('student_frame_for_ai', async (frameData) => {
      // frameData có thể là { frameBuffer, sessionId }
      const { frameBuffer, sessionId } = frameData;
      
      if (!sessionId) {
        console.error("Thiếu sessionId khi nhận frame_for_ai");
        return;
      }
      // Vẫn gọi service cũ để xử lý
      // Gửi kèm userId để biết sinh viên nào
      await proctoringService.handleProctoringData(sessionId, socket.data.userId, frameBuffer);
    });


    // === BƯỚC 3: XỬ LÝ LIVE STREAMING (WEBRTC SIGNALING) (UC21) ===
    
    // 3a. Giám thị yêu cầu xem stream của một sinh viên
    socket.on('proctor_request_stream', (data) => {
      const { studentIdToView } = data;
      console.log(`[WebSocket] Giám thị ${socket.data.userId} yêu cầu xem SV ${studentIdToView}`);
      
      // Gửi yêu cầu này đến *tất cả* client trong phòng thi
      // Client của sinh viên (studentIdToView) sẽ bắt và phản hồi
      socket.to(examId).emit('webrtc_offer_request', {
        proctorSocketId: socket.id,
        studentIdToView: studentIdToView
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
  // Export IO instance để các service khác có thể dùng
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};