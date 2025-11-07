const organizationService = require('../services/organization.service');

const organizationController = {
  /**
   * API 1: POST /api/v1/organizations
   * Nhận request, gọi service
   */
  async createOrganization(req, res) {
    try {
      const orgData = req.body;

      if (!orgData.name || !orgData.owner_id) {
        return res.status(400).json({ 
          message: 'Tên (name) và ID chủ sở hữu (owner_id) là bắt buộc.' 
        });
      }
      
      const dataToCreate = {
        ...orgData,
        ownerId: orgData.owner_id 
      };

      const newOrganization = await organizationService.createOrganization(dataToCreate);

      res.status(201).json({
        message: 'Tạo tổ chức thành công!',
        data: newOrganization
      });

    } catch (error) {
      console.error('Lỗi Controller [createOrganization]:', error.message);
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },

  /**
   * API 2: GET /api/v1/organizations
   * Nhận request, gọi service
   */
  async getAllOrganizations(req, res) {
    try {
      // 1. Gọi Service
      const organizations = await organizationService.getAllOrganizations();

      // 2. Trả về thành công
      res.status(200).json({
        message: 'Lấy danh sách tổ chức thành công!',
        data: organizations
      });

    } catch (error) {
      console.error('Lỗi Controller [getAllOrganizations]:', error.message);
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 3: PUT /api/v1/organizations/:id
   * Nhận request, gọi service
   */
  async updateOrganization(req, res) {
    try {
      // 1. Lấy ID từ URL (ví dụ: /api/v1/organizations/1)
      const { id } = req.params; 
      
      // 2. Lấy dữ liệu cần cập nhật từ body
      const dataToUpdate = req.body; 

      // 3. Gọi Service
      const updatedOrganization = await organizationService.updateOrganization(id, dataToUpdate);

      // 4. Trả về thành công
      res.status(200).json({
        message: 'Cập nhật tổ chức thành công!',
        data: updatedOrganization
      });

    } catch (error) {
      console.error('Lỗi Controller [updateOrganization]:', error.message);

      // 5. Xử lý lỗi (nếu service ném lỗi 404)
      if (error.message === 'OrganizationNotFound') {
        return res.status(404).json({ 
          message: 'Lỗi: Không tìm thấy tổ chức với ID này.'
        });
      }

      // Lỗi 500 chung
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 4: GET /api/v1/organizations/:id
   * Nhận request, gọi service
   */
  async getOrganizationById(req, res) {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      res.status(200).json({
        message: 'Lấy thông tin tổ chức thành công!',
        data: organization
      });

    } catch (error) {
      console.error('Lỗi Controller [getOrganizationById]:', error.message);
      if (error.message === 'OrganizationNotFound') {
        return res.status(404).json({ 
          message: 'Lỗi: Không tìm thấy tổ chức với ID này.'
        });
      }
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },

  /**
   * API 5: DELETE /api/v1/organizations/:id
   * Nhận request, gọi service
   */
  async deleteOrganization(req, res) {
    try {
      const { id } = req.params;
      await organizationService.deleteOrganization(id);

      // Trả về 200 OK (hoặc 204 No Content)
      res.status(200).json({
        message: 'Xóa tổ chức thành công!'
      });

    } catch (error) {
      console.error('Lỗi Controller [deleteOrganization]:', error.message);
      if (error.message === 'OrganizationNotFound') {
        return res.status(404).json({ 
          message: 'Lỗi: Không tìm thấy tổ chức với ID này.'
        });
      }
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 6: POST /api/v1/organizations/:orgId/members
   * Nhận request, gọi service
   */
  async addMember(req, res) {
    try {
      // 1. Lấy ID tổ chức từ URL
      const { orgId } = req.params;
      
      // 2. Lấy thông tin user và vai trò từ body
      const { userId, orgRole } = req.body;

      // 3. Validation
      if (!userId || !orgRole) {
        return res.status(400).json({
          message: 'userId (ID của user) và orgRole (vai trò) là bắt buộc.'
        });
      }

      // 4. Gọi Service
      const newMember = await organizationService.addMemberToOrganization(orgId, userId, orgRole);

      // 5. Trả về thành công
      res.status(201).json({
        message: 'Thêm thành viên vào tổ chức thành công!',
        data: newMember
      });

    } catch (error) {
      console.error('Lỗi Controller [addMember]:', error.message);
      
      // 6. Xử lý lỗi 404
      if (error.message === 'OrganizationNotFound') {
        return res.status(404).json({ message: 'Lỗi: Không tìm thấy tổ chức này.' });
      }
      if (error.message === 'UserNotFound') {
        return res.status(404).json({ message: 'Lỗi: Không tìm thấy người dùng này.' });
      }
      
      // Lỗi 409 (Conflict) nếu đã tồn tại
      if (error.message === 'UserAlreadyMember') {
        return res.status(409).json({ message: 'Lỗi: Người dùng này đã là thành viên của tổ chức.' });
      }
      
      // Lỗi 500 chung
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 7: GET /api/v1/organizations/:orgId/members
   * Nhận request, gọi service
   */
  async getOrganizationMembers(req, res) {
    try {
      const { orgId } = req.params;
      
      const members = await organizationService.getOrganizationMembers(orgId);

      res.status(200).json({
        message: 'Lấy danh sách thành viên thành công!',
        data: members
      });

    } catch (error) {
      console.error('Lỗi Controller [getOrganizationMembers]:', error.message);
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  }
};

module.exports = organizationController;