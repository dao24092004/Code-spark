# Analytics Service API Test Guide

## Database Setup

### 1. Tạo Database
```sql
CREATE DATABASE analytics_db;
```

### 2. Chạy Schema Script
```bash
# Linux/Mac
psql -U postgres -d analytics_db -f database-schema.sql

# Windows (PowerShell)
psql -U postgres -d analytics_db -f database-schema.sql
```

### 3. Insert Test Data
```bash
# Linux/Mac
psql -U postgres -d analytics_db -f insert-test-data.sql

# Windows (PowerShell)
psql -U postgres -d analytics_db -f insert-test-data.sql
```

## Base URL
- Local: `http://localhost:9004`
- Docker: `http://localhost:9008` (mapped port)

## API Endpoints

### 1. Get Exam Results
**GET** `/analytics/exam-results`

**Query Parameters:**
- `examId` (optional, UUID): Filter by exam ID
- `userId` (optional, UUID): Filter by user ID

**Example Requests:**
```bash
# Get all exam results (trả về empty list nếu không có parameters)
curl "http://localhost:9004/analytics/exam-results"

# Get exam results by examId
curl "http://localhost:9004/analytics/exam-results?examId=550e8400-e29b-41d4-a716-446655440000"

# Get exam results by userId
curl "http://localhost:9004/analytics/exam-results?userId=550e8400-e29b-41d4-a716-446655440002"

# Get exam results by both examId and userId
curl "http://localhost:9004/analytics/exam-results?examId=550e8400-e29b-41d4-a716-446655440000&userId=550e8400-e29b-41d4-a716-446655440002"
```

**Response:**
```json
{
  "success": true,
  "message": "Exam results fetched successfully",
  "data": [
    {
      "id": 1,
      "examId": "550e8400-e29b-41d4-a716-446655440000",
      "submissionId": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "score": 85.5,
      "createdAt": "2024-01-15T10:30:00"
    }
  ]
}
```

### 2. Get Cheating Statistics
**GET** `/analytics/cheating-stats`

**Query Parameters:**
- `examId` (required, UUID): Exam ID to get statistics for

**Example Request:**
```bash
curl "http://localhost:9004/analytics/cheating-stats?examId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "success": true,
  "message": "Cheating statistics fetched successfully",
  "data": {
    "examId": "550e8400-e29b-41d4-a716-446655440000",
    "totalSubmissions": 3,
    "suspiciousEventsCount": 1,
    "eventTypeDistribution": {
      "face_detection": 2,
      "tab_switch": 2,
      "suspicious_activity": 1
    },
    "cheatingRiskScore": 0.3333333333333333
  }
}
```

**Lưu ý:** Nếu không có events, sẽ bị lỗi chia cho 0. Cần đảm bảo có ít nhất 1 event trong database.

### 3. Get Dashboard Data
**GET** `/analytics/dashboards`

**Query Parameters:**
- `userId` (required, UUID): User ID to get dashboard data for

**Example Request:**
```bash
curl "http://localhost:9004/analytics/dashboards?userId=550e8400-e29b-41d4-a716-446655440002"
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data fetched successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "userRole": "USER",
    "generalStats": {
      "totalExams": 10,
      "averageScore": 75.5
    },
    "recentExamResults": [
      {
        "id": 1,
        "examId": "550e8400-e29b-41d4-a716-446655440000",
        "submissionId": "550e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440002",
        "score": 85.5,
        "createdAt": "2024-01-15T10:30:00"
      }
    ],
    "recommendations": [
      {
        "courseId": 1,
        "courseTitle": "Advanced Java",
        "reason": "Based on low score in Java exam",
        "confidenceScore": 0.8
      }
    ]
  }
}
```

### 4. Get Recommendations
**GET** `/analytics/recommendations`

**Query Parameters:**
- `userId` (required, UUID): User ID to get recommendations for

**Example Request:**
```bash
curl "http://localhost:9004/analytics/recommendations?userId=550e8400-e29b-41d4-a716-446655440002"
```

**Response:**
```json
{
  "success": true,
  "message": "Recommendations fetched successfully",
  "data": [
    {
      "courseId": 1,
      "courseTitle": "Advanced Java",
      "reason": "Based on low score in Java exam",
      "confidenceScore": 0.8
    },
    {
      "courseId": 2,
      "courseTitle": "Spring Boot Microservices",
      "reason": "Popular course",
      "confidenceScore": 0.7
    }
  ]
}
```

## Test Scripts

### Linux/Mac
```bash
chmod +x test-api.sh
./test-api.sh
```

### Windows (PowerShell)
```powershell
.\test-api.ps1
```

## Testing Checklist

- [ ] Database đã được tạo và schema đã chạy thành công
- [ ] Test data đã được insert
- [ ] Service đang chạy trên port 9004
- [ ] Test GET `/analytics/exam-results` không có parameters
- [ ] Test GET `/analytics/exam-results?examId=<uuid>`
- [ ] Test GET `/analytics/exam-results?userId=<uuid>`
- [ ] Test GET `/analytics/exam-results?examId=<uuid>&userId=<uuid>`
- [ ] Test GET `/analytics/cheating-stats?examId=<uuid>` (đảm bảo có events trong DB)
- [ ] Test GET `/analytics/dashboards?userId=<uuid>`
- [ ] Test GET `/analytics/recommendations?userId=<uuid>`

## Notes

1. **UUID Format**: Sử dụng format chuẩn UUID: `550e8400-e29b-41d4-a716-446655440000`
2. **Cheating Stats**: Cần có ít nhất 1 proctoring event trong database để tránh lỗi chia cho 0
3. **Empty Results**: Nếu không có dữ liệu, API sẽ trả về empty array `[]`
4. **Test Data**: File `insert-test-data.sql` chứa sample data để test

