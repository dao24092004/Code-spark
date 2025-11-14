-- =====================================================================
-- SCRIPT SỬA LỖI: roleId = NULL trong organization_members
-- =====================================================================

-- 1. Kiểm tra các member có roleId = NULL
-- Chạy trong profile_db:
SELECT 
    id,
    organization_id,
    user_id,
    role_id,
    CASE 
        WHEN role_id IS NULL THEN '❌ roleId là NULL'
        ELSE '✅ roleId hợp lệ: ' || role_id
    END as status
FROM organization_members
WHERE organization_id = 2 AND user_id = 3;

-- 2. Xem các role có sẵn trong identity_db.roles
-- Chạy trong identity_db:
SELECT id, name, description FROM roles ORDER BY id;
-- Kết quả:
-- id=1: ADMIN (System administrator with full access)
-- id=2: USER (Regular user with basic permissions)
-- id=3: MANAGER (Manager with user management permissions)

-- 3. CẬP NHẬT roleId cho member (chạy trong profile_db):
-- Option 1: Gán role ADMIN (id=1) - quyền cao nhất
UPDATE organization_members 
SET role_id = 1 
WHERE organization_id = 2 AND user_id = 3 AND role_id IS NULL;

-- Option 2: Gán role MANAGER (id=3) - quyền quản lý
-- UPDATE organization_members 
-- SET role_id = 3 
-- WHERE organization_id = 2 AND user_id = 3 AND role_id IS NULL;

-- Option 3: Gán role USER (id=2) - quyền cơ bản
-- UPDATE organization_members 
-- SET role_id = 2 
-- WHERE organization_id = 2 AND user_id = 3 AND role_id IS NULL;

-- 4. Kiểm tra lại sau khi cập nhật:
SELECT 
    id,
    organization_id,
    user_id,
    role_id,
    '✅ Đã cập nhật' as status
FROM organization_members
WHERE organization_id = 2 AND user_id = 3;

-- 5. (Tùy chọn) Cập nhật tất cả members có roleId = NULL thành USER (id=2):
-- UPDATE organization_members 
-- SET role_id = 2 
-- WHERE role_id IS NULL;

