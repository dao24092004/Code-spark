# Đặc tả Kỹ thuật: Hệ thống Thi trực tuyến

## 1. Giới thiệu
Tài liệu này đặc tả các yêu cầu cho hệ thống thi trực tuyến. Hệ thống này bao gồm nhiều service để đảm bảo tính bảo mật, toàn vẹn và hiệu quả.

## 2. Danh sách Service
- **config-service**: Quản lý cấu hình tập trung (Git repo), refresh runtime.
- **discovery-service**: Dịch vụ phát hiện service (Eureka).
- **api-gateway-service**: Định tuyến request, kiểm tra JWT.
- **identity-service**: Xác thực (đăng nhập/MFA/OAuth2), phân quyền (JWT), PostgreSQL.
- **users-service**: Quản lý hồ sơ cá nhân, lịch sử thi.
- **exams-service**: Tạo kỳ thi, ngân hàng câu hỏi, sinh đề ngẫu nhiên, lịch thi.
- **exam-sessions-service**: Giao diện làm bài, lockdown browser, nộp bài, chấm điểm.
- **proctoring-service**: Giám sát camera AI, phát hiện gian lận, live proctoring.
- **blockchain-service**: Ghi kết quả thi lên Ethereum, chống sửa điểm.
- **token-reward-service**: Cấp token, giao dịch token.
- **analytics-service**: Báo cáo kết quả, dashboard, gợi ý học tập.
- **copyright-service**: Hash tài liệu (PDF/video), lưu blockchain, xác minh bản quyền.

## 3. User Stories
- Là học sinh, tôi muốn làm bài thi an toàn.
- Là giảng viên, tôi muốn tạo kỳ thi và xem báo cáo.
- Là admin, tôi muốn quản lý token và blockchain.

## 4. Luồng Hoạt Động
User đăng nhập (identity-service → api-gateway-service) → đăng ký thi (exams-service) → làm bài (exam-sessions-service với proctoring-service) → nộp → chấm điểm + token reward (token-reward-service) → báo cáo (analytics-service) + verify copyright (copyright-service).

## 5. Yêu Cầu Kỹ Thuật
- **Frontend**: React (Login, Exam UI, Dashboard)
- **Backend**: Spring Boot (REST API, JWT, MongoDB/PostgreSQL, RabbitMQ)
- **Blockchain**: Ethereum smart contract

## 6. Rủi Ro
- **Rủi ro về bảo mật**: Cần đảm bảo an toàn cho dữ liệu người dùng và đề thi.
- **Rủi ro về hiệu năng**: Hệ thống cần xử lý được lượng lớn người dùng cùng lúc.

## 7. Quickstart
Hướng dẫn nhanh để cài đặt và chạy thử hệ thống. Lệnh `implement` và `/plan` sẽ được sử dụng để thực thi kế hoạch.
