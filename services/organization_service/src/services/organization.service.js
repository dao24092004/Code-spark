// src/services/organization.service.js

// SỬA LỖI 1: Import toàn bộ đối tượng 'db' (chứa model VÀ kết nối sequelize)
const db = require('../models');

// SỬA LỖI 2: Lấy các model TỪ đối tượng 'db'
const { Organization, OrganizationMember } = db; 

// SỬA LỖI 3: Import kết nối DB khác và QueryTypes
const { identityDbSequelize } = require('../config/db'); 
const { QueryTypes } = require('sequelize');

const organizationService = {

  /**
   * API 1: POST /api/v1/organizations
   */
  async createOrganization(orgData) {
    // SỬA LỖI 4: Dùng 'db.sequelize' (kết nối) để tạo transaction
    const t = await db.sequelize.transaction();
    try {
      const newOrganization = await Organization.create(orgData, { transaction: t });
      await OrganizationMember.create({
        organizationId: newOrganization.id,
        userId: newOrganization.ownerId,
        orgRole: 'org_admin'
      }, { transaction: t });
      await t.commit();
      return newOrganization;
    } catch (error) {
      await t.rollback();
      console.error('Lỗi Service [createOrganization]:', error.message);
      throw new Error('Không thể tạo tổ chức.');
    }
  },

  /**
   * API 2: GET /api/v1/organizations
   */
  async getAllOrganizations() {
    try {
      const organizations = await Organization.findAll({
        order: [['created_at', 'DESC']]
      });
      return organizations;
    } catch (error) {
      console.error('Lỗi Service [getAllOrganizations]:', error.message);
      throw new Error('Không thể lấy danh sách tổ chức.');
    }
  },

  /**
   * API 3: PUT /api/v1/organizations/:id
   */
  async updateOrganization(id, dataToUpdate) {
    try {
      const organization = await Organization.findByPk(id);
      if (!organization) throw new Error('OrganizationNotFound');
      const updatedOrganization = await organization.update(dataToUpdate);
      return updatedOrganization;
    } catch (error) {
      console.error('Lỗi Service [updateOrganization]:', error.message);
      if (error.message === 'OrganizationNotFound') throw error;
      throw new Error('Không thể cập nhật tổ chức.');
    }
  },

  /**
   * API 4: GET /api/v1/organizations/:id
   */
  async getOrganizationById(id) {
    try {
      const organization = await Organization.findByPk(id);
      if (!organization) throw new Error('OrganizationNotFound');
      return organization;
    } catch (error) {
      console.error('Lỗi Service [getOrganizationById]:', error.message);
      if (error.message === 'OrganizationNotFound') throw error;
      throw new Error('Không thể lấy thông tin tổ chức.');
    }
  },

  /**
   * API 5: DELETE /api/v1/organizations/:id
   */
  async deleteOrganization(id) {
    try {
      const organization = await Organization.findByPk(id);
      if (!organization) throw new Error('OrganizationNotFound');
      await organization.destroy();
      return;
    } catch (error) {
      console.error('Lỗi Service [deleteOrganization]:', error.message);
      if (error.message === 'OrganizationNotFound') throw error;
      throw new Error('Không thể xóa tổ chức.');
    }
  },

  /**
   * API 6: POST /api/v1/organizations/:orgId/members
   */
  async addMemberToOrganization(orgId, userId, orgRole) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) throw new Error('OrganizationNotFound');

      const user = await identityDbSequelize.query(
        'SELECT id FROM users WHERE id = :userId',
        { replacements: { userId: userId }, type: QueryTypes.SELECT }
      );
      if (!user || user.length === 0) throw new Error('UserNotFound');

      const newMember = await OrganizationMember.create({
        organizationId: orgId, userId: userId, orgRole: orgRole
      });
      return newMember;
    } catch (error) {
      console.error('Lỗi Service [addMemberToOrganization]:', error.message);
      if (error.name === 'SequelizeUniqueConstraintError') throw new Error('UserAlreadyMember');
      if (error.message === 'OrganizationNotFound' || error.message === 'UserNotFound') throw error;
      throw new Error('Không thể thêm thành viên.');
    }
  },

  /**
   * API 7: GET /api/v1/organizations/:orgId/members
   */
  async getOrganizationMembers(orgId) {
    try {
      const members = await OrganizationMember.findAll({
        where: { organizationId: orgId }, raw: true
      });
      if (members.length === 0) return [];

      const userIds = members.map(member => member.userId);

      // Lấy thông tin User (tên, email) từ identity_db
      const users = await identityDbSequelize.query(
        'SELECT id, email, first_name, last_name, avatar_url FROM users WHERE id IN (:userIds)',
        { replacements: { userIds: userIds }, type: QueryTypes.SELECT }
      );
      const userMap = new Map(users.map(u => [u.id, u]));

      // Lấy thông tin Profile (bio) từ profile_db
      // SỬA LỖI 5: Dùng 'db.sequelize' (kết nối) để truy vấn SQL thuần
      const profiles = await db.sequelize.query(
        'SELECT user_id, bio FROM profiles WHERE user_id IN (:userIds)',
        { replacements: { userIds: userIds }, type: QueryTypes.SELECT }
      );
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));

      // Kết hợp (JOIN) dữ liệu bằng tay
      const fullMemberData = members.map(member => {
        const userDetails = userMap.get(member.userId);
        const profileDetails = profileMap.get(member.userId);
        return {
          memberId: member.id, orgRole: member.orgRole, joinedAt: member.joined_at,
          user: {
            userId: member.userId,
            email: userDetails ? userDetails.email : null,
            firstName: userDetails ? userDetails.first_name : null,
            lastName: userDetails ? userDetails.last_name : null,
            avatarUrl: userDetails ? userDetails.avatar_url : null,
            bio: profileDetails ? profileDetails.bio : null
          }
        };
      });
      return fullMemberData;
    } catch (error) {
      console.error('Lỗi Service [getOrganizationMembers]:', error.message);
      throw new Error('Không thể lấy danh sách thành viên.');
    }
  }
};

module.exports = organizationService;