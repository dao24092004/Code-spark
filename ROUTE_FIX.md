# 🔀 Sửa lỗi Route - Trang trắng

## ❌ Vấn đề

Khi click "Tiếp tục học" → Trang hiển thị **trắng tinh**, không có gì!

**URL trong browser:** `/user/course/957aa02a-.../learn` (số ít)  
**Route đã tạo:** `/user/courses/957aa02a-.../learn` (số nhiều)

→ **Route không khớp → React Router không tìm thấy → Trang trắng!**

## 🔍 Nguyên nhân

Trong `CourseProgress.tsx` (component dashboard):

```typescript
// ❌ SAI - navigate đến /user/course/ (số ít)
navigate(`/user/course/${courseId}/learn`)
```

Nhưng route được định nghĩa trong `AppRoutes.tsx`:

```typescript
// ✅ ĐÚNG - route là /user/courses/ (số nhiều)
<Route path="/user/courses/:courseId/learn" element={<CourseLearnPage />} />
```

→ **Mismatch!** URL không khớp route → React Router render nothing → Trang trắng!

## ✅ Giải pháp đã áp dụng

### Sửa CourseProgress.tsx

```typescript
// ✅ ĐÃ SỬA - Thêm 's' vào course
navigate(`/user/courses/${courseId}/learn`)
```

## 🚀 Cách kiểm tra

### 1. Refresh trang

```
F5 hoặc Ctrl+R
```

### 2. Click "Tiếp tục học" lại

**Expect:**
- URL: `/user/courses/...` (có 's')
- Trang hiển thị content ✅

### 3. Check Console

**Before fix:**
- Không có logs (vì component không render)
- Trang trắng

**After fix:**
- Thấy logs: "Fetching course data for:", "Course data:", "Materials:"
- Trang hiển thị UI

## 📋 All Course Routes

Để tham khảo, đây là tất cả routes đã tạo cho courses:

```typescript
// Trong UserLayout (có header/sidebar)
<Route path="courses" element={<UserCoursesPage />} />
  → /user/courses

<Route path="courses/:courseId" element={<CourseDetailPage />} />
  → /user/courses/:courseId

// Standalone (fullscreen, không layout)
<Route path="/user/courses/:courseId/learn" element={<CourseLearnPage />} />
  → /user/courses/:courseId/learn
```

**Lưu ý:** Tất cả đều dùng **`courses`** (số nhiều) ✅

## 🔗 Navigation Flow

```
Dashboard (UserHomePage)
  ↓ Click "Xem khóa học"
UserCoursesPage (/user/courses)
  ↓ Click course card
CourseDetailPage (/user/courses/:id)
  ↓ Click "Đăng ký học" hoặc "Tiếp tục học"
CourseLearnPage (/user/courses/:id/learn) ✅
```

## 🐛 Common Mistakes

### Mistake 1: Typo trong route
```typescript
// ❌ SAI
navigate('/user/course/learn')   // Thiếu 's'
navigate('/user/corses/learn')   // Sai chính tả
navigate('/courses/learn')       // Thiếu /user

// ✅ ĐÚNG
navigate('/user/courses/learn')
```

### Mistake 2: Relative vs Absolute path
```typescript
// ❌ Có thể sai
navigate('courses/learn')        // Relative path

// ✅ An toàn
navigate('/user/courses/learn')  // Absolute path
```

### Mistake 3: Missing courseId
```typescript
// ❌ SAI
navigate(`/user/courses/learn`)  // Thiếu courseId

// ✅ ĐÚNG
navigate(`/user/courses/${courseId}/learn`)
```

## ✅ Verification

Để verify routes hoạt động đúng:

### Test Manual Navigation

```javascript
// Trong Console
window.location.href = '/user/courses'
// → Phải hiển thị UserCoursesPage ✅

window.location.href = '/user/courses/some-uuid'
// → Phải hiển thị CourseDetailPage ✅

window.location.href = '/user/courses/some-uuid/learn'
// → Phải hiển thị CourseLearnPage ✅

window.location.href = '/user/course/some-uuid/learn'
// → Trang trắng (route không tồn tại) ❌
```

### Check React Router DevTools

Nếu có React Router DevTools:
- Check active route
- Check matched routes
- Check params

## 🎯 Final Fix Summary

**ĐÃ SỬA:**
1. ✅ CourseProgress.tsx: `/user/course/` → `/user/courses/`
2. ✅ Thêm console.log để debug
3. ✅ Inline styles cho error states
4. ✅ Empty state cho no materials

**CẦN LÀM:**
1. 🔄 Refresh browser (F5)
2. ✅ Click "Tiếp tục học" lại
3. ✅ Trang sẽ hiển thị!

**CHỈ CẦN REFRESH BROWSER LÀ XONG!** 🎉

