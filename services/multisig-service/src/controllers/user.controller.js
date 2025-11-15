const userService = require('../services/user.service');
const walletOwnerService = require('../services/walletOwner.service');
const asyncHandler = require('../utils/asyncHandler');

const getAllIdentityUsers = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const identityResponse = await userService.getAllIdentityUsers(authHeader);
  res.status(200).json(identityResponse);
});

const getIdentityUserProfile = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const identityResponse = await userService.getCurrentIdentityUser(authHeader);
  res.status(200).json(identityResponse);
});

const getIdentityUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const authHeader = req.headers['authorization'];
  const identityResponse = await userService.getIdentityUserById(userId, authHeader);
  res.status(200).json(identityResponse);
});

const getMyOwnerCredential = asyncHandler(async (req, res) => {
  const { walletId } = req.params;
  const userId = req.userId;
  const credential = await walletOwnerService.getCredentialForUser(walletId, userId);
  res.status(200).json({
    success: true,
    data: credential,
  });
});

module.exports = {
  getAllIdentityUsers,
  getIdentityUserProfile,
  getIdentityUserById,
  getMyOwnerCredential,
};


