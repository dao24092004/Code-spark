# CodeSpark Microservices Platform

Một hệ thống microservices hoàn chỉnh được xây dựng với Spring Boot, bao gồm authentication, authorization, và file management.

## Kiến trúc hệ thống

### Services

1. **Discovery Service** (Port 9999)
   - Netflix Eureka Server
   - Service registration và discovery

2. **Config Server** (Port 8888)
   - Centralized configuration management
   - Git-based configuration

3. **API Gateway** (Port 8080)
   - Route management
   - Load balancing
   - Authentication gateway

4. **Identity Service** (Port 9000)
   - User authentication và authorization
   - JWT token management
   - Role-based access control (RBAC)
   - Inter-service authentication

5. **File Service** (Port 9001)
   - File upload/download
   - File management
   - Storage integration

### Monitoring

- **Prometheus** (Port 9090) - Metrics collection
- **Grafana** (Port 3000) - Visualization dashboard

## Identity Service - Tính năng chính

### Authentication
- JWT-based authentication
- Registration và login endpoints
- Token refresh mechanism
- Password change functionality

### Authorization
- Role-based access control
- Permission-based authorization
- Method-level security với `@PreAuthorize`

### Roles và Permissions

#### Default Roles:
- **ADMIN**: Full system access
- **MANAGER**: User management permissions
- **USER**: Basic user permissions

#### Default Permissions:
- **USER_READ, USER_WRITE, USER_DELETE**: User management
- **ROLE_READ, ROLE_WRITE, ROLE_DELETE**: Role management  
- **FILE_READ, FILE_WRITE, FILE_DELETE**: File management

### Inter-Service Communication
- Service-to-service authentication
- Token validation endpoints
- Permission checking APIs

## API Endpoints

### Authentication APIs (`/api/v1/auth`)
```
POST /register    - User registration
POST /login       - User login
POST /refresh     - Token refresh
GET  /validate    - Token validation
```

### User Management APIs (`/api/v1/users`)
```
GET  /profile     - Current user profile
GET  /{id}        - Get user by ID
GET  /            - Get all users (ADMIN only)
PUT  /{id}        - Update user
PUT  /{id}/roles  - Assign roles (ADMIN only)
PUT  /{id}/enable - Enable user (ADMIN only)
PUT  /{id}/disable- Disable user (ADMIN only)
DELETE /{id}      - Delete user (ADMIN only)
POST /change-password - Change password
```

### Inter-Service APIs (`/api/v1/inter-service`)
```
POST /validate-token        - Validate token for services
POST /check-permission      - Check user permission
POST /check-role           - Check user role
POST /check-any-role       - Check multiple roles
POST /check-any-permission - Check multiple permissions
POST /generate-service-token - Generate service token
```

## Cấu hình Database

### Entities
- **User**: Thông tin người dùng
- **Role**: Vai trò hệ thống
- **Permission**: Quyền truy cập cụ thể

### Relationships
- User ↔ Role: Many-to-Many
- Role ↔ Permission: Many-to-Many

## Security Features

### JWT Configuration
- Access token: 24 hours
- Refresh token: 7 days
- Secure key management

### Password Security
- BCrypt password encoding
- Password strength validation

### API Security
- CORS configuration
- Rate limiting ready
- Input validation

## Cách chạy hệ thống

### 1. Prerequisites
```bash
- Java 21+
- Docker & Docker Compose
- Maven 3.6+
```

### 2. Clone và Build
```bash
git clone <repository>
cd code_spark
mvn clean compile
```

### 3. Chạy với Docker Compose
```bash
docker-compose up -d
```

### 4. Default Users
```
Admin: admin@codespark.com / admin123
User:  user@codespark.com  / user123
```

## Configuration

### Environment Variables
```bash
EUREKA_URL=http://localhost:9999/eureka/
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Application Properties
Xem file `services/identity-service/src/main/resources/application.properties`

## Monitoring và Logging

- Application logs với structured logging
- Metrics export tới Prometheus
- Health checks cho tất cả services
- Distributed tracing ready

## Development Guidelines

### Thêm Permission mới:
```java
// 1. Add permission in DataInitializer
createPermissionIfNotExists("NEW_PERMISSION", "Description", "RESOURCE", "ACTION");

// 2. Assign to roles
role.getPermissions().add(newPermission);

// 3. Use in controllers
@PreAuthorize("hasAuthority('NEW_PERMISSION')")
```

### Thêm Role mới:
```java
// 1. Create role in DataInitializer
Role newRole = createRoleIfNotExists("NEW_ROLE", "Description");

// 2. Assign permissions
newRole.setPermissions(permissionSet);

// 3. Use in security
@PreAuthorize("hasRole('NEW_ROLE')")
```

## Tích hợp với Services khác

### Validate User Token:
```java
// Call identity service
POST /api/v1/inter-service/validate-token?token={jwt}

// Response
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "admin",
    "roles": ["ADMIN"],
    "permissions": ["USER_READ", "USER_WRITE", ...]
  }
}
```

### Check Permission:
```java
POST /api/v1/inter-service/check-permission?token={jwt}&permission=FILE_READ
```

## Troubleshooting

### Common Issues:
1. **Port conflicts**: Kiểm tra ports đã được sử dụng
2. **Database connection**: Verify PostgreSQL credentials
3. **Eureka registration**: Kiểm tra discovery service status
4. **JWT validation**: Verify token format và secret key

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes với descriptive messages
4. Create Pull Request với detailed description

## License

MIT License - see LICENSE file for details.