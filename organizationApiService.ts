
import axios from 'axios';

// --- Cấu hình cơ bản ---
// Thay đổi baseURL thành địa chỉ của API gateway hoặc service của bạn
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Ví dụ: Cổng của API Gateway
  headers: {
    'Content-Type': 'application/json',
  },
});

// Middleware để tự động thêm token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Giả sử bạn lưu token trong localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Định nghĩa kiểu dữ liệu (nên được đồng bộ với backend) ---
export interface Organization {
  id: number;
  name: string;
  description: string;
  // Thêm các trường khác nếu có...
  createdAt: string;
  updatedAt: string;
}

// --- Các hàm gọi API ---

/**
 * Lấy danh sách tất cả các tổ chức
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  const response = await apiClient.get('/organizations');
  return response.data;
};

/**
 * Lấy thông tin chi tiết của một tổ chức theo ID
 * @param id ID của tổ chức
 */
export const getOrganizationById = async (id: number): Promise<Organization> => {
  const response = await apiClient.get(`/organizations/${id}`);
  return response.data;
};

/**
 * Tạo một tổ chức mới
 * @param organizationData Dữ liệu của tổ chức mới (ví dụ: { name: string, description: string })
 */
export const createOrganization = async (organizationData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> => {
  const response = await apiClient.post('/organizations', organizationData);
  return response.data;
};

/**
 * Cập nhật một tổ chức
 * @param id ID của tổ chức cần cập nhật
 * @param updates Dữ liệu cần cập nhật
 */
export const updateOrganization = async (id: number, updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Organization> => {
  const response = await apiClient.put(`/organizations/${id}`, updates);
  return response.data;
};

/**
 * Xóa một tổ chức
 * @param id ID của tổ chức cần xóa
 */
export const deleteOrganization = async (id: number): Promise<void> => {
  await apiClient.delete(`/organizations/${id}`);
};

/**
 * Lấy danh sách thành viên của một tổ chức
 * @param orgId ID của tổ chức
 */
export const getOrganizationMembers = async (orgId: number): Promise<any[]> => { // Thay 'any' bằng interface Member nếu có
  const response = await apiClient.get(`/organizations/${orgId}/members`);
  return response.data;
};

/**
 * Thêm thành viên vào một tổ chức
 * @param orgId ID của tổ chức
 * @param memberData Dữ liệu thành viên mới
 */
export const addMemberToOrganization = async (orgId: number, memberData: any): Promise<any> => { // Thay 'any' bằng interface Member
  const response = await apiClient.post(`/organizations/${orgId}/members`, memberData);
  return response.data;
};
