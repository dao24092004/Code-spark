const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
// ĐƯỜNG DẪN QUAN TRỌNG: Lùi 2 cấp để tìm folder config
const config = require('../../config');

class AIService {
  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxOutputTokens,
        temperature: config.gemini.temperature,
      }
    });
  }

  // 1. Lấy dữ liệu từ Java Service
  async fetchCourseData() {
    try {
      const url = config.services.courseServiceUrl;
      console.log(`Fetching courses from: ${url}`);

      const response = await axios.get(url);
      // Java trả về { success: true, data: [...] }
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching courses from Java: ${error.message}`);
      // Trả về null để xử lý fallback
      return null;
    }
  }

  // 2. Format dữ liệu JSON thành văn bản cho Prompt
  formatCoursesForPrompt(courses) {
    if (!courses || courses.length === 0) return "Hiện tại chưa có dữ liệu khóa học.";

    return courses.map((c, index) => {
      const priceStr = c.price > 0 ? `${new Intl.NumberFormat('vi-VN').format(c.price)} VNĐ` : "Miễn phí";
      const aiNote = c.aiContext ? `\n   [Lưu ý cho AI: ${c.aiContext}]` : "";

      return `
KHÓA HỌC #${index + 1}:
- Tên: "${c.title}" (ID: ${c.id})
- Giá: ${priceStr} | Cấp độ: ${c.level} | Danh mục: ${c.category}
- Kỹ năng đạt được: ${c.skills || "N/A"}
- Mục tiêu: ${c.objectives || "N/A"}
- Mô tả ngắn: ${c.description}${aiNote}
-----------------------------------`;
    }).join('\n');
  }

  // 3. Hàm chat tư vấn
  async chatConsult(userMessage, history = []) {
    try {
      // B1: Lấy dữ liệu Real-time
      const rawCourses = await this.fetchCourseData();
      const coursesContext = this.formatCoursesForPrompt(rawCourses);

      // B2: Tạo System Prompt
      const systemPrompt = `
      VAI TRÒ: Bạn là Trợ lý Tư vấn Tuyển sinh thông minh.
      NHIỆM VỤ: Tư vấn khóa học phù hợp dựa trên danh sách bên dưới.
      
      DỮ LIỆU KHÓA HỌC (Real-time):
      ===================================
      ${coursesContext}
      ===================================
      
      YÊU CẦU:
      1. Chỉ tư vấn khóa học có trong danh sách trên.
      2. Nêu rõ Tên, Giá và Lý do phù hợp với nhu cầu người dùng.
      3. Trả lời ngắn gọn, chuyên nghiệp, dùng emoji.
      `;

      // B3: Chuẩn bị lịch sử chat
      const formattedHistory = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Đã hiểu danh sách khóa học." }] },
        ...history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ];

      // B4: Gọi Gemini
      const chat = this.model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();

    } catch (error) {
      console.error("AI Service Error:", error);
      return "Xin lỗi, hệ thống tư vấn đang bận. Vui lòng thử lại sau.";
    }
  }
}

module.exports = new AIService();