# Frontend → API Gateway → Backend Service Mapping

## Bảng mapping đầy đủ

| Frontend API File | Frontend Base URL | Gateway Route | Gateway Filters | Backend Service | Backend Endpoint | Status |
|-------------------|-------------------|---------------|-----------------|-----------------|------------------|--------|
| **authApi.ts** | `/identity/api/v1/auth` | `/identity/**` | StripPrefix=1 | identity-service:9010 | `/api/v1/auth/**` | ✅ |
| **userApi.ts** | `/identity/api/v1` | `/identity/**` | StripPrefix=1 | identity-service:9010 | `/api/v1/**` | ✅ |
| **courseApi.ts** | `/api/v1` | `/api/v1/courses/**` | StripPrefix=0 | course-service:9001 | `/api/v1/courses/**` | ✅ |
| **examApi.ts** | `/exam` | `/exam/**` | StripPrefix=1 | exam-service:9003 | `/exams/**` | ✅ |
| **onlineExamApi.ts** | `/api/exam` | `/api/exam/**` | StripPrefix=21 | online-exam-service:3000 | `/api/**` | ⚠️ |
| **tokenRewardApi.ts** | `/api/tokens` | `/api/tokens/**` | StripPrefix=0 | token-reward-service:3001 | `/api/tokens/**` | ✅ |
| **multisigApi.ts** | `/api/v1/multisig` | `/api/v1/multisig/**` | StripPrefix=0 | multisig-service:3003 | `/api/v1/multisig/**` | ✅ |
| **proctoringApi.ts** | `/api/proctoring` | `/api/proctoring/**` | StripPrefix=1 | proctoring-service:8082 | `/api/proctoring/**` | ✅ |
| **analyticsApi.ts** | `/analytics` | `/analytics/**` | StripPrefix=0 | analytics-service:9004 | `/analytics/**` | ✅ |
| **copyrightApi.ts** | `/api/copyrights` | `/api/copyrights/**` | StripPrefix=1 | copyright-service:8009 | `/api/copyrights/**` | ✅ |

---

## Chi tiết từng service

### 1. Authentication & Identity Service
```
Frontend URL: http://localhost:8080/identity/api/v1/auth/login
              ↓ Gateway strips "/identity"
Backend URL:  identity-service:9010/api/v1/auth/login
```

**Frontend API calls:**
- `POST /identity/api/v1/auth/login` → `/api/v1/auth/login` ✅
- `POST /identity/api/v1/auth/register` → `/api/v1/auth/register` ✅
- `POST /identity/api/v1/users/change-password` → `/api/v1/users/change-password` ✅
- `GET /identity/api/v1/users/{id}` → `/api/v1/users/{id}` ✅

---

### 2. Course Service
```
Frontend URL: http://localhost:8080/api/v1/courses
              ↓ Gateway keeps full path (StripPrefix=0)
Backend URL:  course-service:9001/api/v1/courses
```

**Frontend API calls:**
- `GET /api/v1/courses` → `/api/v1/courses` ✅
- `POST /api/v1/courses` → `/api/v1/courses` ✅
- `GET /api/v1/courses/{id}/materials` → `/api/v1/courses/{id}/materials` ✅
- `GET /api/v1/progress` → `/api/v1/progress` ✅

---

### 3. Exam Service (exam-service)
```
Frontend URL: http://localhost:8080/exam/exams
              ↓ Gateway strips "/exam"
Backend URL:  exam-service:9003/exams
```

**Frontend API calls:**
- `POST /exam/exams` → `/exams` ✅
- `GET /exam/exams/{id}` → `/exams/{id}` ✅
- `PUT /exam/exams/{id}` → `/exams/{id}` ✅
- `DELETE /exam/exams/{id}` → `/exams/{id}` ✅

---

### 4. Online Exam Service
```
Frontend URL: http://localhost:8080/api/exam/api/quizzes
              ↓ Gateway StripPrefix=21 ???
Backend URL:  online-exam-service:3000/api/quizzes
```

**⚠️ VẤNĐỀ: StripPrefix=21 có vẻ không đúng!**

**Frontend API calls:**
- `GET /api/exam/api/quizzes/{id}` 
- `POST /api/exam/api/quizzes/{id}/start`
- `POST /api/exam/api/submissions/{id}/submit`

**Cần sửa gateway route:**
```yaml
- id: online-exam-service
  uri: http://localhost:3000
  predicates:
    - Path=/api/exam/**
  filters:
    - StripPrefix=2  # Strip "/api/exam" → backend receives "/api/..."
```

---

### 5. Token Reward Service
```
Frontend URL: http://localhost:8080/api/tokens/balance/1
              ↓ Gateway keeps full path
Backend URL:  token-reward-service:3001/api/tokens/balance/1
```

**Frontend API calls:**
- `GET /api/tokens/balance/{id}` → `/api/tokens/balance/{id}` ✅
- `POST /api/tokens/grant` → `/api/tokens/grant` ✅
- `POST /api/tokens/spend` → `/api/tokens/spend` ✅
- `GET /api/tokens/admin/stats` → `/api/tokens/admin/stats` ✅

---

### 6. Multisig Service
```
Frontend URL: http://localhost:8080/api/v1/multisig/
              ↓ Gateway keeps full path
Backend URL:  multisig-service:3003/api/v1/multisig/
```

**Frontend API calls:**
- `GET /api/v1/multisig/` → `/api/v1/multisig/` ✅
- `POST /api/v1/multisig/` → `/api/v1/multisig/` ✅
- `GET /api/v1/multisig/{id}` → `/api/v1/multisig/{id}` ✅
- `GET /api/v1/multisig/{id}/transactions` → `/api/v1/multisig/{id}/transactions` ✅

---

### 7. Proctoring Service
```
Frontend URL: http://localhost:8080/api/proctoring/sessions
              ↓ Gateway strips "/api"
Backend URL:  proctoring-service:8082/api/proctoring/sessions
```

**⚠️ VẤNĐỀ: Frontend gọi `/api/proctoring` nhưng gateway strip `/api` → backend nhận `/proctoring`**

**Cần kiểm tra backend có endpoint `/proctoring` hay `/api/proctoring`?**

---

### 8. Analytics Service
```
Frontend URL: http://localhost:8080/analytics/...
              ↓ Gateway keeps full path
Backend URL:  analytics-service:9004/analytics/...
```

**Frontend API calls:**
- `GET /analytics/...` → `/analytics/...` ✅

---

### 9. Copyright Service
```
Frontend URL: http://localhost:8080/api/copyrights/register
              ↓ Gateway strips "/api"
Backend URL:  copyright-service:8009/api/copyrights/register
```

**⚠️ VẤNĐỀ: Frontend gọi `/api/copyrights` nhưng gateway strip 1 prefix**

**Cần kiểm tra:**
- Path `/api/copyrights/**` strip 1 → backend nhận `copyrights/**`
- Backend có endpoint `/copyrights/**` hay `/api/copyrights/**`?

---

## ⚠️ Các vấn đề cần sửa

### 1. Online Exam Service - StripPrefix sai
**Hiện tại:**
```yaml
- id: online-exam-service
  predicates:
    - Path=/api/exam/**
  filters:
    - StripPrefix=21  # ❌ SAI!
```

**Nên sửa thành:**
```yaml
- id: online-exam-service
  predicates:
    - Path=/api/exam/**
  filters:
    - StripPrefix=2  # Strip "/api/exam" → "/api/..."
```

### 2. Proctoring Service - Cần xác nhận endpoint
**Gateway config:**
```yaml
- id: proctoring-http
  predicates:
    - Path=/api/proctoring/**
  filters:
    - StripPrefix=1  # Strip "/api" → "/proctoring/**"
```

**Frontend gọi:** `/api/proctoring/sessions`
**Backend nhận:** `/proctoring/sessions`

**Cần kiểm tra backend có endpoint này không?**

### 3. Copyright Service - Cần xác nhận endpoint
**Gateway config:**
```yaml
- id: copyright-service
  predicates:
    - Path=/api/copyrights/**
  filters:
    - StripPrefix=1  # Strip "/api" → "/copyrights/**"
```

**Frontend gọi:** `/api/copyrights/register`
**Backend nhận:** `/copyrights/register`

**Cần kiểm tra backend có endpoint này không?**

---

## ✅ Các service đã mapping đúng

1. ✅ **identity-service** - Frontend `/identity/api/v1/auth` → Backend `/api/v1/auth`
2. ✅ **course-service** - Frontend `/api/v1/courses` → Backend `/api/v1/courses`
3. ✅ **exam-service** - Frontend `/exam/exams` → Backend `/exams`
4. ✅ **token-reward-service** - Frontend `/api/tokens` → Backend `/api/tokens`
5. ✅ **multisig-service** - Frontend `/api/v1/multisig` → Backend `/api/v1/multisig`
6. ✅ **analytics-service** - Frontend `/analytics` → Backend `/analytics`

---

## Hành động cần làm

1. ✅ Sửa StripPrefix của online-exam-service từ 21 → 2
2. ⚠️ Xác nhận endpoint của proctoring-service
3. ⚠️ Xác nhận endpoint của copyright-service
4. ✅ Test tất cả endpoints sau khi sửa

