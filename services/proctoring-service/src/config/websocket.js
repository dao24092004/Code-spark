const { WebSocketServer } = require('ws');
const proctoringService = require('../services/proctoring.service');

function initializeWebSocket(httpServer) {
  // Tạo một WebSocket server mới
  const wss = new WebSocketServer({ server: httpServer });

  // === PHẦN QUAN TRỌNG NHẤT: LẮNG NGHE SỰ KIỆN "CONNECTION" ===
  // Đoạn code bên trong hàm này sẽ chỉ chạy KHI có một client (thí sinh) kết nối thành công.
  wss.on('connection', (ws, req) => {
    // Lấy sessionId từ URL (ví dụ: ws://localhost:8082?sessionId=abc-123)
    const urlParams = new URLSearchParams(req.url.slice(1));
    const sessionId = urlParams.get('sessionId');

    // Nếu không có sessionId, từ chối kết nối
    if (!sessionId) {
      console.error('[WebSocket] Kết nối bị từ chối: Thiếu sessionId.');
      ws.close();
      return;
    }

    // Ghi log để xác nhận kết nối thành công
    console.log(`[WebSocket] Thí sinh đã kết nối cho phiên thi: ${sessionId}`);


    // === LẮNG NGHE SỰ KIỆN "MESSAGE" TỪ CLIENT NÀY ===
    // Chạy khi client gửi một tin nhắn (khung hình camera)
    ws.on('message', async (message) => {
      console.log(`[WebSocket] Nhận được dữ liệu từ phiên thi ${sessionId}`);
      // Gọi đến service để xử lý (message ở đây chính là imageBuffer)
      await proctoringService.handleProctoringData(sessionId, message);
    });


    // === LẮNG NGHE SỰ KIỆN "CLOSE" TỪ CLIENT NÀY ===
    // Chạy khi client này ngắt kết nối (đóng tab, mất mạng...)
    ws.on('close', () => {
      console.log(`[WebSocket] Thí sinh đã ngắt kết nối khỏi phiên thi: ${sessionId}`);
    });


    // === LẮNG NGHE SỰ KIỆN "ERROR" ===
    ws.on('error', (error) => {
      console.error(`[WebSocket] Lỗi kết nối ở phiên thi ${sessionId}:`, error);
    });
  });

  console.log('[WebSocket] Server đã khởi tạo và sẵn sàng nhận kết nối.');
}

module.exports = {
  initializeWebSocket,
};