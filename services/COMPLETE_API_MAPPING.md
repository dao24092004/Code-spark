# 🎯 Complete API Mapping - Frontend ↔ Gateway ↔ Backend

## Tổng quan kiến trúc

```
Frontend (Vite)           API Gateway              Backend Services
Port 4173/5173     →      Port 8080        →      Ports 3000-9011
                          
[Browser]          →      [Load Balancer]  →      [Microservices]
                          [CORS Handler]           [Business Logic]
                          [JWT Validator]
```

---

## 🔍 Chi tiết mapping từng service

### 1. Identity Service (Authentication & Users)

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/authApi.ts`, `userApi.ts` | |
| **Frontend Base URL** | `/identity/api/v1` | |
| **Frontend Calls** | `/identity/api/v1/auth/login` | Example |
| | | |
| **Gateway Route** | `/identity/**` | Matches all /identity/* |
| **Gateway Filter** | `StripPrefix=1` | Removes "/identity" |
| **Gateway Forwards** | `lb://identity-service` | Eureka load balancing |
| | | |
| **Backend Service** | `identity-service` | Spring Boot |
| **Backend Port** | `9010` | |
| **Backend Receives** | `/api/v1/auth/login` | After strip |
| **Backend Endpoint** | `@RequestMapping("/api/v1/auth")` | ✅ Match |

**Path flow:**
```
Frontend: /identity/api/v1/auth/login
   ↓ Gateway StripPrefix=1
Backend:  /api/v1/auth/login ✅
```

---

### 2. Course Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/courseApi.ts` | |
| **Frontend Base URL** | `/api/v1` | |
| **Frontend Calls** | `/api/v1/courses` | Example |
| | | |
| **Gateway Route** | `/api/v1/courses/**` | |
| **Gateway Filter** | `StripPrefix=0` | Keeps full path |
| **Gateway Forwards** | `http://localhost:9001` | Direct HTTP |
| | | |
| **Backend Service** | `course-service` | Spring Boot |
| **Backend Port** | `9001` | |
| **Backend Receives** | `/api/v1/courses` | No strip |
| **Backend Endpoint** | `@RequestMapping("/api/v1/courses")` | ✅ Match |

**Path flow:**
```
Frontend: /api/v1/courses
   ↓ Gateway StripPrefix=0
Backend:  /api/v1/courses ✅
```

---

### 3. Exam Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/examApi.ts` | |
| **Frontend Base URL** | `/exam` | |
| **Frontend Calls** | `/exam/exams` | Example |
| | | |
| **Gateway Route** | `/exam/**` | |
| **Gateway Filter** | `StripPrefix=1` | Removes "/exam" |
| **Gateway Forwards** | `lb://exam-service` | Eureka |
| | | |
| **Backend Service** | `exam-service` | Spring Boot |
| **Backend Port** | `9003` | |
| **Backend Receives** | `/exams` | After strip |
| **Backend Endpoint** | `@RequestMapping("/exams")` | ✅ Match |

**Path flow:**
```
Frontend: /exam/exams
   ↓ Gateway StripPrefix=1
Backend:  /exams ✅
```

---

### 4. Online Exam Service (FIXED)

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/onlineExamApi.ts` | |
| **Frontend Base URL** | `/api/exam` | |
| **Frontend Calls** | `/api/exam/api/quizzes/123` | Example |
| | | |
| **Gateway Route** | `/api/exam/**` | |
| **Gateway Filter** | `StripPrefix=2` | Removes "/api/exam" |
| **Gateway Forwards** | `http://localhost:3000` | Direct HTTP |
| | | |
| **Backend Service** | `online_exam_service` | Node.js |
| **Backend Port** | `3000` | |
| **Backend Receives** | `/api/quizzes/123` | After strip |
| **Backend Endpoint** | `app.use('/api', mainRouter)` | ✅ Match |

**Path flow:**
```
Frontend: /api/exam/api/quizzes/123
   ↓ Gateway StripPrefix=2
Backend:  /api/quizzes/123 ✅
```

**⚠️ Đã sửa:** `StripPrefix=21` → `StripPrefix=2`

---

### 5. Token Reward Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/tokenRewardApi.ts` | |
| **Frontend Base URL** | `/api/tokens` | |
| **Frontend Calls** | `/api/tokens/balance/1` | Example |
| | | |
| **Gateway Route** | `/api/tokens/**` | |
| **Gateway Filter** | `StripPrefix=0` | Keeps full path |
| **Gateway Forwards** | `http://localhost:3001` | Direct HTTP |
| | | |
| **Backend Service** | `token-reward-service` | Node.js |
| **Backend Port** | `3001` | |
| **Backend Receives** | `/api/tokens/balance/1` | No strip |
| **Backend Endpoint** | `app.use('/api/tokens', tokenRoutes)` | ✅ Match |

**Path flow:**
```
Frontend: /api/tokens/balance/1
   ↓ Gateway StripPrefix=0
Backend:  /api/tokens/balance/1 ✅
```

---

### 6. Multisig Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/multisigApi.ts` | |
| **Frontend Base URL** | `/api/v1/multisig` | |
| **Frontend Calls** | `/api/v1/multisig/wallets` | Example |
| | | |
| **Gateway Route** | `/api/v1/multisig/**` | |
| **Gateway Filter** | `StripPrefix=0` | Keeps full path |
| **Gateway Forwards** | `http://localhost:3003` | Direct HTTP |
| | | |
| **Backend Service** | `multisig-service` | Node.js |
| **Backend Port** | `3003` | Changed from 3001 |
| **Backend Receives** | `/api/v1/multisig/wallets` | No strip |
| **Backend Endpoint** | `app.use('/api/v1/multisig', routes)` | ✅ Match |

**Path flow:**
```
Frontend: /api/v1/multisig/wallets
   ↓ Gateway StripPrefix=0
Backend:  /api/v1/multisig/wallets ✅
```

---

### 7. Proctoring Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/proctoringApi.ts` | |
| **Frontend Base URL** | `/api/proctoring` | |
| **Frontend Calls** | `/api/proctoring/sessions` | Example |
| | | |
| **Gateway Route** | `/api/proctoring/**` | |
| **Gateway Filter** | `StripPrefix=1` | Removes "/api" |
| **Gateway Forwards** | `lb://proctoring-service` | Eureka |
| | | |
| **Backend Service** | `proctoring-service` | Node.js |
| **Backend Port** | `8082` | |
| **Backend Receives** | `/proctoring/sessions` | After strip |
| **Backend Endpoint** | `app.use('/proctoring', routes)` | ✅ Match |

**Backend có 3 routes hỗ trợ:**
- `/api/proctoring` ✅
- `/api/v1/proctoring` ✅
- `/proctoring` ✅ ← Gateway sử dụng route này

**Path flow:**
```
Frontend: /api/proctoring/sessions
   ↓ Gateway StripPrefix=1
Backend:  /proctoring/sessions ✅
```

---

### 8. Analytics Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `admin/services/analyticsApi.ts` | |
| **Frontend Base URL** | `/analytics` | |
| **Frontend Calls** | `/analytics/overview` | Example |
| | | |
| **Gateway Route** | `/analytics/**` | |
| **Gateway Filter** | `StripPrefix=0` | Keeps full path |
| **Gateway Forwards** | `lb://analytics-service` | Eureka |
| | | |
| **Backend Service** | `analytics-service` | Spring Boot |
| **Backend Port** | `9004` | |
| **Backend Receives** | `/analytics/overview` | No strip |
| **Backend Endpoint** | `@RequestMapping("analytics")` | ✅ Match |

**Path flow:**
```
Frontend: /analytics/overview
   ↓ Gateway StripPrefix=0
Backend:  /analytics/overview ✅
```

---

### 9. Copyright Service

| Component | Value | Notes |
|-----------|-------|-------|
| **Frontend File** | `services/api/copyrightApi.ts` | |
| **Frontend Base URL** | `/api/copyrights` | |
| **Frontend Calls** | `/api/copyrights/register` | Example |
| | | |
| **Gateway Route** | `/api/copyrights/**` | |
| **Gateway Filter** | `StripPrefix=1` | Removes "/api" |
| **Gateway Forwards** | `lb://copyright-service` | Eureka |
| | | |
| **Backend Service** | `copyright-service` | Node.js |
| **Backend Port** | `8009` | |
| **Backend Receives** | `/copyrights/register` | After strip |
| **Backend Endpoint** | `app.use('/copyrights', routes)` | ✅ Match |

**Backend có 3 routes hỗ trợ:**
- `/api/copyrights` ✅
- `/api/v1/copyrights` ✅
- `/copyrights` ✅ ← Gateway sử dụng route này

**Path flow:**
```
Frontend: /api/copyrights/register
   ↓ Gateway StripPrefix=1
Backend:  /copyrights/register ✅
```

---

## 📋 Checklist validation

- [x] Tất cả frontend API files đã cập nhật base URL
- [x] Tất cả paths đi qua API Gateway
- [x] Gateway routes đã được cấu hình đúng
- [x] StripPrefix values đã được kiểm tra và sửa
- [x] Backend endpoints khớp với gateway forwards
- [x] CORS chỉ ở API Gateway
- [x] JWT tokens được truyền qua headers
- [x] Port conflicts đã được giải quyết (multisig 3001→3003)

---

## 🚀 Ready for Testing

Tất cả các paths đã được khớp chính xác. Chỉ cần:

1. Cập nhật file `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

2. Xóa các biến không dùng:
   ```env
   # Remove these
   VITE_ANALYTICS_API_URL
   VITE_USER_API_URL
   VITE_EXAM_API_URL
   # ... etc
   ```

3. Khởi động lại API Gateway để áp dụng thay đổi StripPrefix

4. Test các chức năng chính trên frontend

✅ **All paths verified and ready!** 🎉

