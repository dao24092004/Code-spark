const { Kafka } = require('kafkajs');

class NotificationProducerService {
  constructor(brokers, clientId = 'node-service') {
    this.kafka = new Kafka({ clientId, brokers });
    this.producer = this.kafka.producer();
    this.topic = 'notifications';
  }

  async connect() {
    await this.producer.connect();
    console.log(`[Kafka] Đã kết nối Producer: ${this.kafka.clientId}`);
  }

  async sendNotification(messageObj) {
    if (!messageObj.createdAt) {
      messageObj.createdAt = new Date().toISOString();
    }

    try {
      const payload = JSON.stringify(messageObj);
      await this.producer.send({
        topic: this.topic,
        messages: [{ value: payload }]
      });
      console.log(`[Kafka] Gửi thông báo thành công cho user: ${messageObj.recipientUserId}`);
    } catch (error) {
      console.error("[Kafka] Lỗi khi gửi tin nhắn:", error.message);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
module.exports = NotificationProducerService;