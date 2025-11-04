# Exam Service - API Guide cho Postman

## Base URL
```
http://localhost:9005
```

## Authentication
Tất cả các endpoints (trừ `/actuator/health`) yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📝 EXAM ENDPOINTS

### 1. Tạo Exam mới
**POST** `/exams`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "courseId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Java Midterm Exam",
  "description": "Kiểm tra giữa kỳ về Java và OOP",
  "startAt": "2024-12-25T09:00:00Z",
  "endAt": "2024-12-25T11:00:00Z",
  "durationMinutes": 90,
  "passScore": 50,
  "maxAttempts": 2,
  "createdBy": 1
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "courseId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Java Midterm Exam",
  "description": "Kiểm tra giữa kỳ về Java và OOP",
  "startAt": "2024-12-25T09:00:00Z",
  "endAt": "2024-12-25T11:00:00Z",
  "durationMinutes": 90,
  "passScore": 50,
  "maxAttempts": 2,
  "createdBy": 1,
  "status": "DRAFT",
  "createdAt": "2024-12-20T10:30:00Z"
}
```

---

### 2. Lấy thông tin Exam
**GET** `/exams/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của exam

**Example:**
```
GET http://localhost:9005/exams/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):** (Tương tự như response của POST)

---

### 3. Cập nhật cấu hình Exam
**PUT** `/exams/{id}/config`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của exam

**Body (JSON):**
```json
{
  "durationMinutes": 120,
  "passScore": 60,
  "maxAttempts": 3
}
```

**Response (200 OK):** (Exam object với config đã cập nhật)

---

### 4. Xóa Exam
**DELETE** `/exams/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của exam

**Response (200 OK):** (Empty body)

---

### 5. Lên lịch và đăng ký thí sinh
**POST** `/exams/{id}/schedule`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của exam

**Body (JSON):**
```json
{
  "candidateIds": [1, 2, 3],
  "startAt": "2024-12-25T09:00:00Z",
  "endAt": "2024-12-25T11:00:00Z"
}
```

**Lưu ý:**
- `candidateIds`: Mảng các user ID (BIGINT) từ Identity Service
- `startAt` và `endAt`: Optional, nếu có sẽ cập nhật thời gian của exam

**Response (200 OK):** (Exam object)

---

### 6. Tạo danh sách câu hỏi ngẫu nhiên cho Exam
**POST** `/exams/{id}/generate-questions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của exam

**Body (JSON):**
```json
{
  "count": 10,
  "tags": ["java", "oop"],
  "minDifficulty": 1,
  "maxDifficulty": 3
}
```

**Response (200 OK):**
```json
{
  "questionIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

---

### 7. Lấy danh sách Exam theo khoảng thời gian
**GET** `/exams/schedules`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (tất cả đều optional):**
- `start`: ISO 8601 datetime (ví dụ: `2024-12-25T09:00:00Z`)
- `end`: ISO 8601 datetime (ví dụ: `2024-12-25T11:00:00Z`)

**Examples:**
```
GET http://localhost:9005/exams/schedules
GET http://localhost:9005/exams/schedules?start=2024-12-25T09:00:00Z
GET http://localhost:9005/exams/schedules?end=2024-12-25T11:00:00Z
GET http://localhost:9005/exams/schedules?start=2024-12-25T09:00:00Z&end=2024-12-25T11:00:00Z
```

**Response (200 OK):**
```json
[
  {
    "id": "...",
    "courseId": "...",
    "title": "...",
    ...
  }
]
```

---

## ❓ QUESTION ENDPOINTS

### 8. Tạo câu hỏi mới
**POST** `/questions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (JSON):**

**Single Choice:**
```json
{
  "type": "SINGLE_CHOICE",
  "content": "{\"question\":\"What is JVM?\",\"options\":[\"Java Virtual Machine\",\"Java Vendor Machine\",\"Java Visual Machine\"],\"answer\":0}",
  "difficulty": 1,
  "explanation": "JVM stands for Java Virtual Machine",
  "score": 5,
  "text": "What is JVM?",
  "tags": ["java", "jvm", "basics"]
}
```

**Multiple Choice:**
```json
{
  "type": "MULTIPLE_CHOICE",
  "content": "{\"question\":\"Pick OOP pillars\",\"options\":[\"Encapsulation\",\"Recursion\",\"Polymorphism\",\"Normalization\"],\"answers\":[0,2]}",
  "difficulty": 2,
  "explanation": "OOP has 4 pillars: Encapsulation, Abstraction, Inheritance, Polymorphism",
  "score": 10,
  "text": "OOP pillars",
  "tags": ["java", "oop"]
}
```

**True/False:**
```json
{
  "type": "TRUE_FALSE",
  "content": "{\"question\":\"Java is a compiled language\",\"answer\":true}",
  "difficulty": 1,
  "explanation": "Java is compiled to bytecode, then interpreted by JVM",
  "score": 2,
  "text": "Java is a compiled language",
  "tags": ["java"]
}
```

**Short Answer:**
```json
{
  "type": "SHORT_ANSWER",
  "content": "{\"question\":\"What keyword is used to inherit a class in Java?\"}",
  "difficulty": 1,
  "explanation": "The 'extends' keyword is used for inheritance",
  "score": 3,
  "text": "What keyword is used to inherit a class in Java?",
  "tags": ["java", "inheritance"]
}
```

**Essay:**
```json
{
  "type": "ESSAY",
  "content": "{\"question\":\"Explain the difference between abstract class and interface in Java\"}",
  "difficulty": 3,
  "explanation": "",
  "score": 20,
  "text": "Explain the difference between abstract class and interface in Java",
  "tags": ["java", "oop", "advanced"]
}
```

**Question Types:**
- `SINGLE_CHOICE`
- `MULTIPLE_CHOICE`
- `TRUE_FALSE`
- `SHORT_ANSWER`
- `ESSAY`

**Response (200 OK):**
```json
{
  "id": "uuid-question-id",
  "type": "SINGLE_CHOICE",
  "content": "...",
  "difficulty": 1,
  "explanation": "...",
  "score": 5,
  "text": "...",
  "tags": ["java", "jvm"],
  "createdAt": "2024-12-20T10:30:00Z",
  "updatedAt": null
}
```

---

### 9. Tìm kiếm câu hỏi
**GET** `/questions`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (tất cả đều optional):**
- `tags`: Danh sách tags (ví dụ: `tags=java&tags=oop`)
- `minDifficulty`: Độ khó tối thiểu (0-5)
- `maxDifficulty`: Độ khó tối đa (0-5)

**Examples:**
```
GET http://localhost:9005/questions
GET http://localhost:9005/questions?tags=java&tags=oop
GET http://localhost:9005/questions?minDifficulty=1&maxDifficulty=3
GET http://localhost:9005/questions?tags=java&minDifficulty=2&maxDifficulty=4
```

**Response (200 OK):**
```json
[
  {
    "id": "...",
    "type": "SINGLE_CHOICE",
    "content": "...",
    ...
  }
]
```

---

### 10. Xóa câu hỏi
**DELETE** `/questions/{id}`

**Headers:**
```
Authorization: Bearer <token>
```

**Path Variable:**
- `id`: UUID của question

**Response (200 OK):** (Empty body)

---

### 11. Generate câu hỏi ngẫu nhiên (helper endpoint)
**POST** `/questions/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Query Parameter:**
- `count`: Số lượng câu hỏi (default: 10)

**Body (JSON - optional):**
```json
{
  "tags": ["java", "oop"],
  "minDifficulty": 1,
  "maxDifficulty": 3
}
```

**Example:**
```
POST http://localhost:9005/questions/generate?count=5
```

**Response (200 OK):**
```json
{
  "questionIds": ["uuid-1", "uuid-2", "uuid-3", "uuid-4", "uuid-5"]
}
```

---

## 🔍 HEALTH CHECK

### 12. Health Check
**GET** `/actuator/health`

**Headers:** (Không cần authentication)

**Response (200 OK):**
```json
{
  "status": "UP"
}
```

---

## 📋 LƯU Ý QUAN TRỌNG

1. **courseId**: Phải là UUID hợp lệ từ bảng `cm_courses` trong online_service database
2. **createdBy**: Phải là BIGINT (user ID từ Identity Service), ví dụ: `1`, `2`, `100`
3. **userId/candidateIds**: BIGINT (user ID từ Identity Service)
4. **Content Field**: Phải là JSON string hợp lệ, ví dụ:
   - Single Choice: `{"question":"...","options":[...],"answer":0}`
   - Multiple Choice: `{"question":"...","options":[...],"answers":[0,2]}`
   - True/False: `{"question":"...","answer":true}`
5. **Difficulty**: Số nguyên từ 0-5
6. **Tags**: Mảng các string, không trùng lặp
7. **DateTime Format**: ISO 8601 với timezone (ví dụ: `2024-12-25T09:00:00Z`)

---

## 🧪 VÍ DỤ WORKFLOW HOÀN CHỈNH

### Bước 1: Tạo câu hỏi
```
POST /questions
Body: { ... single choice question ... }
→ Lưu questionId
```

### Bước 2: Tạo Exam
```
POST /exams
Body: {
  "courseId": "<uuid-from-cm_courses>",
  "title": "...",
  "createdBy": 1,
  ...
}
→ Lưu examId
```

### Bước 3: Generate câu hỏi cho exam
```
POST /exams/{examId}/generate-questions
Body: {
  "count": 10,
  "tags": ["java"]
}
```

### Bước 4: Lên lịch và đăng ký thí sinh
```
POST /exams/{examId}/schedule
Body: {
  "candidateIds": [1, 2, 3],
  "startAt": "2024-12-25T09:00:00Z",
  "endAt": "2024-12-25T11:00:00Z"
}
```

---

## ❌ ERROR RESPONSES

### 404 Not Found
```json
{
  "timestamp": "2024-12-20T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Exam not found"
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2024-12-20T10:30:00Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "..."
}
```
