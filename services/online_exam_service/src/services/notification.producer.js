// file: src/services/notification.producer.js

const { Kafka } = require('kafkajs');

// Khởi tạo Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'online-exam-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();
let isConnected = false;

/**
 * Hàm kết nối Producer (Sẽ gọi lúc khởi động server)
 */
async function connectProducer() {
  try {
    await producer.connect();
    isConnected = true;
    console.log('✅ [KAFKA] Đã kết nối thành công Kafka Producer!');
  } catch (error) {
    console.error('❌ [KAFKA ERROR] Lỗi kết nối Kafka Producer:', error);
    isConnected = false;
  }
}

/**
 * Hàm gửi thông báo vào topic 'notifications'
 * @param {Object} data - Payload thông báo
 */
async function sendNotification(data) {
  if (!isConnected) {
    console.warn('⚠️ [KAFKA] Producer chưa kết nối, bỏ qua gửi thông báo.');
    return;
  }

  try {
    const payload = {
      recipientUserId: data.recipientUserId, 
      title: data.title,
      content: data.content,
      type: data.type || "INFO",
      severity: data.severity || "low",
      data: data.extraData || {} 
    };

    await producer.send({
      topic: 'notifications', // Topic chuẩn bên Java của bạn
      messages: [
        { value: JSON.stringify(payload) },
      ],
    });

    console.log(`📤 [KAFKA] Đã bắn thông báo thành công cho user: ${data.recipientUserId}`);
  } catch (error) {
    console.error('❌ [KAFKA ERROR] Lỗi khi bắn thông báo lên topic:', error);
  }
}

// BẮT BUỘC PHẢI CÓ ĐOẠN NÀY ĐỂ BÊN NGOÀI GỌI ĐƯỢC
module.exports = {
  connectProducer,
  sendNotification
};