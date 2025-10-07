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



Ok 👍 bạn chỉ muốn tác động vào **2 DB** (`mongo-db` và `postgres-db`) thôi thì làm như sau:

### Bước 1: Dừng container

```bash
docker compose stop mongo-db postgres-db
```

### Bước 2: Xóa container

```bash
docker compose rm -f mongo-db postgres-db
```

### Bước 3: Xóa image cũ

```bash
docker rmi mongo:latest
docker rmi postgres:latest
```

(Nếu image đang bị “dangling” thì dùng `docker images` để xem rồi `docker rmi <IMAGE_ID>`.)

### Bước 4: Chạy lại và pull image mới

```bash
docker compose up -d mongo-db postgres-db
```

👉 Như vậy chỉ MongoDB và Postgres bị down → remove → pull lại, còn Kafka với Redis vẫn chạy bình thường.

Bạn có muốn mình viết luôn đoạn `docker-compose.yml` mẫu cho 2 DB này (Mongo + Postgres) để dễ tái sử dụng không?



Bạn muốn **xem các database con bên trong PostgreSQL** (tức là các DB được tạo trong 1 instance Postgres). Có vài cách:

---

### 🔹 Cách 1: Dùng `psql` trong container

1. Vào container `postgres-db`:

```bash
docker exec -it postgres-db psql -U postgres
```

(`postgres` là user mặc định, bạn đổi nếu khác)

2. Sau đó gõ:

```sql
\l
```

hoặc

```sql
\list
```

👉 Sẽ hiện ra tất cả database trong PostgreSQL.

3. Nếu muốn kết nối vào 1 DB cụ thể:

```sql
\c <database_name>
```

---

### 🔹 Cách 2: Dùng lệnh trực tiếp từ ngoài container

```bash
docker exec -it postgres-db psql -U postgres -c "\l"
```

---

### 🔹 Cách 3: Dùng GUI tool (nếu bạn muốn dễ thao tác)

* **pgAdmin** (web UI của Postgres)
* **DBeaver** hoặc **TablePlus** (kết nối qua cổng `5432` đã map ra)

Kết nối bằng thông tin:

* Host: `localhost`
* Port: `5432`
* User: `postgres` (mặc định)
* Password: (bạn đặt trong `docker-compose.yml`)

---

👉 Bạn muốn mình viết luôn câu lệnh `docker exec` để vừa vào `postgres-db` vừa show hết các DB ngay không?

✦ Rất vui được làm rõ khi nào nên sử dụng từng thành phần. Dưới đây là các tình huống sử dụng cụ thể cho mỗi loại.

  ---

  1. Khi nào dùng AppException

  => Dùng bên trong các class Service (`@Service`) khi logic nghiệp vụ của bạn gặp một lỗi có thể lường trước được.

  Đây là thành phần bạn sẽ sử dụng nhiều nhất trong lúc viết code hàng ngày.

  Các ví dụ cụ thể:

   * Xác thực thất bại: Người dùng cung cấp sai mật khẩu hoặc email không tồn tại.

   1     // trong AuthService
   2     throw new AppException("Tên đăng nhập hoặc mật khẩu không hợp lệ", HttpStatus.UNAUTHORIZED);
   * Không tìm thấy tài nguyên: Cố gắng lấy một người dùng với ID không có trong cơ sở dữ liệu.

   1     // trong UserService
   2     User user = userRepository.findById(id)
   3         .orElseThrow(() -> new AppException("Không tìm thấy người dùng với id: " + id, HttpStatus.NOT_FOUND));
   * Dữ liệu đầu vào không hợp lệ (về mặt logic): Người dùng cố gắng chuyển nhiều tiền hơn số dư họ có.
   1     // trong PaymentService
   2     if (amount > balance) {
   3         throw new AppException("Số dư không đủ", HttpStatus.BAD_REQUEST);
   4     }
   * Xung đột dữ liệu: Người dùng đăng ký một email đã được sử dụng.
   1     // trong UserService
   2     if (userRepository.existsByEmail(email)) {
   3         throw new AppException("Email này đã được sử dụng", HttpStatus.CONFLICT);
   4     }

  Tóm lại: Bất cứ khi nào bạn có một câu lệnh if để kiểm tra một điều kiện lỗi về nghiệp vụ, bạn nên throw new AppException.

  ---

  2. Khi nào dùng ApiResponse

  => Dùng làm kiểu dữ liệu trả về (return type) cho các phương thức trong Controller (`@RestController`) đối với các trường hợp xử lý thành công.

  Bạn chỉ cần tạo ra các ApiResponse cho các kịch bản thành công.

  Ví dụ cụ thể:

   1 @GetMapping("/{id}")
   2 public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
   3     // userService.findById có thể ném ra AppException nếu không tìm thấy
   4     UserDto user = userService.findById(id);
   5 
   6     // Nếu code chạy đến đây, nghĩa là đã thành công
   7     return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", user));
   8 }

  Quan trọng: Bạn không cần phải tự tay tạo ApiResponse.error(...) trong Controller nữa. GlobalExceptionHandler sẽ làm việc đó giúp bạn khi có lỗi
  xảy ra.

  ---

  3. Khi nào dùng (chỉnh sửa) GlobalExceptionHandler

  => Bạn chỉ cần chỉnh sửa file này khi bạn muốn thêm một cách xử lý đặc biệt cho một loại Exception có sẵn của Java/Spring hoặc của một thư viện 
  bên thứ ba nào đó.

  Đây là thành phần "cài đặt một lần và quên đi". Bạn sẽ ít khi phải động vào nó.

  Ví dụ cụ thể:

  Giả sử hệ thống của bạn có một yêu cầu rất đặc biệt là khi có lỗi về ràng buộc dữ liệu trong database (ví dụ: DataIntegrityViolationException),
  bạn không muốn nó trả về lỗi 500 chung chung, mà muốn trả về một thông báo cụ thể hơn với mã lỗi 409 (Conflict).

  Lúc đó, bạn sẽ mở file GlobalExceptionHandler.java và thêm một phương thức mới:

   1 @ExceptionHandler(DataIntegrityViolationException.class)
   2 public ResponseEntity<ApiResponse<Object>> handleDatabaseConflict(DataIntegrityViolationException ex) {
   3     return ResponseEntity
   4             .status(HttpStatus.CONFLICT) // 409
   5             .body(ApiResponse.error("Lỗi xung đột dữ liệu trong cơ sở dữ liệu."));
   6 }

  Bảng Tóm Tắt Nhanh

  | Component                | Dùng Khi Nào?                                                                                             |

ℹA potential loop was detected. This can happen due to repetitive tool calls or other model behavior. The request has been halted.