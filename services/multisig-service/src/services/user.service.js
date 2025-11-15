const identityServiceClient = require('../clients/identityServiceClient');

const getAllIdentityUsers = async (authHeader) => {
  return identityServiceClient.getAllUsers(authHeader);
};

const getIdentityUserById = async (userId, authHeader) => {
  return identityServiceClient.getUserById(userId, authHeader);
};

const getCurrentIdentityUser = async (authHeader) => {
  return identityServiceClient.getCurrentUser(authHeader);
};

module.exports = {
  getAllIdentityUsers,
  getIdentityUserById,
  getCurrentIdentityUser,
};


