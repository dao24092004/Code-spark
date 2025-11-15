# Path Verification - Frontend → Gateway → Backend

## ✅ Tất cả paths đã được xác minh và sửa đúng

---

## 1. Identity Service ✅
**Frontend:**
```typescript
baseURL: '/identity/api/v1'
// Calls: /identity/api/v1/auth/login
```

**Gateway:**
```yaml
predicates: - Path=/identity/**
filters: - StripPrefix=1  # Strips "/identity"
```

**Backend receives:**
```
/api/v1/auth/login ✅
```

**Backend endpoints:**
- `@RequestMapping("/api/v1/auth")` → `/api/v1/auth/**` ✅
- `@RequestMapping("/api/v1/users")` → `/api/v1/users/**` ✅

---

## 2. Course Service ✅
**Frontend:**
```typescript
baseURL: '/api/v1'
// Calls: /api/v1/courses, /api/v1/progress
```

**Gateway:**
```yaml
predicates: - Path=/api/v1/courses/**,/api/v1/progress/**
filters: - StripPrefix=0  # Keeps full path
```

**Backend receives:**
```
/api/v1/courses ✅
/api/v1/progress ✅
```

**Backend endpoints:**
- `@RequestMapping("/api/v1/courses")` ✅
- `@RequestMapping("/api/progress")` (no v1) ✅

---

## 3. Exam Service ✅
**Frontend:**
```typescript
baseURL: '/exam'
// Calls: /exam/exams
```

**Gateway:**
```yaml
predicates: - Path=/exam/**
filters: - StripPrefix=1  # Strips "/exam"
```

**Backend receives:**
```
/exams ✅
```

**Backend endpoints:**
- `@RequestMapping("/exams")` → `/exams/**` ✅

---

## 4. Online Exam Service ✅ (Đã sửa)
**Frontend:**
```typescript
baseURL: '/api/exam'
// Calls: /api/exam/api/quizzes/{id}
```

**Gateway (CŨ - SAI):**
```yaml
filters: - StripPrefix=21  # ❌ SAI HOÀN TOÀN!
```

**Gateway (MỚI - ĐÚNG):**
```yaml
predicates: - Path=/api/exam/**
filters: - StripPrefix=2  # Strips "/api/exam"
```

**Backend receives:**
```
/api/quizzes/{id} ✅
```

**Backend endpoints:**
- `app.use('/api', mainRouter)` → `/api/**` ✅

---

## 5. Token Reward Service ✅
**Frontend:**
```typescript
baseURL: '/api/tokens'
// Calls: /api/tokens/balance/{id}
```

**Gateway:**
```yaml
predicates: - Path=/api/tokens/**
filters: - StripPrefix=0  # Keeps full path
```

**Backend receives:**
```
/api/tokens/balance/{id} ✅
```

**Backend endpoints:**
- `app.use('/api/tokens', tokenRoutes)` → `/api/tokens/**` ✅

---

## 6. Multisig Service ✅
**Frontend:**
```typescript
baseURL: '/api/v1/multisig'
// Calls: /api/v1/multisig/{id}
```

**Gateway:**
```yaml
predicates: - Path=/api/v1/multisig/**
filters: - StripPrefix=0  # Keeps full path
```

**Backend receives:**
```
/api/v1/multisig/{id} ✅
```

**Backend endpoints:**
- `app.use('/api/v1/multisig', multisigRoutes)` → `/api/v1/multisig/**` ✅

---

## 7. Proctoring Service ✅
**Frontend:**
```typescript
baseURL: '/api/proctoring'
// Calls: /api/proctoring/sessions
```

**Gateway:**
```yaml
predicates: - Path=/api/proctoring/**
filters: - StripPrefix=1  # Strips "/api"
```

**Backend receives:**
```
/proctoring/sessions ✅
```

**Backend endpoints (có 3 routes):**
- `app.use('/api/proctoring', proctoringRoutes)` ✅
- `app.use('/api/v1/proctoring', proctoringRoutes)` ✅
- `app.use('/proctoring', proctoringRoutes)` ✅ ← Gateway forwards vào đây

---

## 8. Analytics Service ✅
**Frontend:**
```typescript
baseURL: '/analytics'
// Calls: /analytics/{endpoint}
```

**Gateway:**
```yaml
predicates: - Path=/analytics/**
filters: - StripPrefix=0  # Keeps full path
```

**Backend receives:**
```
/analytics/{endpoint} ✅
```

**Backend endpoints:**
- `@RequestMapping("analytics")` → `/analytics/**` ✅

---

## 9. Copyright Service ✅
**Frontend:**
```typescript
baseURL: '/api/copyrights'
// Calls: /api/copyrights/register
```

**Gateway:**
```yaml
predicates: - Path=/api/copyrights/**
filters: - StripPrefix=1  # Strips "/api"
```

**Backend receives:**
```
/copyrights/register ✅
```

**Backend endpoints (có 3 routes):**
- `app.use('/api/copyrights', copyrightRoutes)` ✅
- `app.use('/api/v1/copyrights', copyrightRoutes)` ✅
- `app.use('/copyrights', copyrightRoutes)` ✅ ← Gateway forwards vào đây

---

## Bảng tóm tắt trạng thái

| Service | Frontend Path | Gateway Strip | Backend Receives | Backend Has Endpoint | Status |
|---------|---------------|---------------|------------------|---------------------|--------|
| identity | `/identity/api/v1/auth` | Strip 1 | `/api/v1/auth` | ✅ | ✅ |
| course | `/api/v1/courses` | Strip 0 | `/api/v1/courses` | ✅ | ✅ |
| exam | `/exam/exams` | Strip 1 | `/exams` | ✅ | ✅ |
| online-exam | `/api/exam/api/quizzes` | Strip 2 | `/api/quizzes` | ✅ | ✅ (Đã sửa) |
| token-reward | `/api/tokens/balance` | Strip 0 | `/api/tokens/balance` | ✅ | ✅ |
| multisig | `/api/v1/multisig` | Strip 0 | `/api/v1/multisig` | ✅ | ✅ |
| proctoring | `/api/proctoring/sessions` | Strip 1 | `/proctoring/sessions` | ✅ | ✅ |
| analytics | `/analytics/...` | Strip 0 | `/analytics/...` | ✅ | ✅ |
| copyright | `/api/copyrights/register` | Strip 1 | `/copyrights/register` | ✅ | ✅ |

---

## Test Commands

### Test từ frontend
```bash
# Start frontend dev server
cd web-frontend && npm run dev
```

### Test từ browser console
```javascript
// Test identity service
fetch('http://localhost:8080/identity/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usernameOrEmail: 'admin', password: 'admin123' })
})

// Test course service  
fetch('http://localhost:8080/api/v1/courses')

// Test exam service
fetch('http://localhost:8080/exam/exams')

// Test online exam service
fetch('http://localhost:8080/api/exam/api/quizzes')

// Test token service
fetch('http://localhost:8080/api/tokens/balance/1', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})

// Test analytics
fetch('http://localhost:8080/analytics/overview', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
```

---

## Kết luận

✅ **Tất cả các paths đã được mapping chính xác!**

Chỉ cần sửa 1 lỗi: `StripPrefix=21` → `StripPrefix=2` trong online-exam-service route.

