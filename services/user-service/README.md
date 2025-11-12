# User Service

User Service cung cấp API CRUD đơn giản để quản lý người dùng sử dụng chung cơ sở dữ liệu `identity_db` với Identity Service.

## Công nghệ chính
- Java 21, Spring Boot 3
- Spring Data JPA, PostgreSQL
- Springdoc OpenAPI (Swagger UI)
- Netflix Eureka Client

## Cấu hình chạy nhanh
```bash
# Bên ngoài service, đặt các biến môi trường nếu cần
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/identity_db
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=password

# Sau đó chạy service
mvn spring-boot:run
```

Service mặc định lắng nghe cổng `9010`.

## Các endpoint chính
- `POST /api/v1/users`: Tạo người dùng mới, tự động băm mật khẩu và gán vai trò mặc định `USER` nếu không truyền danh sách vai trò.
- `GET /api/v1/users`: Lấy danh sách người dùng (hỗ trợ phân trang qua query `page`, `size`, `sort`).
- `GET /api/v1/users/{id}`: Lấy thông tin chi tiết một người dùng.
- `PUT /api/v1/users/{id}`: Cập nhật thông tin người dùng, có thể cập nhật mật khẩu (được băm lại) và danh sách vai trò.
- `DELETE /api/v1/users/{id}`: Xóa người dùng.

Tất cả response đều sử dụng chuẩn `ApiResponse` dùng chung từ module `common-library`.

## Swagger UI
Sau khi service chạy, truy cập `http://localhost:9010/swagger-ui.html` để xem tài liệu API.

## Lưu ý
- Service này chỉ thực hiện CRUD người dùng, không triển khai các luồng xác thực phức tạp như Identity Service.
- Gán vai trò yêu cầu các tên vai trò đã tồn tại trong bảng `roles` của `identity_db`.
