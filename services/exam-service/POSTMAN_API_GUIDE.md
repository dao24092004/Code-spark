# Exam Service - Postman API Guide

## 🌐 Base URL

### Option 1: Qua API Gateway (Khuyến nghị)
```
http://localhost:8080/exam
```
**Prefix path:** `/exam`

### Option 2: Trực tiếp vào Exam Service
```
http://localhost:9005
```
**Lưu ý:** Chỉ dùng khi test local, không dùng trong production

## 🔐 Authentication
Tất cả endpoints (trừ `/actuator/health`) cần JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## 📌 Lưu ý khi test qua API Gateway
- API Gateway chạy ở port **8080**
- Exam-service được route qua path prefix `/exam`
- Ví dụ: Request đến gateway `http://localhost:8080/exam/exams` sẽ được forward đến exam-service `/exams`

---

## 📝 EXAM ENDPOINTS

### 1. Tạo Exam mới
**POST** `http://localhost:8080/exam/exams` (Qua API Gateway)
**POST** `http://localhost:9005/exams` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
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

⚠️ **LƯU Ý QUAN TRỌNG:**
- `courseId` **PHẢI** là UUID hợp lệ và **PHẢI TỒN TẠI** trong bảng `cm_courses` của `course_db`
- Nếu bạn gặp lỗi `foreign key constraint violation`, nghĩa là `courseId` không tồn tại
- **Giải pháp:** 
  1. Lấy danh sách courses: `GET http://localhost:8080/course/api/courses`
  2. Hoặc tạo course mới: `POST http://localhost:8080/course/api/courses`
  3. Sử dụng `id` từ response để làm `courseId`

---

### 2. Lấy thông tin Exam
**GET** `http://localhost:8080/exam/exams/{examId}` (Qua API Gateway)
**GET** `http://localhost:9005/exams/{examId}` (Trực tiếp)

**Headers:**
```
Authorization: Bearer <token>
```

**Path Variable:** `examId` - UUID của exam

**Examples:**
```
GET http://localhost:8080/exam/exams/123e4567-e89b-12d3-a456-426614174000
GET http://localhost:9005/exams/123e4567-e89b-12d3-a456-426614174000
```

---

### 3. Cập nhật cấu hình Exam
**PUT** `http://localhost:8080/exam/exams/{examId}/config` (Qua API Gateway)
**PUT** `http://localhost:9005/exams/{examId}/config` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "durationMinutes": 120,
  "passScore": 60,
  "maxAttempts": 3
}
```

---

### 4. Xóa Exam
**DELETE** `http://localhost:8080/exam/exams/{examId}` (Qua API Gateway)
**DELETE** `http://localhost:9005/exams/{examId}` (Trực tiếp)

**Headers:**
```
Authorization: Bearer <token>
```

---

### 5. Lên lịch và đăng ký thí sinh
**POST** `http://localhost:8080/exam/exams/{examId}/schedule` (Qua API Gateway)
**POST** `http://localhost:9005/exams/{examId}/schedule` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "candidateIds": [1, 2, 3],
  "startAt": "2024-12-25T09:00:00Z",
  "endAt": "2024-12-25T11:00:00Z"
}
```

---

### 6. Tạo danh sách câu hỏi ngẫu nhiên cho Exam
**POST** `http://localhost:8080/exam/exams/{examId}/generate-questions` (Qua API Gateway)
**POST** `http://localhost:9005/exams/{examId}/generate-questions` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "count": 10,
  "tags": ["java", "oop"],
  "minDifficulty": 1,
  "maxDifficulty": 3
}
```

---

### 7. Lấy danh sách Exam theo khoảng thời gian
**GET** `http://localhost:8080/exam/exams/schedules` (Qua API Gateway)
**GET** `http://localhost:9005/exams/schedules` (Trực tiếp)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (optional):**
- `start`: `2024-12-25T09:00:00Z`
- `end`: `2024-12-25T11:00:00Z`

**Examples (Qua API Gateway):**
```
GET http://localhost:8080/exam/exams/schedules
GET http://localhost:8080/exam/exams/schedules?start=2024-12-25T09:00:00Z
GET http://localhost:8080/exam/exams/schedules?end=2024-12-25T11:00:00Z
GET http://localhost:8080/exam/exams/schedules?start=2024-12-25T09:00:00Z&end=2024-12-25T11:00:00Z
```

**Examples (Trực tiếp):**
```
GET http://localhost:9005/exams/schedules
GET http://localhost:9005/exams/schedules?start=2024-12-25T09:00:00Z
GET http://localhost:9005/exams/schedules?end=2024-12-25T11:00:00Z
GET http://localhost:9005/exams/schedules?start=2024-12-25T09:00:00Z&end=2024-12-25T11:00:00Z
```

---

## ❓ QUESTION ENDPOINTS

### 8. Tạo câu hỏi mới

⚠️ **LƯU Ý QUAN TRỌNG:** Question entity hiện tại yêu cầu `quiz_id` (NOT NULL), nhưng QuestionCreationRequest chưa có field này. Cần cập nhật code trước khi test.

**POST** `http://localhost:8080/exam/questions` (Qua API Gateway)
**POST** `http://localhost:9005/questions` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body - Single Choice:**
```json
{
  "type": "SINGLE_CHOICE",
  "content": "What is JVM?",
  "difficulty": 1,
  "explanation": "JVM stands for Java Virtual Machine",
  "score": 5,
  "text": "What is JVM?",
  "tags": ["java", "jvm", "basics"]
}
```

**Body - Multiple Choice:**
```json
{
  "type": "MULTIPLE_CHOICE",
  "content": "Pick OOP pillars",
  "difficulty": 2,
  "explanation": "OOP has 4 pillars: Encapsulation, Abstraction, Inheritance, Polymorphism",
  "score": 10,
  "text": "OOP pillars",
  "tags": ["java", "oop"]
}
```

**Body - True/False:**
```json
{
  "type": "TRUE_FALSE",
  "content": "Java is a compiled language",
  "difficulty": 1,
  "explanation": "Java is compiled to bytecode, then interpreted by JVM",
  "score": 2,
  "text": "Java is a compiled language",
  "tags": ["java"]
}
```

**Body - Short Answer:**
```json
{
  "type": "SHORT_ANSWER",
  "content": "What keyword is used to inherit a class in Java?",
  "difficulty": 1,
  "explanation": "The 'extends' keyword is used for inheritance",
  "score": 3,
  "text": "What keyword is used to inherit a class in Java?",
  "tags": ["java", "inheritance"]
}
```

**Body - Essay:**
```json
{
  "type": "ESSAY",
  "content": "Explain the difference between abstract class and interface in Java",
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

---

### 9. Tìm kiếm câu hỏi
**GET** `http://localhost:8080/exam/questions` (Qua API Gateway)
**GET** `http://localhost:9005/questions` (Trực tiếp)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (optional):**
- `tags`: `java` (lặp lại cho nhiều tags: `tags=java&tags=oop`)
- `minDifficulty`: `1`
- `maxDifficulty`: `3`

**Examples (Qua API Gateway):**
```
GET http://localhost:8080/exam/questions
GET http://localhost:8080/exam/questions?tags=java&tags=oop
GET http://localhost:8080/exam/questions?minDifficulty=1&maxDifficulty=3
GET http://localhost:8080/exam/questions?tags=java&minDifficulty=2&maxDifficulty=4
```

**Examples (Trực tiếp):**
```
GET http://localhost:9005/questions
GET http://localhost:9005/questions?tags=java&tags=oop
GET http://localhost:9005/questions?minDifficulty=1&maxDifficulty=3
GET http://localhost:9005/questions?tags=java&minDifficulty=2&maxDifficulty=4
```

---

### 10. Xóa câu hỏi
**DELETE** `http://localhost:8080/exam/questions/{questionId}` (Qua API Gateway)
**DELETE** `http://localhost:9005/questions/{questionId}` (Trực tiếp)

**Headers:**
```
Authorization: Bearer <token>
```

---

### 11. Generate câu hỏi ngẫu nhiên (helper endpoint)
**POST** `http://localhost:8080/exam/questions/generate?count=5` (Qua API Gateway)
**POST** `http://localhost:9005/questions/generate?count=5` (Trực tiếp)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (optional):**
```json
{
  "tags": ["java", "oop"],
  "minDifficulty": 1,
  "maxDifficulty": 3
}
```

---

## 🔍 HEALTH CHECK

### 12. Health Check

**Qua API Gateway:**
**GET** `http://localhost:8080/exam/actuator/health`

**Trực tiếp:**
**GET** `http://localhost:9005/actuator/health`

**Headers:** (Không cần authentication)

---

## 📋 LƯU Ý QUAN TRỌNG

1. **courseId**: 
   - ⚠️ **UUID từ bảng `cm_courses` trong `course_db`**
   - **PHẢI TỒN TẠI** trong database trước khi tạo Exam
   - Lỗi `foreign key constraint violation` = `courseId` không tồn tại
   - **Cách lấy:** `GET http://localhost:8080/course/api/courses` hoặc tạo mới qua Course Service

2. **createdBy/userId/candidateIds**: BIGINT (user ID từ Identity Service), ví dụ: `1`, `2`, `100`

3. **Content Field**: Giờ là TEXT (không còn JSONB), chỉ cần chuỗi text đơn giản

4. **Difficulty**: Số nguyên 0-5

5. **Tags**: Mảng các string

6. **DateTime Format**: ISO 8601 với timezone, ví dụ: `2024-12-25T09:00:00Z`

7. ⚠️ **Question cần quizId**: Hiện tại Question entity yêu cầu `quiz_id`, nhưng QuestionCreationRequest chưa có field này. Cần cập nhật code trước khi test tạo question.

---

## ❌ CÁC LỖI THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC

### Lỗi 1: Foreign Key Constraint Violation
```
ERROR: insert or update on table "cm_quizzes" violates foreign key constraint 
"cm_quizzes_course_id_fkey"
Detail: Key (course_id)=(550e8400-e29b-41d4-a716-446655440000) is not present in table "cm_courses"
```

**Nguyên nhân:** `courseId` không tồn tại trong `cm_courses`

**Giải pháp:**
1. Lấy danh sách courses: `GET http://localhost:8080/course/api/courses`
2. Copy một `id` hợp lệ từ response
3. Sử dụng `id` đó cho `courseId` trong request tạo Exam
4. Hoặc tạo course mới trước: `POST http://localhost:8080/course/api/courses`

---

### Lỗi 3: 404 Not Found khi tạo Permission

**Nguyên nhân:** URL sai hoặc endpoint không tồn tại

**LƯU Ý QUAN TRỌNG:**
- ✅ **KHÔNG CẦN** tạo permission nữa vì đã bỏ `@PreAuthorize` trên POST endpoint trong CourseController
- ✅ Chỉ cần **restart course-service** và test lại tạo course
- ✅ Nếu vẫn muốn tạo permission (để test sau này), dùng URL đúng:

**URL đúng qua API Gateway:**
```
POST http://localhost:8080/identity/api/v1/permissions
```

**URL SAI (bạn đang dùng):**
```
POST http://localhost:8080/api/v1/permissions  ❌
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "COURSE_CREATE",
  "description": "Quyen tao khoa hoc",
  "resource": "COURSE",
  "action": "CREATE"
}
```

**Lưu ý:** Endpoint này yêu cầu permission `ROLE_WRITE` trong JWT token. Admin user thường có quyền này.

**Nếu vẫn lỗi 404:**
1. Kiểm tra identity-service có đang chạy không: `GET http://localhost:9000/actuator/health`
2. Kiểm tra API Gateway route: `/identity/**` → `lb://identity-service`
3. Kiểm tra Eureka: identity-service đã đăng ký chưa

---

## 🧪 WORKFLOW TEST ĐỀ XUẤT

### Qua API Gateway (Khuyến nghị):

### Bước 0: Lấy Course ID hợp lệ (QUAN TRỌNG)

⚠️ **Trước khi tạo Exam, bạn cần có một `course_id` hợp lệ từ bảng `cm_courses`.**

**Option A: Lấy danh sách courses có sẵn**

```
GET http://localhost:8080/course/api/courses
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "title": "Introduction to Java Programming",
        "slug": "java-programming-101",
        ...
      },
      ...
    ],
    ...
  }
}
```

**→ Copy `id` từ một course bất kỳ để dùng cho `courseId` khi tạo Exam**

---

**Option B: Tạo course mới (nếu chưa có)**

```
POST http://localhost:8080/course/api/courses
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body mẫu (Copy & Paste sẵn để test):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Java Programming Fundamentals - Test Course",
  "description": "Khóa học lập trình Java cơ bản để test Exam Service.",
  "instructorId": 1,
  "visibility": "public"
}
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Java Programming Fundamentals - Test Course",
    "slug": "java-programming-fundamentals-test-course",
    "description": "Khóa học lập trình Java cơ bản để test Exam Service...",
    "instructorId": 1,
    "visibility": "public",
    "createdAt": "2024-12-25T10:00:00Z",
    "updatedAt": "2024-12-25T10:00:00Z"
  }
}
```

**→ Copy `id` từ response (`550e8400-e29b-41d4-a716-446655440000`) để dùng cho `courseId` khi tạo Exam**

---

**📝 Lưu ý về các fields:**
- `id`: UUID (bắt buộc) - Bạn có thể tự tạo UUID mới hoặc dùng UUID generator online
- `title`: String (bắt buộc, 3-255 ký tự)
- `instructorId`: Long (tùy chọn) - User ID từ Identity Service (ví dụ: 1 cho admin)
- `description`: String (tùy chọn, tối đa 2000 ký tự)
- `visibility`: String (tùy chọn) - `"public"`, `"private"`, hoặc `"unlisted"` (mặc định: `"private"`)

**🔐 Permission yêu cầu:**
- Endpoint này yêu cầu quyền `COURSE_CREATE`
- Nếu bạn gặp lỗi 403, đảm bảo JWT token của bạn có quyền này

---

**Option C: Kiểm tra database trực tiếp**

Nếu có quyền truy cập database, chạy SQL:
```sql
SELECT id, title FROM cm_courses LIMIT 10;
```

---

### Bước 1: Health Check
```
GET http://localhost:8080/exam/actuator/health
```

### Bước 2: Tạo Exam
```
POST http://localhost:8080/exam/exams
Body: { "courseId": "...", "title": "...", "createdBy": 1, ... }
→ Lưu examId từ response
```

### Bước 3: Generate câu hỏi cho exam
```
POST http://localhost:8080/exam/exams/{examId}/generate-questions
Body: { "count": 10, "tags": ["java"] }
```

### Bước 4: Lên lịch và đăng ký thí sinh
```
POST http://localhost:8080/exam/exams/{examId}/schedule
Body: { "candidateIds": [1, 2, 3], "startAt": "...", "endAt": "..." }
```

### Bước 5: Lấy thông tin exam
```
GET http://localhost:8080/exam/exams/{examId}
```

---

### Trực tiếp (Chỉ dùng khi test local):

### Bước 1: Health Check
```
GET http://localhost:9005/actuator/health
```

### Bước 2: Tạo Exam
```
POST http://localhost:9005/exams
Body: { "courseId": "...", "title": "...", "createdBy": 1, ... }
→ Lưu examId từ response
```

### Bước 3: Generate câu hỏi cho exam
```
POST http://localhost:9005/exams/{examId}/generate-questions
Body: { "count": 10, "tags": ["java"] }
```

### Bước 4: Lên lịch và đăng ký thí sinh
```
POST http://localhost:9005/exams/{examId}/schedule
Body: { "candidateIds": [1, 2, 3], "startAt": "...", "endAt": "..." }
```

### Bước 5: Lấy thông tin exam
```
GET http://localhost:9005/exams/{examId}
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
