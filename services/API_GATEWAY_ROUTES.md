# API Gateway Routes Configuration

## Tổng quan
Tất cả các services đều được truy cập thông qua API Gateway tại `http://localhost:8080`

---

## ✅ Services đã cấu hình trong API Gateway

| Service | Port | Type | Gateway Route | Backend Endpoint | Discovery |
|---------|------|------|---------------|------------------|-----------|
| **identity-service** | 9010 | Java | `/identity/**` | `/api/v1/auth/**`, `/api/v1/users/**`, `/api/webauthn/**` | Eureka |
| **profile-service** | 9011 | Java | `/profile/**` | `/api/v1/profiles/**` | Eureka |
| **user-service** | 9010 | Java | `/user/**` | `/api/v1/users/**` | Eureka |
| **course-service** | 9001 | Java | `/api/v1/courses/**`, `/api/v1/progress/**` | `/api/v1/courses/**`, `/api/progress/**` | HTTP |
| **exam-service** | 9003 | Java | `/exam/**` | `/exams/**` | Eureka |
| **file-service** | 9002 | Java | `/files/**` | `/api/v1/files/**` | Eureka |
| **notification-service** | 9009 | Java | `/api/v1/notifications/**` | `/api/v1/notifications/**` | Eureka |
| **analytics-service** | 9004 | Java | `/analytics/**` | `/analytics/**` | Eureka |
| **copyright-service** | 8009 | Node.js | `/api/copyrights/**` | `/api/copyrights/**`, `/api/v1/copyrights/**` | Eureka |
| **token-reward-service** | 3001 | Node.js | `/api/tokens/**` | `/api/tokens/**` | HTTP |
| **multisig-service** | 3003 | Node.js | `/api/v1/multisig/**` | `/api/v1/multisig/**` | HTTP |
| **proctoring-service** | 8082 | Node.js | `/ws/**` (WebSocket), `/api/proctoring/**` (HTTP) | `/api/proctoring/**` | Eureka (WS) |
| **online-exam-service** | 3000 | Node.js | `/api/exam/**` | `/api/**` | HTTP |
| **organization-service** | 8008 | Node.js | `/api/organization/**` | `/api/v1/organization/**` | HTTP |
| **ai-service** | 3002 | Node.js | `/api/v1/ai/**` | `/api/v1/ai/**` | HTTP |

---

## ❌ Services KHÔNG cần route qua Gateway

| Service | Port | Lý do |
|---------|------|-------|
| **discovery-service** | 9999 | Eureka Server - Infrastructure service |
| **config-server** | 8888 | Config Server - Infrastructure service |
| **api-gateway** | 8080 | Gateway itself |
| **common-library** | N/A | Library module, không phải service |
| **admin-service** | N/A | Empty service, chưa implement |

---

## Cách truy cập từ Frontend

### 1. **Authentication & Authorization**
```
POST http://localhost:8080/identity/api/v1/auth/login
POST http://localhost:8080/identity/api/v1/auth/register
POST http://localhost:8080/identity/api/v1/users/change-password
```

### 2. **User Management**
```
GET  http://localhost:8080/user/api/v1/users
POST http://localhost:8080/user/api/v1/users
```

### 3. **Profile Management**
```
GET  http://localhost:8080/profile/api/v1/profiles/me
PUT  http://localhost:8080/profile/api/v1/profiles/me
```

### 4. **Course Management**
```
GET  http://localhost:8080/api/v1/courses
POST http://localhost:8080/api/v1/courses
GET  http://localhost:8080/api/v1/progress
```

### 5. **Exam Management**
```
GET  http://localhost:8080/exam/exams
POST http://localhost:8080/exam/exams
```

### 6. **File Management**
```
GET  http://localhost:8080/files/api/v1/files
POST http://localhost:8080/files/api/v1/files
```

### 7. **Notifications (SSE)**
```
GET  http://localhost:8080/api/v1/notifications/stream
```

### 8. **Analytics**
```
GET  http://localhost:8080/analytics/...
POST http://localhost:8080/analytics/...
```

### 9. **AI Services**
```
POST http://localhost:8080/api/v1/ai/generate
POST http://localhost:8080/api/v1/ai/chat
POST http://localhost:8080/api/v1/ai/analyze/course
POST http://localhost:8080/api/v1/ai/generate/quiz
```

### 10. **Token Rewards**
```
GET  http://localhost:8080/api/tokens/balance
POST http://localhost:8080/api/tokens/grant
```

### 11. **Multisig Wallet**
```
GET  http://localhost:8080/api/v1/multisig/wallets
POST http://localhost:8080/api/v1/multisig/wallets
```

### 12. **Proctoring**
```
# HTTP
GET  http://localhost:8080/api/proctoring/sessions
POST http://localhost:8080/api/proctoring/sessions

# WebSocket
ws://localhost:8080/ws
```

### 13. **Online Exam**
```
GET  http://localhost:8080/api/exam/...
POST http://localhost:8080/api/exam/...
```

### 14. **Copyright**
```
GET  http://localhost:8080/api/copyrights
POST http://localhost:8080/api/copyrights
```

### 15. **Organization**
```
GET  http://localhost:8080/api/organization
POST http://localhost:8080/api/organization
```

---

## Lưu ý quan trọng

### CORS Configuration
- ✅ **Chỉ API Gateway xử lý CORS headers**
- ✅ Tất cả backend services đã **TẮT CORS** để tránh duplicate headers
- ✅ WebSocket CORS được giữ riêng cho handshake

### Service Discovery
- **Eureka-based (lb://)**: Tự động load balancing và service discovery
  - identity-service, profile-service, user-service, exam-service, file-service
  - notification-service, analytics-service, copyright-service
  - proctoring-service (WebSocket)
  
- **Direct HTTP**: Kết nối trực tiếp đến service
  - course-service, token-reward-service, multisig-service
  - online-exam-service, organization-service, ai-service

### Port Assignments
- **Port 3000**: online-exam-service
- **Port 3001**: token-reward-service
- **Port 3002**: ai-service
- **Port 3003**: multisig-service (đã sửa từ 3001 để tránh conflict)
- **Port 8008**: organization-service
- **Port 8009**: copyright-service
- **Port 8080**: api-gateway
- **Port 8082**: proctoring-service
- **Port 9xxx**: Java Spring Boot services (identity, profile, user, course, exam, file, notification, analytics)

---

## Khởi động tất cả services

1. **Infrastructure Services** (khởi động trước):
   ```bash
   # Discovery Service (Eureka)
   cd discovery-service && mvn spring-boot:run
   
   # Config Server (optional)
   cd config-server && mvn spring-boot:run
   ```

2. **API Gateway**:
   ```bash
   cd api-gateway && mvn spring-boot:run
   ```

3. **Backend Services** (có thể chạy song song):
   ```bash
   # Java Services
   cd identity-service && mvn spring-boot:run
   cd user-service && mvn spring-boot:run
   cd profile-service && mvn spring-boot:run
   cd course-service && mvn spring-boot:run
   cd exam-service && mvn spring-boot:run
   cd file-service && mvn spring-boot:run
   cd notification-service && mvn spring-boot:run
   cd analytics-service && mvn spring-boot:run
   
   # Node.js Services
   cd token-reward-service && npm start
   cd multisig-service && npm start
   cd online_exam_service && npm start
   cd proctoring-service && npm start
   cd copyright-service && npm start
   cd organization_service && npm start
   cd ai-service && npm start
   ```

---

## Environment Variables cần thiết

- `EUREKA_URL`: http://localhost:9999/eureka/ (cho Eureka clients)
- `JWT_SECRET`: Secret key cho JWT token
- `GEMINI_API_KEY`: API key cho AI service
- Các biến DB cho mỗi service (xem file .env hoặc application.properties)

