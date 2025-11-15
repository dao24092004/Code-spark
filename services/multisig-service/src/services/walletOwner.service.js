const db = require('../models');
const config = require('../config');
const { web3, account: serviceAccount } = require('../config/web3');
const identityServiceClient = require('../clients/identityServiceClient');

const UserWallet = db.UserWallet;

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) {
    throw new Error('Thiếu private key');
  }
  return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
};

const ownerAccountsFromEnv = (() => {
  const keys = config.blockchain.ownerKeys || [];
  return keys.map((key) => {
    const normalized = normalizePrivateKey(key);
    const account = web3.eth.accounts.privateKeyToAccount(normalized);
    return {
      privateKey: normalized,
      privateKeyLower: normalized.toLowerCase(),
      address: account.address.toLowerCase(),
    };
  });
})();

const ensureOwnerKeysConfigured = () => {
  if (!ownerAccountsFromEnv.length) {
    throw new Error('Chưa cấu hình OWNER_PRIVATE_KEYS trong môi trường để gán owner cho sinh viên');
  }
};

const getUsedPrivateKeys = async () => {
  const existing = await UserWallet.findAll({
    attributes: ['privateKey'],
  });
  return new Set(
    existing
      .map((item) => normalizePrivateKey(item.privateKey).toLowerCase())
  );
};

const buildAssignment = (userWallet, userId) => {
  const normalized = normalizePrivateKey(userWallet.privateKey);
  const account = web3.eth.accounts.privateKeyToAccount(normalized);
  return {
    userId: userId.toString(),
    privateKey: normalized,
    address: account.address.toLowerCase(),
    existing: true,
    record: userWallet,
  };
};

const maskPrivateKey = (privateKey) => {
  const normalized = normalizePrivateKey(privateKey);
  return `${normalized.slice(0, 6)}****${normalized.slice(-4)}`;
};

const prepareOwnerAssignments = async (rawOwnerUserIds = []) => {
  ensureOwnerKeysConfigured();

  if (!Array.isArray(rawOwnerUserIds) || rawOwnerUserIds.length === 0) {
    throw new Error('Danh sách owner (sinh viên) không hợp lệ');
  }

  const uniqueUserIds = Array.from(
    new Set(
      rawOwnerUserIds
        .map((id) => id?.toString().trim())
        .filter((id) => id && id.length > 0)
    )
  );

  if (uniqueUserIds.length === 0) {
    throw new Error('Danh sách owner (sinh viên) không hợp lệ');
  }

  const serviceAccountAddress = serviceAccount.address.toLowerCase();
  const usedPrivateKeys = await getUsedPrivateKeys();
  const assignments = [];

  for (const userId of uniqueUserIds) {
    const numericUserId = Number(userId);
    if (Number.isNaN(numericUserId)) {
      throw new Error(`User ID không hợp lệ: ${userId}`);
    }

    const existingWallet = await UserWallet.findOne({
      where: { userId: numericUserId },
    });

    if (existingWallet) {
      assignments.push(buildAssignment(existingWallet, numericUserId));
      usedPrivateKeys.add(
        normalizePrivateKey(existingWallet.privateKey).toLowerCase()
      );
      continue;
    }

    const availableAccount = ownerAccountsFromEnv.find(
      (candidate) =>
        candidate.address !== serviceAccountAddress &&
        !usedPrivateKeys.has(candidate.privateKeyLower)
    );

    if (!availableAccount) {
      throw new Error(
        'Không còn private key Ganache nào khả dụng để gán cho sinh viên. Vui lòng cập nhật OWNER_PRIVATE_KEYS.'
      );
    }

    usedPrivateKeys.add(availableAccount.privateKeyLower);
    assignments.push({
      userId: numericUserId.toString(),
      privateKey: availableAccount.privateKey,
      address: availableAccount.address,
      existing: false,
      record: null,
    });
  }

  return assignments;
};

const persistOwnerAssignments = async (walletId, assignments = []) => {
  if (!walletId) {
    throw new Error('walletId không hợp lệ khi lưu owner');
  }

  for (const assignment of assignments) {
    const numericUserId = Number(assignment.userId);
    if (assignment.existing && assignment.record) {
      if (
        assignment.record.walletId &&
        assignment.record.walletId !== walletId
      ) {
        throw new Error(
          `Sinh viên ${assignment.userId} đã được gán cho ví khác`
        );
      }
      await assignment.record.update({ walletId });
    } else {
      await UserWallet.create({
        userId: numericUserId,
        walletId,
        privateKey: assignment.privateKey,
        label: 'Multisig Owner',
      });
    }
  }
};

const getOwnerDetailsForWallet = async (walletId, authHeader) => {
  if (!walletId) {
    return [];
  }

  const ownerMappings = await UserWallet.findAll({
    where: { walletId },
  });

  if (ownerMappings.length === 0) {
    return [];
  }

  const details = [];
  for (const mapping of ownerMappings) {
    const normalizedKey = normalizePrivateKey(mapping.privateKey);
    const account = web3.eth.accounts.privateKeyToAccount(normalizedKey);
    let identityData = null;
    try {
      const identityResponse = await identityServiceClient.getUserById(
        mapping.userId,
        authHeader
      );
      if (identityResponse && identityResponse.success && identityResponse.data) {
        identityData = identityResponse.data;
      }
    } catch (error) {
      console.warn(
        `[OWNER SERVICE] Không thể lấy thông tin user ${mapping.userId}:`,
        error.message
      );
    }

    details.push({
      userId: mapping.userId.toString(),
      address: account.address.toLowerCase(),
      identity: identityData,
      privateKeyMasked: maskPrivateKey(mapping.privateKey),
    });
  }

  return details;
};

const getCredentialForUser = async (walletId, userId) => {
  if (!walletId || !userId) {
    throw new Error('walletId hoặc userId không hợp lệ');
  }

  const numericUserId = Number(userId);
  const record = await UserWallet.findOne({
    where: {
      walletId,
      userId: numericUserId,
    },
  });

  if (!record) {
    throw new Error('Bạn không phải owner của ví này');
  }

  const normalized = normalizePrivateKey(record.privateKey);
  const account = web3.eth.accounts.privateKeyToAccount(normalized);

  return {
    walletId,
    userId: record.userId.toString(),
    address: account.address,
    privateKey: normalized,
  };
};

module.exports = {
  prepareOwnerAssignments,
  persistOwnerAssignments,
  getOwnerDetailsForWallet,
  getCredentialForUser,
};


