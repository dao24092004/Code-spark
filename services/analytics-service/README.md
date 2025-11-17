# Analytics Service

## 📊 Tổng quan

Analytics Service là microservice chịu trách nhiệm thu thập, phân tích và báo cáo dữ liệu từ toàn bộ hệ thống Code-spark. Service này tích hợp với các service khác để cung cấp insights về hiệu suất học tập, xu hướng điểm số, và phát hiện gian lận.

## 🎯 Chức năng chính

### 1. Dashboard Analytics
- Tổng quan hệ thống (users, courses, exams, scores)
- KPI metrics với xu hướng thay đổi
- Biểu đồ xu hướng điểm số theo thời gian
- Top performers và top courses

### 2. Exam Analytics
- Phân tích chi tiết từng bài thi
- Phân bố điểm số (score distribution)
- Tỷ lệ đậu/rớt (pass rate)
- Thống kê gian lận (cheating detection)

### 3. Course Analytics
- Phân tích hiệu quả khóa học
- Tỷ lệ hoàn thành (completion rate)
- Điểm trung bình của học viên
- Danh sách exam trong course

### 4. User Performance
- Lịch sử thi của học viên
- Điểm trung bình và tỷ lệ đậu
- Phân tích điểm mạnh/yếu
- Gợi ý khóa học phù hợp

## 🏗️ Kiến trúc

### Tech Stack
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL
- **Service Discovery**: Eureka
- **API Gateway**: Spring Cloud Gateway
- **HTTP Client**: OpenFeign
- **ORM**: Spring Data JPA / Hibernate

### Microservices Integration

```
┌─────────────────────┐
│  Identity Service   │ ──┐
└─────────────────────┘   │
                          │
┌─────────────────────┐   │    ┌──────────────────────┐
│   Course Service    │ ──┼───▶│  Analytics Service   │
└─────────────────────┘   │    └──────────────────────┘
                          │              │
┌─────────────────────┐   │              │
│    Exam Service     │ ──┘              ▼
└─────────────────────┘           ┌─────────────┐
                                  │  PostgreSQL │
┌─────────────────────┐           └─────────────┘
│ Proctoring Service  │
└─────────────────────┘
```

## 📁 Cấu trúc dự án

```
analytics-service/
├── src/main/java/com/dao/analyticsservice/
│   ├── client/                    # Feign clients
│   │   ├── IdentityServiceClient.java
│   │   ├── CourseServiceClient.java
│   │   ├── ExamServiceClient.java
│   │   └── ProctoringServiceClient.java
│   ├── config/                    # Configuration
│   │   └── FeignClientConfig.java
│   ├── controller/                # REST controllers
│   │   └── AnalyticsController.java
│   ├── dto/                       # Data Transfer Objects
│   │   ├── client/               # DTOs for external services
│   │   │   ├── UserSummaryDto.java
│   │   │   ├── CourseSummaryDto.java
│   │   │   ├── ExamSummaryDto.java
│   │   │   ├── ProctoringEventDto.java
│   │   │   └── PageResponse.java
│   │   ├── request/              # Request DTOs
│   │   │   └── ExamResultsRequest.java
│   │   └── response/             # Response DTOs
│   │       ├── AnalyticsOverviewResponse.java
│   │       ├── KpiMetricResponse.java
│   │       ├── ExamAnalyticsResponse.java
│   │       ├── CourseAnalyticsResponse.java
│   │       ├── UserPerformanceResponse.java
│   │       ├── TopPerformerResponse.java
│   │       ├── TopCourseResponse.java
│   │       └── ScoreTrendPoint.java
│   ├── entity/                    # JPA entities
│   │   ├── ExamResult.java
│   │   ├── ProctoringEvent.java
│   │   ├── User.java
│   │   └── Course.java
│   ├── repository/                # JPA repositories
│   │   ├── ExamResultRepository.java
│   │   ├── ProctoringEventRepository.java
│   │   ├── UserRepository.java
│   │   └── CourseRepository.java
│   ├── service/                   # Business logic
│   │   ├── AnalyticsService.java
│   │   └── AnalyticsServiceImpl.java
│   └── security/                  # Security config
│       └── SecurityConfig.java
├── ANALYTICS_CLIENTS_README.md    # Client integration guide
├── FRONTEND_API_GUIDE.md          # Frontend API documentation
├── DEPLOYMENT_GUIDE.md            # Deployment instructions
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- PostgreSQL 15+
- Eureka Discovery Service running
- Other services (identity, course, exam) running

### 1. Setup Database

```bash
# Create database
createdb analytics_db

# Or using psql
psql -U postgres
CREATE DATABASE analytics_db;
```

### 2. Configure Application

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/analytics_db
    username: postgres
    password: your_password
```

### 3. Build & Run

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run
```

Service sẽ chạy tại: `http://localhost:8087`

## 📚 Documentation

- **[Client Integration Guide](./ANALYTICS_CLIENTS_README.md)**: Chi tiết về các Feign clients và cách tích hợp
- **[Frontend API Guide](./FRONTEND_API_GUIDE.md)**: Hướng dẫn sử dụng API cho frontend developers
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Hướng dẫn deploy và vận hành

## 🔌 API Endpoints

### Dashboard
- `GET /analytics/overview` - Tổng quan hệ thống
- `GET /analytics/kpis` - KPI metrics
- `GET /analytics/score-trend` - Xu hướng điểm
- `GET /analytics/top-performers` - Top học viên
- `GET /analytics/top-courses` - Top khóa học

### Exam Analytics
- `GET /analytics/exams/{examId}` - Chi tiết exam
- `POST /analytics/exam-results/search` - Tìm kết quả thi
- `GET /analytics/cheating-stats` - Thống kê gian lận

### Course Analytics
- `GET /analytics/courses/{courseId}` - Chi tiết course

### User Performance
- `GET /analytics/users/{userId}/performance` - Hiệu suất học viên
- `GET /analytics/dashboards` - Dashboard cá nhân
- `GET /analytics/recommendations` - Gợi ý khóa học

## 🔧 Configuration

### Feign Clients

Service sử dụng OpenFeign để gọi API của các service khác:

```java
@FeignClient(name = "identity-service", path = "/api/v1/users")
public interface IdentityServiceClient {
    @GetMapping("/{id}")
    ApiResponse<UserSummaryDto> getUserById(@PathVariable UUID id);
}
```

### JWT Token Forwarding

`FeignClientConfig` tự động forward Authorization header:

```java
@Bean
public RequestInterceptor requestInterceptor() {
    return template -> {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            String authHeader = attributes.getRequest().getHeader("Authorization");
            if (authHeader != null) {
                template.header("Authorization", authHeader);
            }
        }
    };
}
```

## 📊 Database Schema

### exam_results
```sql
id              BIGSERIAL PRIMARY KEY
exam_id         UUID NOT NULL
submission_id   UUID
user_id         UUID NOT NULL
score           DOUBLE PRECISION NOT NULL
created_at      TIMESTAMP NOT NULL
```

### proctoring_events
```sql
id              UUID PRIMARY KEY
exam_id         UUID NOT NULL
user_id         UUID NOT NULL
event_type      VARCHAR(100) NOT NULL
severity        VARCHAR(50)
description     TEXT
timestamp       TIMESTAMP NOT NULL
```

**Note**: Không có bảng cache cho users và courses. Dữ liệu được lấy trực tiếp từ các service khác qua Feign Clients khi cần thiết.

## 🧪 Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run specific test
mvn test -Dtest=AnalyticsServiceImplTest
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:8087/actuator/health
```

### Metrics
```bash
curl http://localhost:8087/actuator/metrics
```

### Prometheus
```bash
curl http://localhost:8087/actuator/prometheus
```

## 🐛 Troubleshooting

### Service không kết nối được với các service khác

1. Kiểm tra Eureka registration:
```bash
curl http://localhost:8761/eureka/apps/ANALYTICS-SERVICE
```

2. Kiểm tra network connectivity:
```bash
ping identity-service
ping course-service
```

3. Xem logs:
```bash
tail -f logs/analytics-service.log
```

### Database connection issues

```bash
# Test connection
psql -h localhost -U postgres -d analytics_db

# Check if tables exist
\dt
```

## 🔐 Security

- JWT authentication required cho tất cả endpoints
- Token được forward tự động sang các service khác
- Database credentials được lưu trong environment variables
- HTTPS được recommend cho production

## 🚢 Deployment

### Docker

```bash
docker build -t analytics-service:latest .
docker run -p 8087:8087 analytics-service:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
      - name: analytics-service
        image: analytics-service:latest
        ports:
        - containerPort: 8087
        env:
        - name: DB_HOST
          value: postgres-service
        - name: EUREKA_SERVER
          value: http://discovery-service:8761/eureka/
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is part of Code-spark platform.

## 👥 Team

- Backend Team
- Analytics Team
- DevOps Team

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Troubleshooting](#-troubleshooting)
2. Xem [Deployment Guide](./DEPLOYMENT_GUIDE.md)
3. Liên hệ team qua Slack channel #analytics-service

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-16
