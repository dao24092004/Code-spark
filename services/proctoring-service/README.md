# Dịch vụ Giám sát Thi cử Trực tuyến (Proctoring Service)

Dự án này cung cấp một giải pháp giám sát thi cử trực tuyến toàn diện, sử dụng Trí tuệ Nhân tạo (AI) để phát hiện các hành vi gian lận và ghi lại các vi phạm nghiêm trọng lên Blockchain để đảm bảo tính minh bạch.

## Tính năng chính

- **Phân tích hành vi thời gian thực:** Nhận diện các hành vi đáng ngờ như:
  - Không có người trong khung hình (`FACE_NOT_DETECTED`)
  - Có nhiều người trong khung hình (`MULTIPLE_FACES`)
  - Sử dụng điện thoại di động (`MOBILE_PHONE_DETECTED`)
  - Nhìn ra khỏi màn hình (`LOOKING_AWAY`)
  - Che camera (`CAMERA_TAMPERED`)
- **Giao tiếp WebSocket:** Nhận dữ liệu hình ảnh từ client một cách hiệu quả và nhanh chóng.
- **Lưu trữ linh hoạt:**
  - Lưu tất cả các sự kiện vi phạm vào cơ sở dữ liệu PostgreSQL để truy xuất và phân tích.
  - Ghi lại các vi phạm nghiêm trọng lên Blockchain (sử dụng hợp đồng thông minh Solidity) để đảm bảo tính toàn vẹn và không thể chối cãi.
- **Kiến trúc Microservices:** Tách biệt dịch vụ AI và dịch vụ xử lý logic chính, giúp dễ dàng bảo trì và mở rộng.

## Công nghệ sử dụng

- **Backend:**
  - **Node.js**
  - **Express.js:** Xây dựng API và xử lý request.
  - **Sequelize:** ORM để tương tác với cơ sở dữ liệu PostgreSQL.
  - **WebSocket (`ws`):** Kênh giao tiếp hai chiều với client.
  - **Web3.js:** Tương tác với hợp đồng thông minh trên mạng Blockchain.
- **Dịch vụ AI (`ai-service`):**
  - **Python**
  - **FastAPI:** Xây dựng API hiệu năng cao cho xử lý ảnh.
  - **YOLOv8:** Mô hình nhận diện đối tượng (phát hiện điện thoại, sách vở...).
  - **MediaPipe:** Phân tích khuôn mặt và hướng nhìn.
  - **Scikit-learn:** Xây dựng mô hình phân loại hành vi vi phạm.
- **Blockchain:**
  - **Solidity:** Ngôn ngữ lập trình để viết hợp đồng thông minh.
- **Cơ sở dữ liệu:**
  - **PostgreSQL**

## Cài đặt và Khởi chạy

### Yêu cầu
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL
- Một mạng Ethereum (ví dụ: Ganache cho môi trường phát triển)

### Các bước cài đặt

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd services/proctoring-service
    ```

2.  **Cài đặt dependencies cho Backend:**
    ```bash
    npm install
    ```

3.  **Cài đặt dependencies cho AI Service:**
    ```bash
    cd ai-service
    pip install -r requirements.txt 
    # Lưu ý: Bạn cần tạo file requirements.txt từ các thư viện trong main.py
    # (fastapi, uvicorn, python-multipart, opencv-python, numpy, mediapipe, ultralytics, scikit-learn)
    cd ..
    ```

4.  **Cấu hình môi trường:**
    - Tạo file `.env` ở thư mục gốc `proctoring-service` và cấu hình các biến môi trường cần thiết (thông tin kết nối database, địa chỉ contract, khóa private...).
    ```env
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=proctoring_db
    PORT=8082
    WEB3_PROVIDER_URL=http://127.0.0.1:7545
    CONTRACT_ADDRESS=your_deployed_contract_address
    ADMIN_PRIVATE_KEY=your_ganache_private_key
    ```

5.  **Triển khai hợp đồng thông minh:**
    ```bash
    node scripts/deploy-contracts.js
    ```
    Cập nhật `CONTRACT_ADDRESS` trong file `.env` với địa chỉ được trả về.

### Khởi chạy dịch vụ

1.  **Khởi chạy AI Service:**
    ```bash
    cd ai-service
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

2.  **Khởi chạy Backend Service (từ thư mục gốc `proctoring-service`):**
    ```bash
    npm run dev
    ```

Sau khi hoàn tất, dịch vụ giám sát sẽ chạy trên cổng `8082` (hoặc cổng bạn đã cấu hình) và sẵn sàng nhận kết nối WebSocket.

## API Endpoints

### `GET /api/sessions/:sessionId/events`

Lấy tất cả các sự kiện vi phạm đã được ghi lại cho một phiên thi cụ thể.

- **Parameters:**
  - `sessionId` (string): ID của phiên thi.
- **Responses:**
  - `200 OK`: Trả về một mảng các đối tượng sự kiện.
    ```json
    [
      {
        "id": 1,
        "sessionId": "abc-123",
        "studentId": "student-001",
        "eventType": "MOBILE_PHONE_DETECTED",
        "severity": "high",
        "metadata": {},
        "timestamp": "2024-10-20T10:00:00.000Z"
      }
    ]
    ```
  - `400 Bad Request`: Nếu `sessionId` không được cung cấp.
  - `500 Internal Server Error`: Nếu có lỗi xảy ra ở phía server.

## Giao thức WebSocket

- **Endpoint:** `ws://<your-server-address>:<port>`
- **Luồng hoạt động:**
  1. Client kết nối đến WebSocket server với URL chứa `sessionId`. Ví dụ: `ws://localhost:8082?sessionId=session-xyz-789`.
  2. Client gửi từng khung hình (dưới dạng `Blob` hoặc `ArrayBuffer`) đến server.
  3. Server xử lý và không gửi phản hồi trực tiếp qua WebSocket. Các vi phạm sẽ được lưu vào DB và có thể được truy vấn qua API.

## Authorization

Các routes sau đây được bảo vệ và yêu cầu quyền cụ thể:

| Method | Route                               | Permission Required         |
|--------|-------------------------------------|-----------------------------|
| GET    | `/sessions/:sessionId/events`       | `proctoring:events:read`    |
| POST   | `/sessions/start-monitoring`        | `proctoring:session:start`  |