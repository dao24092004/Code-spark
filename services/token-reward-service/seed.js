// seed.js

const users = [
  { id: 1, tokenBalance: 100, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, tokenBalance: 50, createdAt: new Date(), updatedAt: new Date() },
];

const rewards = [
  { studentId: 1, tokensAwarded: 10, reasonCode: 'COMPLETE_LESSON', relatedId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', awardedAt: new Date(), transaction_type: 'EARN' },
  { studentId: 2, tokensAwarded: 20, reasonCode: 'COMPLETE_CHALLENGE', relatedId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', awardedAt: new Date(), transaction_type: 'EARN' },
];

module.exports = {
  users,
  rewards,
};
