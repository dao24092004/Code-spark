# 🔧 Sửa lỗi CORS - Course Service

## ❌ Vấn đề gặp phải

Lỗi CORS khi frontend (`http://localhost:4173`) cố gắng gọi API course-service (`http://localhost:9001`):

```
Access to XMLHttpRequest at 'http://localhost:9001/api/courses?page=0&size=4' 
from origin 'http://localhost:4173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Giải pháp đã áp dụng

### 1. Cấu hình CORS trong SecurityConfig

Đã cập nhật file `Code-spark/services/course-service/src/main/java/com/dao/courseservice/security/SecurityConfig.java`:

**Thêm CORS configuration:**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Cho phép các origin từ frontend
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",  // React dev server
        "http://localhost:4173",  // Vite preview
        "http://localhost:5173",  // Vite dev server
        "http://localhost:8080"   // Other possible port
    ));
    
    // Cho phép tất cả các HTTP methods
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    
    // Cho phép tất cả các headers
    configuration.setAllowedHeaders(Arrays.asList("*"));
    
    // Cho phép gửi credentials (cookies, authorization headers)
    configuration.setAllowCredentials(true);
    
    // Expose các headers để frontend có thể đọc
    configuration.setExposedHeaders(Arrays.asList("Authorization"));
    
    // Cache preflight request trong 1 giờ
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    
    return source;
}
```

**Kích hoạt CORS trong SecurityFilterChain:**
```java
http
    .csrf(csrf -> csrf.disable())
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    // ... rest of configuration
```

### 2. Thêm requestMatchers cho các API endpoints mới

```java
.requestMatchers("/api/courses/**").authenticated()
.requestMatchers("/api/materials/**").authenticated()
.requestMatchers("/api/quizzes/**").authenticated()
.requestMatchers("/api/progress/**").authenticated()
```

## 🚀 Cách áp dụng

### 1. Restart course-service

```bash
# Dừng service hiện tại (Ctrl+C nếu đang chạy)

# Chạy lại service
cd Code-spark/services/course-service
mvn spring-boot:run
```

### 2. Hoặc build lại nếu cần

```bash
cd Code-spark/services/course-service
mvn clean install
mvn spring-boot:run
```

### 3. Kiểm tra

1. **Mở browser và truy cập:** `http://localhost:4173`
2. **Login với user account**
3. **Vào trang:** `/user/courses`
4. **Kiểm tra Console** - không còn lỗi CORS
5. **Xem data** - khóa học sẽ load thành công

## 📋 Checklist sau khi restart

- [ ] Service đã khởi động thành công
- [ ] Truy cập được `http://localhost:9001/actuator/health`
- [ ] Frontend có thể gọi API courses
- [ ] Console không còn lỗi CORS
- [ ] Dữ liệu khóa học hiển thị chính xác
- [ ] Component CourseProgress hiển thị courses

## 🔍 Kiểm tra CORS Headers

Sau khi restart, mở DevTools → Network tab, refresh trang và kiểm tra response headers:

```
Access-Control-Allow-Origin: http://localhost:4173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
```

## ⚠️ Lưu ý

### 1. Production Configuration

Trong production, **KHÔNG nên** cho phép wildcard (`*`) và nên chỉ định cụ thể domain:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://your-production-domain.com"
));
```

### 2. Nếu vẫn gặp lỗi

Kiểm tra:
- Service đã restart chưa?
- Port 9001 có đang được sử dụng không?
- Frontend đang chạy ở port nào? (kiểm tra console log)
- JWT token có hợp lệ không?

### 3. Nếu muốn tắt authentication tạm thời (chỉ để test)

```java
.requestMatchers("/api/courses/**").permitAll()
```

**Nhưng nhớ bật lại sau khi test xong!**

## 🎯 Expected Result

Sau khi restart course-service, bạn sẽ thấy:

1. ✅ **Không còn lỗi CORS** trong Console
2. ✅ **API calls thành công** (status 200)
3. ✅ **Dữ liệu courses hiển thị** trong UI
4. ✅ **Component CourseProgress** load được courses
5. ✅ **Trang /user/courses** hiển thị danh sách khóa học

## 🐛 Troubleshooting

### Vẫn còn lỗi 401 Unauthorized?

→ Kiểm tra JWT token trong localStorage/sessionStorage
→ Đảm bảo user đã login đúng
→ Kiểm tra user có quyền `COURSE_READ` không

### Vẫn còn lỗi CORS?

→ Clear browser cache
→ Restart cả frontend và backend
→ Kiểm tra lại port numbers

### Lỗi kết nối?

→ Kiểm tra course-service có đang chạy không
→ Test trực tiếp: `curl http://localhost:9001/actuator/health`

## 📚 Tài liệu tham khảo

- [Spring Security CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

