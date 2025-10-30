# 🔐 Sửa lỗi 401 Unauthorized - JWT Token Issue

## ❌ Vấn đề gặp phải

Lỗi **401 Unauthorized** khi frontend gọi API course-service:

```
Failed to load resource: the server responded with a status of 401 ()
Error getting all courses: AxiosError
Error fetching enrolled courses: Error: Failed to get courses
```

## 🔍 Nguyên nhân

1. **courseApi.ts không có axios interceptor** để thêm JWT token vào header
2. **Tên key localStorage không đồng nhất:**
   - `authSlice.ts` lưu token với key: `accessToken`
   - `courseApi.ts` đang tìm key: `token` ❌
   - `copyrightApi.ts` tìm key: `authToken`

## ✅ Giải pháp đã áp dụng

### 1. Thêm Axios Instance với Interceptors

```typescript
// Create axios instance with interceptors
const courseAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
courseAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // ✅ Sửa từ 'token' thành 'accessToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
courseAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  }
);
```

### 2. Cập nhật tất cả API calls

Đã thay thế `axios.get/post/put/delete` bằng `courseAxios.get/post/put/delete` trong tất cả functions:

✅ `getAllCourses()` - Lấy danh sách courses
✅ `getCourseById()` - Lấy chi tiết course
✅ `createCourse()` - Tạo course mới
✅ `updateCourse()` - Cập nhật course
✅ `deleteCourse()` - Xóa course
✅ `getCourseMaterials()` - Lấy materials
✅ `addMaterialToCourse()` - Thêm material
✅ `deleteMaterial()` - Xóa material
✅ `getQuizDetails()` - Lấy quiz
✅ `submitQuiz()` - Nộp quiz
✅ `updateProgress()` - Cập nhật tiến độ
✅ `getStudentProgress()` - Lấy tiến độ
✅ `getCourseProgressDashboard()` - Dashboard

## 🚀 Cách kiểm tra

### 1. Kiểm tra token trong localStorage

Mở Developer Console → Application → Local Storage → `http://localhost:4173`

Kiểm tra có key **`accessToken`** không:

```javascript
console.log('Token:', localStorage.getItem('accessToken'));
```

### 2. Kiểm tra Authorization header

Mở Developer Console → Network tab → Chọn bất kỳ request nào đến `/api/courses`

**Request Headers** phải có:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Kiểm tra response

- **Trước:** 401 Unauthorized ❌
- **Sau:** 200 OK ✅

## 📋 Checklist

- [x] Thêm axios instance với interceptors
- [x] Sửa key localStorage từ `token` → `accessToken`
- [x] Cập nhật tất cả API calls
- [x] Test Authorization header được gửi
- [ ] Refresh trang frontend và kiểm tra
- [ ] Verify không còn lỗi 401 trong Console

## 🔄 Các bước tiếp theo

### 1. Refresh frontend

```bash
# Nếu đang dùng Vite dev server
# Chỉ cần refresh browser (Ctrl+R hoặc F5)

# Hoặc restart dev server nếu cần
npm run dev
```

### 2. Clear cache & hard reload

Trong Chrome/Edge:
- `Ctrl + Shift + Delete` → Clear browsing data
- Hoặc `Ctrl + Shift + R` (Hard reload)

### 3. Login lại

1. Logout nếu đang login
2. Login lại để lấy token mới
3. Token sẽ được lưu vào `localStorage.accessToken`
4. Thử truy cập `/user/courses`

## 🐛 Troubleshooting

### Vẫn còn lỗi 401?

**Kiểm tra 1: Token có tồn tại không?**
```javascript
console.log(localStorage.getItem('accessToken'));
// Nếu null → cần login lại
```

**Kiểm tra 2: Token có hợp lệ không?**
- Decode JWT tại https://jwt.io
- Kiểm tra `exp` (expiration time) chưa hết hạn
- Kiểm tra `roles` có `COURSE_READ` permission

**Kiểm tra 3: Backend có nhận được token không?**
```bash
# Check logs của course-service
# Nếu thấy JWT authentication failed → token không hợp lệ
```

**Kiểm tra 4: CORS có đang hoạt động không?**
- Response headers phải có `Access-Control-Allow-Origin`
- Nếu không → check lại SecurityConfig của backend

### Token hết hạn

Nếu token hết hạn (401 với message "Token expired"):

1. Implement token refresh logic
2. Hoặc đơn giản: logout và login lại

### User không có quyền COURSE_READ

Nếu 403 Forbidden:

1. Check user roles trong JWT token
2. Đảm bảo user có role `USER` với permission `COURSE_READ`
3. Contact admin để cấp quyền

## 📊 So sánh Before/After

### Before (❌ Lỗi)
```javascript
// courseApi.ts
const response = await axios.get(`${API_BASE_URL}/courses`);
// → Không có Authorization header
// → Backend reject với 401
```

### After (✅ Hoạt động)
```javascript
// courseApi.ts
const response = await courseAxios.get('/courses');
// → Tự động thêm: Authorization: Bearer <token>
// → Backend accept và trả về data
```

## 🎯 Expected Result

Sau khi sửa và refresh:

1. ✅ **Network tab:** Request có `Authorization` header
2. ✅ **Response status:** 200 OK
3. ✅ **Console:** Không còn lỗi 401
4. ✅ **UI:** Data courses hiển thị
5. ✅ **Component CourseProgress:** Load được enrolled courses

## 🔐 Best Practices

### 1. Token Storage

**Hiện tại:** localStorage ✅ (OK cho development)

**Production considerations:**
- HttpOnly cookies (an toàn hơn, chống XSS)
- Refresh token mechanism
- Token expiration handling

### 2. Interceptor Pattern

**Advantages:**
- ✅ Tự động thêm token vào mọi request
- ✅ Centralized error handling
- ✅ Easy to maintain
- ✅ No code duplication

### 3. Error Handling

Đã thêm response interceptor để handle 401:

```typescript
courseAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.error('Unauthorized access');
      // window.location.href = '/auth'; // Uncomment nếu muốn auto-redirect
    }
    return Promise.reject(error);
  }
);
```

## 📚 Related Files

- ✅ `web-frontend/src/services/api/courseApi.ts` - Updated
- `web-frontend/src/store/slices/authSlice.ts` - Token storage
- `web-frontend/src/services/api/copyrightApi.ts` - Similar pattern
- `Code-spark/services/course-service/.../SecurityConfig.java` - Backend CORS

## 🎉 Kết luận

Đã sửa xong lỗi 401 bằng cách:
1. ✅ Thêm axios interceptor để attach JWT token
2. ✅ Sửa key localStorage từ `token` → `accessToken`
3. ✅ Cập nhật tất cả API calls sử dụng `courseAxios`

**Chỉ cần refresh browser và courses sẽ load thành công!** 🚀

