# 🔐 Sửa lỗi 403 Forbidden - Permission Issue

## ❌ Vấn đề gặp phải

Lỗi **403 Forbidden** khi frontend gọi API course-service:

```
GET http://localhost:9001/api/courses?page=0&size=12 403 (Forbidden)
Error getting all courses: AxiosError
Request failed with status code 403
```

## 🔍 Nguyên nhân

### 1. Backend yêu cầu quyền COURSE_READ

**CourseController.java:**
```java
@GetMapping
@PreAuthorize("hasAuthority('COURSE_READ')")
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(...)
```

### 2. JwtAuthConverter tìm quyền trong JWT

**JwtAuthConverter.java:**
```java
private static final String ROLES_CLAIM = "roles";
private static final String PERMISSIONS_CLAIM = "permissions";

// Lấy authorities từ claims "roles" và "permissions" trong JWT
```

### 3. JWT token không chứa permission cần thiết

Token từ identity-service **KHÔNG có** claims:
- `permissions: ["COURSE_READ"]`
- hoặc `roles: ["COURSE_READ"]`

## ✅ Giải pháp

### **Giải pháp 1: Tạm thời permitAll() (Development) - ĐÃ ÁP DỤNG**

Cho phép truy cập API không cần kiểm tra permissions để test:

```java
// SecurityConfig.java
.requestMatchers("/api/courses/**").permitAll()
.requestMatchers("/api/materials/**").permitAll()
.requestMatchers("/api/quizzes/**").permitAll()
.requestMatchers("/api/progress/**").permitAll()
```

**Ưu điểm:**
- ✅ Test ngay lập tức
- ✅ Không cần sửa identity-service
- ✅ Frontend hoạt động bình thường

**Nhược điểm:**
- ⚠️ Không có security
- ⚠️ CHỈ dùng cho development
- ⚠️ PHẢI sửa lại cho production

### **Giải pháp 2: Fix Identity Service (Production) - TODO**

Cần cập nhật identity-service để sinh JWT với đúng permissions:

#### Option A: Thêm permissions vào JWT claims

**Trong Identity Service:**
```java
@Service
public class JwtService {
    
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        
        // Thêm roles
        List<String> roles = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toList());
        claims.put("roles", roles);
        
        // Thêm permissions
        List<String> permissions = user.getRoles().stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Permission::getName)
            .distinct()
            .collect(Collectors.toList());
        claims.put("permissions", permissions);
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(user.getEmail())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }
}
```

#### Option B: Cấu hình User có permissions

**Trong database hoặc service:**
```sql
-- Tạo permission
INSERT INTO permissions (name) VALUES ('COURSE_READ');
INSERT INTO permissions (name) VALUES ('COURSE_CREATE');
INSERT INTO permissions (name) VALUES ('COURSE_WRITE');
INSERT INTO permissions (name) VALUES ('COURSE_DELETE');

-- Gán permission cho role USER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'USER' AND p.name IN ('COURSE_READ');
```

#### Option C: Đơn giản hóa - Không dùng @PreAuthorize

**Trong CourseController.java:**
```java
// Bỏ @PreAuthorize, chỉ cần authenticated()
@GetMapping
// @PreAuthorize("hasAuthority('COURSE_READ')") // Bỏ dòng này
public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(...)
```

Và trong SecurityConfig:
```java
.requestMatchers("/api/courses/**").authenticated() // Chỉ cần login
```

## 🚀 Cách áp dụng Giải pháp 1 (Development)

### 1. Restart Course Service

```bash
cd Code-spark/services/course-service
mvn spring-boot:run
```

### 2. Test API

```bash
# Test trực tiếp API
curl http://localhost:9001/api/courses
# Không cần token, sẽ trả về courses
```

### 3. Refresh Frontend

- Refresh browser (F5)
- Data courses sẽ load thành công ✅

## 📋 Checklist

### Development (hiện tại)
- [x] Sửa SecurityConfig → permitAll()
- [ ] Restart course-service
- [ ] Test API hoạt động
- [ ] Frontend load được courses

### Production (sau này)
- [ ] Xác định approach: A, B, hoặc C
- [ ] Implement ở identity-service
- [ ] Test JWT có đúng permissions
- [ ] Đổi SecurityConfig về authenticated()
- [ ] Test end-to-end

## ⚠️ LƯU Ý QUAN TRỌNG

### 🚨 Security Warning

**Giải pháp 1 (permitAll) CHỈ dùng cho development!**

```java
// ❌ KHÔNG DEPLOY LÊN PRODUCTION
.requestMatchers("/api/courses/**").permitAll()

// ✅ Production phải dùng
.requestMatchers("/api/courses/**").authenticated()
```

### 🔍 Kiểm tra JWT Token

Để xem JWT có permissions không:

1. **Lấy token từ localStorage:**
```javascript
console.log(localStorage.getItem('accessToken'));
```

2. **Decode tại https://jwt.io**

3. **Kiểm tra payload:**
```json
{
  "sub": "user@example.com",
  "roles": ["USER"],           // ❌ Thiếu
  "permissions": ["COURSE_READ"], // ❌ Thiếu
  "exp": 1234567890
}
```

### 📝 Recommended Approach

**Cho dự án này, khuyến nghị dùng Option C:**
- Đơn giản nhất
- Chỉ cần authenticated(), không cần permissions
- Phù hợp với học tập, không cần phân quyền phức tạp
- User đã login → có quyền xem courses

**Implementation:**

1. **Bỏ @PreAuthorize ở tất cả endpoints GET:**
```java
@GetMapping
// @PreAuthorize("hasAuthority('COURSE_READ')") // Comment hoặc xóa
public ResponseEntity<...> getAllCourses(...)

@GetMapping("/{courseId}")
// @PreAuthorize("hasAuthority('COURSE_READ')") // Comment hoặc xóa
public ResponseEntity<...> getCourseById(...)
```

2. **Giữ @PreAuthorize cho admin endpoints:**
```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')") // Giữ lại
public ResponseEntity<...> createCourse(...)

@PutMapping("/{courseId}")
@PreAuthorize("hasRole('ADMIN')") // Giữ lại
public ResponseEntity<...> updateCourse(...)

@DeleteMapping("/{courseId}")
@PreAuthorize("hasRole('ADMIN')") // Giữ lại
public ResponseEntity<...> deleteCourse(...)
```

3. **SecurityConfig:**
```java
.requestMatchers("/api/courses/**").authenticated()
```

## 🔧 Quick Fix Commands

```bash
# 1. Sửa file SecurityConfig.java (ĐÃ LÀM)

# 2. Restart service
cd Code-spark/services/course-service
mvn spring-boot:run

# 3. Wait for startup, then test
curl http://localhost:9001/actuator/health

# 4. Refresh frontend
# Press F5 in browser
```

## 🎯 Expected Result

Sau khi restart course-service:

1. ✅ API không còn trả về 403
2. ✅ Response status: 200 OK
3. ✅ Console không còn lỗi
4. ✅ Courses data hiển thị trên UI
5. ✅ Component CourseProgress load được data
6. ✅ Trang /user/courses hiển thị danh sách

## 📚 Related Files

- ✅ `SecurityConfig.java` - Updated (permitAll)
- `JwtAuthConverter.java` - Parse permissions từ JWT
- `CourseController.java` - Yêu cầu COURSE_READ
- `application.properties` - JWT secret config

## 🎉 Kết luận

**Development (hiện tại):**
- Đã permitAll() để test
- Restart service → Hoạt động ngay

**Production (tương lai):**
- Chọn Option C (đơn giản nhất)
- Bỏ @PreAuthorize cho read endpoints
- Giữ authenticated() trong SecurityConfig
- Phân quyền admin cho create/update/delete

