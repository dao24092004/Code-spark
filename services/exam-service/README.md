# Exam Service - Documentation

**Version:** 1.0.0-SNAPSHOT  
**Last Updated:** 2025-11-05  
**Java Version:** 17  
**Spring Boot Version:** 3.x

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Security & Authentication](#security--authentication)
5. [API Documentation](#api-documentation)
6. [Question Management](#question-management)
7. [Random Question Generation](#random-question-generation)
8. [Exam Publishing](#exam-publishing)
9. [Database Schema](#database-schema)
10. [Configuration](#configuration)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Overview

Exam Service là microservice quản lý bài thi và ngân hàng câu hỏi trong hệ thống thi trực tuyến. Service này cung cấp đầy đủ tính năng CRUD cho exams và questions, tích hợp JWT authentication, và hỗ trợ import câu hỏi từ Excel.

### Key Technologies

- **Framework:** Spring Boot 3.x
- **Database:** PostgreSQL
- **Security:** Spring Security + JWT (HS256)
- **ORM:** Spring Data JPA (Hibernate)
- **API Docs:** Swagger/OpenAPI
- **File Processing:** Apache POI
- **Build Tool:** Maven

---

## Features

### ✅ Core Features

#### 1. Exam Management
- Create, read, update, delete exams
- Schedule exams with start/end times
- Configure exam settings (duration, pass score, max attempts)
- Publish/unpublish exams for public visibility
- Track total questions per exam
- Support exam tags/subjects

#### 2. Question Bank Management
- Create, search, delete questions
- Import questions from Excel (.xlsx)
- Support multiple question types (SINGLE_CHOICE, etc.)
- Tag-based organization
- Difficulty levels (1-10)
- Duplicate detection

#### 3. Random Question Generation
- Generate random questions based on filters (tags, difficulty)
- **NO DUPLICATES GUARANTEED** - text-based deduplication
- Configurable question count
- Automatic validation of available questions

#### 4. Excel Import
- Bulk import questions from Excel files
- Automatic duplicate detection and skipping
- Error reporting with row details
- Import statistics (imported/skipped/errors)
- Tag assignment during import

#### 5. Security
- JWT token validation (HS256)
- Role-based access control (infrastructure ready)
- CORS configuration for frontend origins
- Public endpoints for enum lookups
- Protected endpoints for write operations

---

## Architecture

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Exam Service (Port 9005)                   │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer                                            │
│    ├─ ExamController         (CRUD exams)                   │
│    ├─ QuestionController     (CRUD questions)               │
│    └─ QuestionImportController (Excel import)               │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│    ├─ ExamService           (Business logic)                │
│    ├─ QuestionService       (Question management)           │
│    └─ QuestionImportService (Excel processing)              │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer                                            │
│    ├─ ExamRepository         (JPA CRUD)                     │
│    └─ QuestionRepository     (Custom queries)               │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                              │
│    ├─ SecurityConfig         (CORS + JWT)                   │
│    ├─ JwtConfig              (JWT decoder)                  │
│    └─ JwtAuthConverter       (Auth converter)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                         │
│    ├─ exams                  (Main exam table)              │
│    ├─ exam_tags              (Exam subjects)                │
│    ├─ exam_questions         (Exam-Question mapping)        │
│    ├─ questions              (Question bank)                │
│    └─ question_tags          (Question subjects)            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Frontend → API Gateway → Exam Service → Database
   ↓          ↓              ↓
(JWT)    (Routing)     (Validation)
```

---

## Security & Authentication

### JWT Configuration

**Shared Secret:** Both `identity-service` and `exam-service` must use the same JWT secret.

```properties
# application.properties
app.jwt.secret=${JWT_SECRET:mySecretKey12345678901234567890123456789012345678901234567890}
```

⚠️ **Production:** Set `JWT_SECRET` environment variable!

### Endpoint Security

#### Public Endpoints (No Authentication)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/actuator/health` | GET | Health check |
| `/v3/api-docs/**` | ALL | API documentation |
| `/swagger-ui/**` | ALL | Swagger UI |
| `/exams/types` | GET | Exam types enum |
| `/exams/difficulties` | GET | Difficulties enum |
| `/exams/statuses` | GET | Statuses enum |
| `/exams/subjects` | GET | All subjects/tags |
| `/exams/schedules` | GET | Public exam calendar |

#### Protected Endpoints (Require JWT)

| Endpoint Pattern | Methods | Purpose |
|-----------------|---------|---------|
| `/exams` | POST | Create exam |
| `/exams/{id}` | GET, DELETE | Get/delete exam |
| `/exams/{id}/config` | PUT | Update config |
| `/exams/{id}/status` | PUT | Publish/unpublish |
| `/exams/{id}/generate-questions` | POST | Generate questions |
| `/questions` | POST, GET | Create/search |
| `/questions/import-excel` | POST | Import Excel |
| `/questions/{id}` | DELETE | Delete question |

### CORS Configuration

Allowed origins:
- `http://localhost:4173` (Vite preview)
- `http://localhost:5173` (Vite dev)
- `http://localhost:3000` (React dev)
- `http://localhost:8080` (Gateway)

**Production:** Update `SecurityConfig.corsConfigurationSource()` with production URLs.

---

## API Documentation

### Access Swagger UI

```
http://localhost:9005/swagger-ui.html
```

### Key Endpoints

#### 1. Create Exam

```http
POST /exams
Content-Type: application/json
Authorization: Bearer {token}

{
  "orgId": "org-uuid",
  "title": "Midterm Exam",
  "description": "Comprehensive exam covering...",
  "startAt": "2025-11-10T09:00:00Z",
  "endAt": "2025-11-10T11:00:00Z",
  "durationMinutes": 90,
  "passScore": 70,
  "maxAttempts": 3,
  "totalQuestions": 50,
  "createdBy": "user-uuid",
  "tags": ["Mathematics", "Algebra"]
}
```

#### 2. Generate Random Questions

```http
POST /exams/{examId}/generate-questions
Content-Type: application/json
Authorization: Bearer {token}

{
  "count": 10,
  "tags": ["Java", "OOP"],
  "minDifficulty": 1,
  "maxDifficulty": 5
}
```

Response: List of 10 unique question IDs (NO DUPLICATES guaranteed)

#### 3. Publish Exam

```http
PUT /exams/{examId}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "SCHEDULED"  // or "DRAFT" to unpublish
}
```

#### 4. Import Questions from Excel

```http
POST /questions/import-excel
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [Excel file]
subject: "Java Programming"
tags: "Java,OOP,Programming"
skipDuplicates: true
```

Response:
```json
{
  "imported": 100,
  "skipped": 20,
  "errors": 0,
  "errorDetails": [],
  "subject": "Java Programming",
  "tags": ["Java", "OOP", "Programming"]
}
```

#### 5. Get All Subjects

```http
GET /exams/subjects
Authorization: Bearer {token}
```

Response:
```json
[
  "Cơ sở dữ liệu",
  "Lập trình Web",
  "Thuật toán"
]
```

---

## Question Management

### Excel Import Format

Required columns:

| Column | Field | Example |
|--------|-------|---------|
| A | STT | 1, 2, 3... |
| B | Câu hỏi | "Kết quả của chương trình sau là gì?" |
| C | Đáp án A | "5" |
| D | Đáp án B | "10" |
| E | Đáp án C | "11" |
| F | Đáp án D | "Lỗi biên dịch" |
| G | Đáp án đúng | "C" or "11" |

### Features

- **Duplicate Detection:** Compares question text (case-insensitive)
- **Skip Duplicates:** Optional checkbox in UI
- **Error Reporting:** Detailed row-level errors
- **Tag Assignment:** Add multiple tags during import
- **Statistics:** Shows imported/skipped/errors count

### Import Strategy

#### ✅ Skip Duplicates = ON
- Use when adding NEW questions to existing pool
- Prevents duplicate text in database
- Safe for importing multiple files

#### ❌ Skip Duplicates = OFF
- Use when importing BRAND NEW file
- Force import all questions (even if duplicate)
- Use after deleting old questions

---

## Random Question Generation

### How It Works

**Fixed Issue:** Generates truly unique questions with NO DUPLICATES.

#### Implementation

```java
// 1. Get pool of questions matching filters
List<Question> pool = search(filter);

// 2. Deduplicate by TEXT content (not ID)
Set<String> seenTexts = new HashSet<>();
List<Question> uniqueQuestions = new ArrayList<>();
for (Question q : pool) {
    String normalizedText = q.getText().trim().toLowerCase();
    if (!seenTexts.contains(normalizedText)) {
        seenTexts.add(normalizedText);
        uniqueQuestions.add(q);
    }
}

// 3. Validate enough unique questions exist
if (uniqueQuestions.size() < request.count) {
    throw new IllegalArgumentException("Not enough unique questions");
}

// 4. Shuffle and return
Collections.shuffle(uniqueQuestions);
return uniqueQuestions.stream()
    .limit(request.count)
    .map(Question::getId)
    .collect(Collectors.toList());
```

### Key Features

- ✅ **Text-based deduplication** (not ID-based)
- ✅ **Case-insensitive comparison**
- ✅ **Validation before generation**
- ✅ **Clear error messages**
- ✅ **True randomization**

### Error Handling

If not enough unique questions:

```json
{
  "error": "Not enough unique questions available. Requested: 10, Available: 5. Please adjust filter criteria (tags: [Java], difficulty: 1-5)"
}
```

---

## Exam Publishing

### Status Lifecycle

```
┌─────────┐  Schedule  ┌───────────┐  Publish  ┌───────────┐
│  DRAFT  │ ────────→  │ SCHEDULED │ ───────→  │ PUBLISHED │
│   📝    │            │    📅     │           │    ✅     │
└─────────┘            └───────────┘           └───────────┘
                                                      │
                                           Exam starts
                                                      ↓
                                               ┌───────────┐
                                               │  ACTIVE   │
                                               │    🏃     │
                                               └───────────┘
                                                      │
                                             Exam ends
                                                      ↓
                                               ┌───────────┐
                                               │ COMPLETED │
                                               │    ✅     │
                                               └───────────┘
```

### API Usage

**Publish:**
```bash
curl -X PUT http://localhost:9005/exams/{id}/status \
  -H "Authorization: Bearer {token}" \
  -d '{"status": "SCHEDULED"}'
```

**Unpublish:**
```bash
curl -X PUT http://localhost:9005/exams/{id}/status \
  -H "Authorization: Bearer {token}" \
  -d '{"status": "DRAFT"}'
```

### Frontend Visual Feedback

| Status | Opacity | Background | Badge | Button |
|--------|---------|------------|-------|--------|
| DRAFT | 70% | Transparent | "NHÁP" (gray) | 📤 Publish |
| PUBLISHED | 100% | Light green | "CÔNG KHAI" (green) | 📥 Unpublish |

---

## Database Schema

### Main Tables

#### `exams`
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMP,
    end_at TIMESTAMP,
    duration_minutes INTEGER,
    pass_score INTEGER,
    max_attempts INTEGER,
    total_questions INTEGER,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
);
```

#### `exam_tags`
```sql
CREATE TABLE exam_tags (
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    tag VARCHAR(255),
    PRIMARY KEY (exam_id, tag)
);
CREATE INDEX idx_exam_tags_tag ON exam_tags(tag);
```

#### `exam_questions`
```sql
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    display_order INTEGER,
    score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);
```

#### `questions`
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    content JSONB NOT NULL,
    difficulty INTEGER,
    score INTEGER DEFAULT 10,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_questions_text ON questions(text);
```

#### `question_tags`
```sql
CREATE TABLE question_tags (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    tag VARCHAR(255),
    PRIMARY KEY (question_id, tag)
);
CREATE INDEX idx_question_tags_tag ON question_tags(tag);
```

---

## Configuration

### application.properties

```properties
# Server
server.port=9005

# Database
spring.datasource.url=jdbc:postgresql://localhost:5433/exam_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update

# JWT
app.jwt.secret=${JWT_SECRET:mySecretKey12345678901234567890123456789012345678901234567890}

# Multipart (Excel upload)
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Logging
logging.level.com.dao.examservice=INFO
```

### Environment Variables (Production)

```bash
# Required
export JWT_SECRET=<strong-256-bit-key>
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/exam_db
export SPRING_DATASOURCE_USERNAME=exam_user
export SPRING_DATASOURCE_PASSWORD=<secure-password>

# Optional
export SPRING_PROFILES_ACTIVE=prod
export SERVER_PORT=9005
export EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://discovery:8761/eureka/
```

---

## Testing

### Manual Testing

#### 1. Test Public Endpoints (No Token)

```bash
# Health check
curl http://localhost:9005/actuator/health

# Exam types
curl http://localhost:9005/exams/types

# All subjects
curl http://localhost:9005/exams/subjects
```

#### 2. Test Protected Endpoints (With Token)

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:9001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' | jq -r '.accessToken')

# Create exam
curl -X POST http://localhost:9005/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### 3. Test Random Question Generation

```bash
# Generate 10 unique questions
curl -X POST http://localhost:9005/exams/{examId}/generate-questions \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"count":10,"tags":["Java"],"minDifficulty":1,"maxDifficulty":5}'

# Verify no duplicates in database
psql -d exam_db -c "
SELECT question_id, COUNT(*) 
FROM exam_questions 
WHERE exam_id = '{examId}'
GROUP BY question_id 
HAVING COUNT(*) > 1;"

# Expected: 0 rows (no duplicates)
```

### Automated Testing

See `TESTING_GUIDE.md` for comprehensive test suite.

---

## Deployment

### Development

```bash
# Build
cd Code-spark/services/exam-service
mvn clean install

# Run
mvn spring-boot:run
```

### Production

```bash
# Build JAR
mvn clean package -DskipTests

# Run with environment variables
java -jar target/exam-service-1.0.0-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --server.port=9005
```

### Docker

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/exam-service-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 9005
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Build image
docker build -t exam-service:latest .

# Run container
docker run -d \
  -p 9005:9005 \
  -e JWT_SECRET=${JWT_SECRET} \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/exam_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  --name exam-service \
  exam-service:latest
```

---

## Troubleshooting

### Issue: 401 Unauthorized (With Valid Token)

**Cause:** JWT secret mismatch

**Solution:**
```bash
# Check secrets match
grep "app.jwt.secret" identity-service/src/main/resources/application.properties
grep "app.jwt.secret" exam-service/src/main/resources/application.properties
```

### Issue: CORS Error in Browser

**Cause:** Frontend origin not in allowed list

**Solution:** Add origin to `SecurityConfig.corsConfigurationSource()`:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:4173",
    "http://your-frontend:port"  // Add here
));
```

### Issue: Duplicate Questions in Exam

**Cause:** Old code before fix

**Solution:** 
1. Pull latest code
2. Rebuild service: `mvn clean install`
3. Restart service
4. Code now uses text-based deduplication (guaranteed no duplicates)

### Issue: Excel Import Shows All Skipped

**Cause:** "Skip duplicates" checkbox ON + questions already exist

**Solution:**
1. Delete old questions: `DELETE FROM questions WHERE tags @> ARRAY['OldTag']`
2. Re-import with "Skip duplicates" OFF
3. Or import with new tags

### Issue: Total Questions Always Shows 0

**Cause:** Missing `total_questions` column (old database)

**Solution:**
```sql
ALTER TABLE exams ADD COLUMN total_questions INTEGER;
```

### Issue: Lombok Errors in IDE

**Cause:** IDE doesn't recognize Lombok annotations

**Solution:**
1. Install Lombok plugin in IDE
2. Enable annotation processing
3. Rebuild project

---

## Dependencies

### Main Dependencies

```xml
<!-- Spring Boot Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- PostgreSQL Driver -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-jose</artifactId>
</dependency>

<!-- Apache POI (Excel) -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

---

## Change Log

### v1.0.0 (2025-11-05)

**Features:**
- ✅ Random question generation with NO DUPLICATES (text-based deduplication)
- ✅ Publish/unpublish exams
- ✅ Total questions tracking
- ✅ Excel import with duplicate detection
- ✅ Optimized `/exams/subjects` endpoint
- ✅ JWT authentication restored
- ✅ CORS configuration

**Bug Fixes:**
- 🐛 Fixed duplicate questions in random generation
- 🐛 Fixed total questions always showing 0
- 🐛 Fixed PUBLISHED enum missing from Java
- 🐛 Removed all debug logs

**Documentation:**
- 📝 Complete README (this file)
- 📝 All feature docs consolidated

---

## Support

**Issues:** Check `TROUBLESHOOTING` section above

**Logs:** `tail -f logs/exam-service.log`

**Health Check:** `curl http://localhost:9005/actuator/health`

**API Docs:** `http://localhost:9005/swagger-ui.html`

---

## License

© 2025 Code-spark Team. All rights reserved.

---

**✅ Status:** Production Ready  
**🔧 Build:** SUCCESS  
**📅 Last Updated:** 2025-11-05

