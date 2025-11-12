const { io } = require("socket.io-client");

const socket = io("http://localhost:8080", {  // Kết nối qua API Gateway
  path: "/ws",
  transports: ["websocket"],
  reconnection: true
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
  socket.emit("message", "Hello server!");
});

socket.on("welcome", (data) => {
  console.log("👋 Welcome:", data);
});

socket.on("message", (data) => {
  console.log("📨 Message:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});
