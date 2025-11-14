const axios = require('axios');
const config = require('../config');
const serviceDiscovery = require('../discovery/client');

class IdentityServiceClient {
  constructor() {
    this.cachedBaseUrl = config.identity.baseUrl;
    this.serviceName = config.identity.serviceName || 'IDENTITY-SERVICE';
    this.timeout = config.identity.timeout || 5000;
    this.serviceToken = config.identity.serviceToken;
  }

  async getBaseUrl() {
    if (this.cachedBaseUrl) {
      return this.cachedBaseUrl;
    }

    if (config.discovery.enabled) {
      try {
        const serviceInfo = await serviceDiscovery.discoverService(this.serviceName);
        this.cachedBaseUrl = serviceInfo.url;
        return this.cachedBaseUrl;
      } catch (error) {
        console.warn(
          `[IDENTITY CLIENT] ⚠️ Could not resolve service via discovery (${this.serviceName}):`,
          error.message
        );
      }
    }

    // Fallback to localhost default if nothing configured
    this.cachedBaseUrl = 'http://localhost:9000';
    return this.cachedBaseUrl;
  }

  buildHeaders(authHeader, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (authHeader) {
      headers.Authorization = authHeader;
    }
    if (this.serviceToken) {
      headers['X-Service-Token'] = this.serviceToken;
    }
    return headers;
  }

  async request(options, authHeader) {
    const baseURL = await this.getBaseUrl();
    try {
      return await axios({
        baseURL,
        timeout: this.timeout,
        ...options,
        headers: this.buildHeaders(authHeader, options.headers),
      });
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        const message =
          (data && (data.message || data.error || data.details)) ||
          `Identity service responded with status ${status}`;
        throw new Error(message);
      }

      if (error.request) {
        throw new Error('Không nhận được phản hồi từ identity-service');
      }

      throw new Error(error.message || 'Lỗi khi gọi identity-service');
    }
  }

  async getAllUsers(authHeader) {
    const response = await this.request(
      {
        method: 'GET',
        url: '/api/v1/users',
      },
      authHeader
    );
    return response.data;
  }

  async getUserById(userId, authHeader) {
    if (!userId) {
      throw new Error('Thiếu userId');
    }
    const response = await this.request(
      {
        method: 'GET',
        url: `/api/v1/users/${userId}`,
      },
      authHeader
    );
    return response.data;
  }

  async getCurrentUser(authHeader) {
    if (!authHeader) {
      throw new Error('Thiếu Authorization header để lấy thông tin user');
    }
    const response = await this.request(
      {
        method: 'GET',
        url: '/api/v1/users/profile',
      },
      authHeader
    );
    return response.data;
  }
}

module.exports = new IdentityServiceClient();


