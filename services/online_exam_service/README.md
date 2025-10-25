# Online Exam Service

Dịch vụ backend cho hệ thống thi trực tuyến, cho phép sinh viên làm bài kiểm tra, nộp bài và được chấm điểm. Điểm số cuối cùng được ghi lại trên một hợp đồng thông minh (Smart Contract) trên blockchain.

## Tính năng chính

-   **Làm bài thi:** Sinh viên có thể bắt đầu và nộp bài thi.
-   **Chấm điểm:** Hỗ trợ cả chấm điểm tự động cho câu hỏi trắc nghiệm và chấm điểm thủ công bởi giảng viên.
-   **Tích hợp Blockchain:** Điểm số cuối cùng được ghi lại một cách an toàn và minh bạch trên blockchain sử dụng Web3.js và hợp đồng thông minh Solidity.
-   **Tích hợp giám sát:** Gửi yêu cầu đến một dịch vụ giám sát (proctoring service) khi sinh viên bắt đầu làm bài.

## Cấu trúc thư mục

```
.
├───.env                # (Cần tạo) Chứa các biến môi trường
├───package.json
├───server.js           # Điểm khởi đầu của ứng dụng
├───scripts/
│   └───deploy-contracts.js # Script để deploy Smart Contract
│   └───seed.js             # (Sẽ được tạo) Script để thêm dữ liệu mẫu
└───src/
    ├───config/         # Cấu hình (database, web3)
    ├───contracts/      # Mã nguồn Smart Contract (Solidity)
    ├───controllers/    # Tầng xử lý request/response
    ├───dtos/           # Định nghĩa các đối tượng truyền dữ liệu (Data Transfer Objects)
    ├───mappers/        # Chuyển đổi giữa các đối tượng DB và DTO
    ├───models/         # Định nghĩa các model cho Sequelize (ánh xạ bảng DB)
    ├───routes/         # Định nghĩa các API endpoint
    └───services/       # Tầng xử lý logic nghiệp vụ chính
```

## Yêu cầu cài đặt

-   [Node.js](https://nodejs.org/) (phiên bản >= 18)
-   [PostgreSQL](https://www.postgresql.org/download/)
-   Một môi trường blockchain cục bộ như [Ganache](https://trufflesuite.com/ganache/) để kiểm thử.

## Hướng dẫn cài đặt

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd services/online_exam_service
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Thiết lập biến môi trường:**
    Tạo một file `.env` ở thư mục gốc và sao chép nội dung từ file `.env.example` (nếu có) hoặc sử dụng cấu trúc dưới đây.

    ```ini
    # Server
    PORT=3000

    # PostgreSQL Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=online_exam_db

    # Blockchain (Ganache)
    WEB3_PROVIDER_URL=http://127.0.0.1:7545
    OWNER_ACCOUNT_PRIVATE_KEY=your_ganache_account_private_key
    GRADE_LEDGER_CONTRACT_ADDRESS=

    # Services
    PROCTORING_SERVICE_URL=http://localhost:3001
    ```

4.  **Thiết lập Database:**
    -   Kết nối vào PostgreSQL và tạo một database mới có tên khớp với `DB_NAME` trong file `.env`.
    -   Chạy lệnh sau để Sequelize tự động tạo các bảng dựa trên models:
        ```bash
        # (Lưu ý: Cần có cơ chế migration trong thực tế, tạm thời chạy app để tạo bảng)
        npm start 
        # Sau khi thấy log kết nối DB thành công, có thể dừng lại (Ctrl+C)
        ```

5.  **Biên dịch và Deploy Smart Contract:**
    -   Cài đặt `solc` (trình biên dịch Solidity) nếu chưa có.
    -   Biên dịch contract:
        ```bash
        solcjs --abi --bin -o src/contracts/build src/contracts/GradeLedger.sol
        ```
    -   Deploy contract lên mạng blockchain cục bộ (Ganache):
        ```bash
        node scripts/deploy-contracts.js
        ```
    -   **QUAN TRỌNG:** Sao chép địa chỉ contract được in ra và dán vào biến `GRADE_LEDGER_CONTRACT_ADDRESS` trong file `.env`.

6.  **(Tùy chọn) Thêm dữ liệu mẫu:**
    Chạy script sau để thêm các bài quiz, câu hỏi và đáp án mẫu vào database.
    ```bash
    npm run seed
    ```

## Chạy ứng dụng

-   **Chế độ phát triển (với auto-reload):**
    ```bash
    npm run dev
    ```

-   **Chế độ production:**
    ```bash
    npm start
    ```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

## API Endpoints chính

-   `POST /api/quizzes/{quizId}/start`: Sinh viên bắt đầu một bài thi.
-   `POST /api/submissions/{submissionId}/submit`: Sinh viên nộp bài.
-   `POST /api/instructor/quizzes/answers/{answerId}/grade`: Giảng viên chấm điểm một câu trả lời tự luận.

## Authorization

Các routes sau đây được bảo vệ và yêu cầu quyền cụ thể:

| Method | Route                                                 | Permission Required |
|--------|-------------------------------------------------------|---------------------|
| POST   | `/api/quizzes/:quizId/start`                          | `quiz:start`        |
| POST   | `/api/submissions/:submissionId/submit`               | `quiz:submit`       |
| POST   | `/api/instructor/quizzes/answers/:answerId/grade`     | `grading:manual`    |